<?php
declare(strict_types=1);

defined('ABSPATH') || exit;

/**
 * Hardened WooCommerce integration (HPOS compatible): strict My Account menu, guest/registration controls,
 * tray sizing rules (500ml=6, 250ml=12, 100ml=24), server-validated delivery windows, Quick Order AJAX, and coupon throttling.
 */
final class Mystore_WooCommerce {
    public static function init(): void {
        // Strict My Account scope (no public forums, blogs, or extraneous social tabs).
        add_filter('woocommerce_account_menu_items', array(self::class, 'restrict_account_menu_items'), 99);
        add_action('woocommerce_after_edit_account_form', array(self::class, 'render_security_controls_in_account'));
        add_filter('woocommerce_my_account_my_orders_actions', array(self::class, 'add_reorder_and_return_actions'), 10, 2);

        // Enforce guest checkout and checkout registration settings from Security Settings API.
        add_filter('pre_option_woocommerce_enable_guest_checkout', array(self::class, 'filter_guest_checkout_option'));
        add_filter('pre_option_woocommerce_enable_signup_and_login_from_checkout', array(self::class, 'filter_checkout_registration_option'));

        // Honeypot field on checkout, login, register, lost-password & coupon forms for bot filtering.
        add_action('woocommerce_after_checkout_billing_form', array(self::class, 'render_honeypot_and_turnstile'));
        add_action('woocommerce_login_form', array(self::class, 'render_honeypot_and_turnstile'));
        add_action('woocommerce_register_form', array(self::class, 'render_honeypot_and_turnstile'));
        add_action('woocommerce_lostpassword_form', array(self::class, 'render_honeypot_and_turnstile'));
        add_action('woocommerce_cart_coupon', array(self::class, 'render_honeypot_and_turnstile'));

        // Server-validated Delivery Window checkout selector (HPOS safe).
        add_filter('woocommerce_checkout_fields', array(self::class, 'add_delivery_window_checkout_field'));
        add_action('woocommerce_checkout_process', array(self::class, 'validate_checkout_request'));
        add_action('woocommerce_checkout_create_order', array(self::class, 'save_delivery_window_to_order'), 10, 2);
        add_action('woocommerce_order_details_after_order_table', array(self::class, 'render_order_delivery_status_box'));

        // Tray size metadata helpers across cart and order items.
        add_filter('woocommerce_get_item_data', array(self::class, 'display_tray_info_in_cart'), 10, 2);
        add_action('woocommerce_checkout_create_order_line_item', array(self::class, 'save_tray_meta_to_order_item'), 10, 4);

        // Coupon brute-force throttling (counts both invalid and valid guesses) + server DB pricing integrity.
        add_filter('woocommerce_coupon_is_valid', array(self::class, 'guard_coupon_rate_limit'), 1, 3);
        add_action('woocommerce_coupon_error', array(self::class, 'record_coupon_attempt_on_error'), 10, 3);
        add_action('woocommerce_applied_coupon', array(self::class, 'throttle_coupon_attempts'));
        add_action('woocommerce_before_calculate_totals', array(self::class, 'enforce_server_catalog_prices'), 999, 1);

        // Quick Order AJAX add-to-cart (both logged-in customers and guest shoppers).
        add_action('wp_ajax_mystore_quick_add', array(self::class, 'handle_quick_add_ajax'));
        add_action('wp_ajax_nopriv_mystore_quick_add', array(self::class, 'handle_quick_add_ajax'));

        // Shortcodes.
        add_shortcode('mystore_quick_order', array(self::class, 'shortcode_quick_order'));
        add_shortcode('mystore_delivery_status', array(self::class, 'shortcode_delivery_status'));
        add_shortcode('mystore_account_security', array(self::class, 'shortcode_account_security'));
    }

    public static function restrict_account_menu_items(array $items): array {
        $allowed = array(
            'dashboard'       => $items['dashboard'] ?? __('Dashboard', 'mystore-security'),
            'orders'          => $items['orders'] ?? __('Orders', 'mystore-security'),
            'edit-address'    => $items['edit-address'] ?? __('Addresses', 'mystore-security'),
            'edit-account'    => $items['edit-account'] ?? __('Account details', 'mystore-security'),
            'customer-logout' => $items['customer-logout'] ?? __('Log out', 'mystore-security'),
        );
        return $allowed;
    }

    public static function render_security_controls_in_account(): void {
        if (!is_user_logged_in()) {
            return;
        }
        $uid     = get_current_user_id();
        $is_2fa  = '1' === (string) get_user_meta($uid, '_mystore_2fa_enabled', true);
        $allow_customer_2fa = !empty(Mystore_Settings::get_option('enable_customer_2fa', 1));
        ?>
        <fieldset class="mystore_account_security_box">
            <legend><?php esc_html_e('Account Security & Sessions', 'mystore-security'); ?></legend>
            <?php if ($allow_customer_2fa) : ?>
                <form method="post" action="<?php echo esc_url(wc_get_page_permalink('myaccount')); ?>" class="mystore_inline_security_form">
                    <?php wp_nonce_field('mystore_toggle_2fa_nonce', '_mystore_nonce'); ?>
                    <input type="hidden" name="mystore_action" value="toggle_customer_2fa" />
                    <label>
                        <input type="checkbox" name="mystore_enable_2fa" value="1" <?php checked($is_2fa, true); ?> />
                        <?php esc_html_e('Require a 6-digit email verification code whenever I sign in', 'mystore-security'); ?>
                    </label>
                    <button type="submit" class="button mystore_btn_secondary"><?php esc_html_e('Save 2FA Preference', 'mystore-security'); ?></button>
                </form>
            <?php endif; ?>
            <form method="post" action="<?php echo esc_url(wc_get_page_permalink('myaccount')); ?>" class="mystore_inline_security_form">
                <?php wp_nonce_field('mystore_logout_all_nonce', '_mystore_nonce'); ?>
                <input type="hidden" name="mystore_action" value="logout_all_devices" />
                <button type="submit" class="button mystore_btn_danger"><?php esc_html_e('Log out of all devices', 'mystore-security'); ?></button>
            </form>
        </fieldset>
        <?php
    }

    public static function add_reorder_and_return_actions(array $actions, WC_Order $order): array {
        if ($order->has_status(array('completed', 'processing'))) {
            $actions['mystore_reorder'] = array(
                'url'  => wp_nonce_url(add_query_arg('order_again', $order->get_id(), wc_get_cart_url()), 'woocommerce-order_again'),
                'name' => __('Reorder', 'mystore-security'),
            );
        }
        return $actions;
    }

    public static function filter_guest_checkout_option(): string {
        return !empty(Mystore_Settings::get_option('allow_guest_checkout', 1)) ? 'yes' : 'no';
    }

    public static function filter_checkout_registration_option(): string {
        return !empty(Mystore_Settings::get_option('offer_checkout_registration', 1)) ? 'yes' : 'no';
    }

    public static function render_honeypot_and_turnstile(): void {
        ?>
        <p class="mystore_hp_wrap" aria-hidden="true">
            <label for="mystore_hp"><?php esc_html_e('Leave this field empty', 'mystore-security'); ?></label>
            <input type="text" name="mystore_hp" id="mystore_hp" value="" tabindex="-1" autocomplete="off" />
        </p>
        <?php
        $site_key = mystore_get_secret_constant('MYSTORE_TURNSTILE_SITE_KEY');
        if ('' !== $site_key && 'turnstile' === Mystore_Settings::get_option('bot_provider', 'turnstile')) {
            printf('<div class="cf-turnstile mystore_turnstile_box" data-sitekey="%s"></div>', esc_attr($site_key));
        }
    }

    public static function delivery_windows(): array {
        return array(
            'morning'   => __('Morning Dispatch (6:00 AM – 10:00 AM)', 'mystore-security'),
            'afternoon' => __('Afternoon Dispatch (12:00 PM – 4:00 PM)', 'mystore-security'),
            'evening'   => __('Evening Dispatch (4:30 PM – 7:30 PM)', 'mystore-security'),
        );
    }

    public static function add_delivery_window_checkout_field(array $fields): array {
        $fields['order']['mystore_delivery_window'] = array(
            'type'     => 'select',
            'label'    => __('Preferred Delivery Window', 'mystore-security'),
            'required' => true,
            'class'    => array('form-row-wide'),
            'options'  => self::delivery_windows(),
            'default'  => 'morning',
        );
        return $fields;
    }

    public static function validate_checkout_request(): void {
        if (!Mystore_Auth::verify_bot_challenge('checkout')) {
            wc_add_notice(__('Security verification failed. Please complete the challenge and resubmit your order.', 'mystore-security'), 'error');
        }

        $window  = isset($_POST['mystore_delivery_window']) ? sanitize_key((string) wp_unslash($_POST['mystore_delivery_window'])) : 'morning';
        $allowed = array_keys(self::delivery_windows());
        if (!in_array($window, $allowed, true)) {
            wc_add_notice(__('Invalid delivery window selection.', 'mystore-security'), 'error');
        }
    }

    public static function save_delivery_window_to_order(WC_Order $order, array $data): void {
        $window  = isset($data['mystore_delivery_window']) ? sanitize_key((string) $data['mystore_delivery_window']) : 'morning';
        $windows = self::delivery_windows();
        if (!isset($windows[$window])) {
            $window = 'morning';
        }
        $order->update_meta_data('_mystore_delivery_window', $window);
        $order->update_meta_data('_mystore_delivery_window_label', $windows[$window]);
    }

    /**
     * Tray calculation rule: 500ml => 6 pcs/tray, 250ml => 12 pcs/tray, 100ml => 24 pcs/tray.
     */
    public static function get_tray_size_for_product(WC_Product $product): int {
        $custom = absint($product->get_meta('_mystore_tray_size', true));
        if ($custom > 1) {
            return $custom;
        }
        $haystack = strtolower($product->get_sku() . ' ' . $product->get_name());
        if (str_contains($haystack, '500')) {
            return 6;
        }
        if (str_contains($haystack, '250')) {
            return 12;
        }
        if (str_contains($haystack, '100')) {
            return 24;
        }
        return 0;
    }

    public static function display_tray_info_in_cart(array $item_data, array $cart_item): array {
        if (!isset($cart_item['data']) || !($cart_item['data'] instanceof WC_Product)) {
            return $item_data;
        }
        $tray_size = self::get_tray_size_for_product($cart_item['data']);
        $qty       = max(1, absint($cart_item['quantity'] ?? 1));
        if ($tray_size > 0) {
            $trays = intdiv($qty, $tray_size);
            $rem   = $qty % $tray_size;
            $label = $trays > 0
                ? sprintf(_n('%d tray (%d pcs/tray)', '%d trays (%d pcs/tray)', $trays, 'mystore-security'), $trays, $tray_size)
                : sprintf(__('%d pcs (Tray = %d pcs)', 'mystore-security'), $qty, $tray_size);
            if ($trays > 0 && $rem > 0) {
                $label .= sprintf(__(' + %d single pcs', 'mystore-security'), $rem);
            }
            $item_data[] = array(
                'key'   => __('Pack Breakdown', 'mystore-security'),
                'value' => esc_html($label),
            );
        }
        return $item_data;
    }

    public static function save_tray_meta_to_order_item(
        WC_Order_Item_Product $item,
        string $cart_item_key,
        array $values,
        WC_Order $order
    ): void {
        $product = $item->get_product();
        if (!($product instanceof WC_Product)) {
            return;
        }
        $tray_size = self::get_tray_size_for_product($product);
        if ($tray_size > 0) {
            $item->add_meta_data(__('Tray Pack Size', 'mystore-security'), sprintf(__('%d pcs/tray', 'mystore-security'), $tray_size), true);
        }
    }

    public static function guard_coupon_rate_limit(bool $valid, WC_Coupon $coupon, WC_Discounts $discounts): bool {
        $ip  = Mystore_Hardening::get_client_ip();
        $key = 'mystore_coupon_rl_' . md5($ip);
        if ((int) get_transient($key) >= 6) {
            throw new Exception(esc_html__('Too many coupon attempts from your network. Please wait 15 minutes.', 'mystore-security'));
        }
        return $valid;
    }

    public static function record_coupon_attempt_on_error(string $err, int $err_code, mixed $coupon): string {
        $ip  = Mystore_Hardening::get_client_ip();
        $key = 'mystore_coupon_rl_' . md5($ip);
        set_transient($key, ((int) get_transient($key)) + 1, 900);
        return $err;
    }

    public static function throttle_coupon_attempts(string $coupon_code): void {
        $ip  = Mystore_Hardening::get_client_ip();
        $key = 'mystore_coupon_rl_' . md5($ip);
        $cnt = (int) get_transient($key);
        if ($cnt >= 6) {
            if (function_exists('WC') && WC()->cart) {
                WC()->cart->remove_coupon($coupon_code);
            }
            wc_add_notice(__('Too many coupon attempts from your network. Please wait 15 minutes.', 'mystore-security'), 'error');
            return;
        }
        set_transient($key, $cnt + 1, 900);
    }

    public static function shortcode_account_security(): string {
        ob_start();
        self::render_security_controls_in_account();
        return (string) ob_get_clean();
    }

    /**
     * Guarantee every line item uses canonical WooCommerce DB price rather than tampered client data.
     */
    public static function enforce_server_catalog_prices(WC_Cart $cart): void {
        if (is_admin() && !defined('DOING_AJAX')) {
            return;
        }
        foreach ($cart->get_cart() as $cart_item) {
            if (isset($cart_item['data']) && $cart_item['data'] instanceof WC_Product) {
                $db_product = wc_get_product($cart_item['data']->get_id());
                if ($db_product instanceof WC_Product) {
                    $cart_item['data']->set_price($db_product->get_price());
                }
            }
        }
    }

    public static function handle_quick_add_ajax(): void {
        check_ajax_referer('mystore_quick_order_nonce', 'nonce');

        if (!function_exists('WC') || !WC()->cart) {
            wp_send_json_error(array('message' => __('Cart service unavailable.', 'mystore-security')), 400);
        }

        $product_id = isset($_POST['product_id']) ? absint($_POST['product_id']) : 0;
        $quantity   = isset($_POST['quantity']) ? min(500, max(1, absint($_POST['quantity']))) : 1;
        $product    = wc_get_product($product_id);

        if (!($product instanceof WC_Product) || !$product->is_purchasable() || !$product->is_in_stock()) {
            wp_send_json_error(array('message' => __('This product cannot be ordered right now.', 'mystore-security')), 400);
        }

        $added = WC()->cart->add_to_cart($product_id, $quantity);
        if (false === $added) {
            wp_send_json_error(array('message' => __('Unable to add product to cart.', 'mystore-security')), 400);
        }

        WC()->cart->calculate_totals();
        wp_send_json_success(array(
            'message'    => sprintf(__('Added %d × %s to cart.', 'mystore-security'), $quantity, wp_strip_all_tags($product->get_name())),
            'cart_count' => WC()->cart->get_cart_contents_count(),
            'cart_total' => wp_strip_all_tags(WC()->cart->get_cart_total()),
        ));
    }

    public static function shortcode_quick_order(): string {
        if (!function_exists('wc_get_products')) {
            return '';
        }
        $products = wc_get_products(array(
            'status' => 'publish',
            'limit'  => 24,
            'orderby' => 'menu_order',
            'order'   => 'ASC',
        ));
        if (empty($products)) {
            return '<p>' . esc_html__('No products available for quick order.', 'mystore-security') . '</p>';
        }

        $nonce    = wp_create_nonce('mystore_quick_order_nonce');
        $ajax_url = admin_url('admin-ajax.php');
        $cart_url = function_exists('wc_get_cart_url') ? wc_get_cart_url() : home_url('/cart/');

        ob_start();
        ?>
        <section
            class="mystore_container mystore_quick_order_section"
            data-mystore-ajax="<?php echo esc_url($ajax_url); ?>"
            data-mystore-nonce="<?php echo esc_attr($nonce); ?>"
            data-mystore-cart-url="<?php echo esc_url($cart_url); ?>"
        >
            <div class="mystore_section_header">
                <h2><?php esc_html_e('Quick Order Grid — Trays & Single Packs', 'mystore-security'); ?></h2>
                <p><?php esc_html_e('All prices and totals are verified on the server. Trays: 500ml = 6 pcs, 250ml = 12 pcs, 100ml = 24 pcs.', 'mystore-security'); ?></p>
            </div>
            <div class="mystore_quick_status" role="status" aria-live="polite"></div>
            <div class="mystore_quick_grid">
                <?php foreach ($products as $product) :
                    if (!($product instanceof WC_Product) || !$product->is_purchasable()) {
                        continue;
                    }
                    $pid       = $product->get_id();
                    $tray_size = self::get_tray_size_for_product($product);
                    ?>
                    <article class="mystore_quick_card" data-product-id="<?php echo esc_attr((string) $pid); ?>" data-tray-size="<?php echo esc_attr((string) $tray_size); ?>">
                        <div class="mystore_quick_thumb">
                            <?php echo wp_kses_post($product->get_image('woocommerce_thumbnail')); ?>
                        </div>
                        <div class="mystore_quick_meta">
                            <h3><?php echo esc_html($product->get_name()); ?></h3>
                            <p class="mystore_quick_price"><?php echo wp_kses_post($product->get_price_html()); ?></p>
                            <?php if ($tray_size > 0) : ?>
                                <p class="mystore_tray_badge"><?php echo esc_html(sprintf(__('Tray = %d pcs', 'mystore-security'), $tray_size)); ?></p>
                            <?php endif; ?>
                            <div class="mystore_qty_controls">
                                <label class="screen-reader-text" for="mystore_qty_<?php echo esc_attr((string) $pid); ?>"><?php esc_html_e('Quantity', 'mystore-security'); ?></label>
                                <input id="mystore_qty_<?php echo esc_attr((string) $pid); ?>" class="mystore_qty_input" type="number" min="1" max="500" value="<?php echo esc_attr((string) ($tray_size > 0 ? $tray_size : 1)); ?>" />
                                <?php if ($tray_size > 0) : ?>
                                    <button type="button" class="mystore_btn_secondary mystore_add_tray_btn"><?php echo esc_html(sprintf(__('+1 Tray (%d)', 'mystore-security'), $tray_size)); ?></button>
                                <?php endif; ?>
                                <button type="button" class="mystore_btn_primary mystore_quick_add_btn"><?php esc_html_e('Add to Cart', 'mystore-security'); ?></button>
                            </div>
                        </div>
                    </article>
                <?php endforeach; ?>
            </div>
        </section>
        <?php
        return (string) ob_get_clean();
    }

    public static function render_order_delivery_status_box(WC_Order $order): void {
        $window_label = (string) $order->get_meta('_mystore_delivery_window_label', true);
        if ('' === $window_label) {
            return;
        }
        $status = wc_get_order_status_name($order->get_status());
        echo '<section class="mystore_delivery_status_card">';
        echo '<h3>' . esc_html__('Cold-Chain Delivery Status', 'mystore-security') . '</h3>';
        echo '<p><strong>' . esc_html__('Window:', 'mystore-security') . '</strong> ' . esc_html($window_label) . '</p>';
        echo '<p><strong>' . esc_html__('Current Order Status:', 'mystore-security') . '</strong> ' . esc_html($status) . '</p>';
        echo '</section>';
    }

    public static function shortcode_delivery_status(): string {
        $windows = self::delivery_windows();
        ob_start();
        ?>
        <section class="mystore_delivery_status_card" data-mystore-delivery-widget="1">
            <h3><?php esc_html_e('Cold-Chain Delivery Dispatch Estimator', 'mystore-security'); ?></h3>
            <label for="mystore_preview_window"><?php esc_html_e('Select Delivery Window', 'mystore-security'); ?></label>
            <select id="mystore_preview_window" class="mystore_window_select">
                <?php foreach ($windows as $key => $label) : ?>
                    <option value="<?php echo esc_attr($key); ?>"><?php echo esc_html($label); ?></option>
                <?php endforeach; ?>
            </select>
            <p class="mystore_delivery_eta_msg"><?php esc_html_e('Morning route leaves Limuru plant at 5:45 AM.', 'mystore-security'); ?></p>
        </section>
        <?php
        return (string) ob_get_clean();
    }
}
