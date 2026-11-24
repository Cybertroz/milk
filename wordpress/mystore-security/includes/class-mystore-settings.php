<?php
declare(strict_types=1);

defined('ABSPATH') || exit;

/**
 * WordPress Settings API configuration screen (never stores API secrets in DB).
 */
final class Mystore_Settings {
    public const OPTION_GROUP = 'mystore_settings_group';
    public const OPTION_NAME  = 'mystore_security_options';
    public const PAGE_SLUG    = 'mystore-security-settings';

    public static function init(): void {
        add_action('admin_menu', array(self::class, 'register_menu'));
        add_action('admin_init', array(self::class, 'register_settings'));
    }

    public static function defaults(): array {
        return array(
            'allow_guest_checkout'         => 1,
            'offer_checkout_registration'  => 1,
            'require_email_verification'   => 1,
            'block_disposable_emails'      => 1,
            'enable_hibp_check'            => 0,
            'enable_customer_2fa'          => 1,
            'bot_provider'                 => 'turnstile',
            'csp_report_only'              => 0,
            'high_value_hold_kes'          => 50000,
            'velocity_max_orders_per_hour' => 4,
            'idle_timeout_minutes'         => 30,
            'purge_zero_order_days'        => 90,
        );
    }

    public static function get_option(string $key, mixed $fallback = null): mixed {
        $options = get_option(self::OPTION_NAME, array());
        if (!is_array($options)) {
            $options = array();
        }
        $merged = array_merge(self::defaults(), $options);
        return $merged[$key] ?? $fallback;
    }

    public static function register_menu(): void {
        add_options_page(
            __('MyStore Security Settings', 'mystore-security'),
            __('MyStore Security', 'mystore-security'),
            'manage_options',
            self::PAGE_SLUG,
            array(self::class, 'render_settings_page')
        );
    }

    public static function register_settings(): void {
        register_setting(
            self::OPTION_GROUP,
            self::OPTION_NAME,
            array(
                'type'              => 'array',
                'sanitize_callback' => array(self::class, 'sanitize_options'),
                'default'           => self::defaults(),
            )
        );

        add_settings_section(
            'mystore_sec_access',
            __('Customer Access, Bot Protection & Passwords', 'mystore-security'),
            '__return_false',
            self::PAGE_SLUG
        );

        $checkboxes = array(
            'allow_guest_checkout'        => __('Allow guest checkout for single purchases', 'mystore-security'),
            'offer_checkout_registration' => __('Offer optional customer account creation at checkout', 'mystore-security'),
            'require_email_verification'  => __('Require email verification before activating newly registered customer login', 'mystore-security'),
            'block_disposable_emails'     => __('Block known disposable email domains on signup', 'mystore-security'),
            'enable_hibp_check'           => __('Check new passwords via k-anonymity breached-password prefix API', 'mystore-security'),
            'enable_customer_2fa'         => __('Allow optional 6-digit 2FA verification for customer accounts (staff 2FA always mandatory)', 'mystore-security'),
            'csp_report_only'             => __('Run checkout Content-Security-Policy in Report-Only test mode first', 'mystore-security'),
        );

        foreach ($checkboxes as $key => $label) {
            add_settings_field(
                'mystore_field_' . $key,
                $label,
                array(self::class, 'render_checkbox_field'),
                self::PAGE_SLUG,
                'mystore_sec_access',
                array('key' => $key)
            );
        }

        add_settings_field(
            'mystore_field_bot_provider',
            __('Bot Protection Challenge Provider', 'mystore-security'),
            array(self::class, 'render_bot_provider_field'),
            self::PAGE_SLUG,
            'mystore_sec_access'
        );

        add_settings_field(
            'mystore_field_high_value_hold_kes',
            __('Manual Review Hold Threshold (KES)', 'mystore-security'),
            array(self::class, 'render_number_field'),
            self::PAGE_SLUG,
            'mystore_sec_access',
            array('key' => 'high_value_hold_kes', 'min' => 5000, 'max' => 1000000)
        );

        add_settings_field(
            'mystore_field_velocity_max_orders_per_hour',
            __('Max Checkout Attempts Per IP/Email Per Hour', 'mystore-security'),
            array(self::class, 'render_number_field'),
            self::PAGE_SLUG,
            'mystore_sec_access',
            array('key' => 'velocity_max_orders_per_hour', 'min' => 1, 'max' => 50)
        );

        add_settings_field(
            'mystore_field_idle_timeout_minutes',
            __('Staff/Admin Idle Session Timeout (Minutes)', 'mystore-security'),
            array(self::class, 'render_number_field'),
            self::PAGE_SLUG,
            'mystore_sec_access',
            array('key' => 'idle_timeout_minutes', 'min' => 5, 'max' => 240)
        );
    }

    public static function sanitize_options(mixed $input): array {
        $raw      = is_array($input) ? $input : array();
        $defaults = self::defaults();

        $bot = isset($raw['bot_provider']) ? sanitize_key((string) $raw['bot_provider']) : 'turnstile';
        if (!in_array($bot, array('turnstile', 'recaptcha', 'none'), true)) {
            $bot = 'turnstile';
        }

        return array(
            'allow_guest_checkout'         => !empty($raw['allow_guest_checkout']) ? 1 : 0,
            'offer_checkout_registration'  => !empty($raw['offer_checkout_registration']) ? 1 : 0,
            'require_email_verification'   => !empty($raw['require_email_verification']) ? 1 : 0,
            'block_disposable_emails'      => !empty($raw['block_disposable_emails']) ? 1 : 0,
            'enable_hibp_check'            => !empty($raw['enable_hibp_check']) ? 1 : 0,
            'enable_customer_2fa'          => !empty($raw['enable_customer_2fa']) ? 1 : 0,
            'csp_report_only'              => !empty($raw['csp_report_only']) ? 1 : 0,
            'bot_provider'                 => $bot,
            'high_value_hold_kes'          => max(5000, min(1000000, absint($raw['high_value_hold_kes'] ?? $defaults['high_value_hold_kes']))),
            'velocity_max_orders_per_hour' => max(1, min(50, absint($raw['velocity_max_orders_per_hour'] ?? $defaults['velocity_max_orders_per_hour']))),
            'idle_timeout_minutes'         => max(5, min(240, absint($raw['idle_timeout_minutes'] ?? $defaults['idle_timeout_minutes']))),
            'purge_zero_order_days'        => 90,
        );
    }

    public static function render_checkbox_field(array $args): void {
        $key     = (string) ($args['key'] ?? '');
        $checked = !empty(self::get_option($key, 0));
        printf(
            '<input type="checkbox" id="mystore_%1$s" name="%2$s[%1$s]" value="1" %3$s />',
            esc_attr($key),
            esc_attr(self::OPTION_NAME),
            checked($checked, true, false)
        );
    }

    public static function render_bot_provider_field(): void {
        $current = (string) self::get_option('bot_provider', 'turnstile');
        $choices = array(
            'turnstile' => __('Cloudflare Turnstile (Recommended)', 'mystore-security'),
            'recaptcha' => __('Google reCAPTCHA v3/v2', 'mystore-security'),
            'none'      => __('Disabled (Local Testing Only)', 'mystore-security'),
        );
        echo '<select name="' . esc_attr(self::OPTION_NAME) . '[bot_provider]">';
        foreach ($choices as $value => $label) {
            printf(
                '<option value="%s" %s>%s</option>',
                esc_attr($value),
                selected($current, $value, false),
                esc_html($label)
            );
        }
        echo '</select>';
    }

    public static function render_number_field(array $args): void {
        $key = (string) ($args['key'] ?? '');
        $val = absint(self::get_option($key, 0));
        printf(
            '<input type="number" id="mystore_%1$s" name="%2$s[%1$s]" value="%3$d" min="%4$d" max="%5$d" class="regular-text" />',
            esc_attr($key),
            esc_attr(self::OPTION_NAME),
            $val,
            absint($args['min'] ?? 1),
            absint($args['max'] ?? 999999)
        );
    }

    public static function render_settings_page(): void {
        if (!current_user_can('manage_options')) {
            wp_die(esc_html__('You do not have permission to access this page.', 'mystore-security'));
        }

        $constants = array(
            'MYSTORE_PAYMENT_PUBLIC_KEY',
            'MYSTORE_PAYMENT_SECRET_KEY',
            'MYSTORE_PAYMENT_WEBHOOK_SECRET',
            'MYSTORE_TURNSTILE_SITE_KEY',
            'MYSTORE_TURNSTILE_SECRET_KEY',
            'MYSTORE_ALERT_WEBHOOK_URL',
            'MYSTORE_STAFF_LOGIN_SLUG',
            'MYSTORE_STAFF_ALLOWED_IPS',
        );
        ?>
        <div class="wrap">
            <h1><?php esc_html_e('MyStore Storefront & WooCommerce Security', 'mystore-security'); ?></h1>
            <p><?php esc_html_e('API keys, webhook secrets, and SMTP credentials must be defined in wp-config.php or server environment variables and are never saved in the WordPress database.', 'mystore-security'); ?></p>

            <h2><?php esc_html_e('wp-config.php / Environment Constant Status', 'mystore-security'); ?></h2>
            <table class="widefat striped" style="max-width:720px;margin-bottom:24px;">
                <thead>
                    <tr>
                        <th><?php esc_html_e('Constant Name', 'mystore-security'); ?></th>
                        <th><?php esc_html_e('Status', 'mystore-security'); ?></th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($constants as $const_name) : ?>
                        <?php $is_set = '' !== mystore_get_secret_constant($const_name); ?>
                        <tr>
                            <td><code><?php echo esc_html($const_name); ?></code></td>
                            <td>
                                <?php if ($is_set) : ?>
                                    <strong style="color:#15803d;"><?php esc_html_e('Configured', 'mystore-security'); ?></strong>
                                <?php else : ?>
                                    <span style="color:#991b1b;"><?php esc_html_e('Not Set (Using safe fallback / inactive)', 'mystore-security'); ?></span>
                                <?php endif; ?>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>

            <form method="post" action="<?php echo esc_url(admin_url('options.php')); ?>">
                <?php
                settings_fields(self::OPTION_GROUP);
                do_settings_sections(self::PAGE_SLUG);
                submit_button(__('Save Security Settings', 'mystore-security'));
                ?>
            </form>
        </div>
        <?php
    }
}
