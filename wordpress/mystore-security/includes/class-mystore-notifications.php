<?php
declare(strict_types=1);

defined('ABSPATH') || exit;

/**
 * Anti-phishing notifications, dual old+new email alerts with zero login links,
 * authenticated SMTP wiring, trust verification pages, and Gutenberg blocks.
 */
final class Mystore_Notifications {
    public static function init(): void {
        add_action('after_password_reset', array(self::class, 'alert_password_changed'), 10, 1);
        add_action('profile_update', array(self::class, 'alert_email_changed'), 10, 2);
        add_action('woocommerce_customer_save_address', array(self::class, 'alert_address_changed'), 10, 2);

        add_action('phpmailer_init', array(self::class, 'configure_authenticated_smtp'));
        add_filter('wp_mail_from', array(self::class, 'enforce_sender_domain'));
        add_filter('wp_mail_from_name', static fn(): string => wp_specialchars_decode((string) get_bloginfo('name'), ENT_QUOTES));

        // Shortcodes & Gutenberg blocks.
        add_shortcode('mystore_how_we_contact_you', array(self::class, 'shortcode_how_we_contact_you'));
        add_shortcode('mystore_trust_footer', array(self::class, 'shortcode_trust_footer'));
        add_action('init', array(self::class, 'register_gutenberg_blocks'));
    }

    public static function get_fixed_domain(): string {
        $host = wp_parse_url(home_url('/'), PHP_URL_HOST);
        return is_string($host) && '' !== $host ? $host : 'limurudairy.co.ke';
    }

    /**
     * Send security alert containing ZERO clickable login links or buttons (anti-phishing rule).
     */
    public static function notify_account_security_change(int $user_id, string $change_label, string $override_email = ''): void {
        $user = get_userdata($user_id);
        if (!$user) {
            return;
        }
        $target_email = '' !== $override_email && is_email($override_email) ? $override_email : $user->user_email;
        if (!is_email($target_email)) {
            return;
        }

        $domain  = self::get_fixed_domain();
        $subject = sprintf(__('Security Notice: %s', 'mystore-security'), $change_label);
        $message = sprintf(
            __(
                "This is an automated security notification confirming a change on your store account:\n\n" .
                "Change: %1\$s\n" .
                "Date (UTC): %2\$s\n\n" .
                "SECURITY REMINDER: This email intentionally contains NO links or login buttons.\n" .
                "If you did not make this change, open a new browser tab, manually type %3\$s into the address bar, sign in to My Account, change your password, and use 'Log out of all devices'.",
                'mystore-security'
            ),
            sanitize_text_field($change_label),
            gmdate('Y-m-d H:i:s'),
            $domain
        );

        wp_mail($target_email, $subject, $message);
    }

    public static function send_plain_verification_code_email(string $to_email, string $code): void {
        if (!is_email($to_email)) {
            return;
        }
        $domain  = self::get_fixed_domain();
        $subject = __('Your 6-Digit Sign-In Verification Code', 'mystore-security');
        $message = sprintf(
            __(
                "Your verification code is: %1\$s\n\n" .
                "This code expires in 10 minutes.\n" .
                "We will never phone or message you asking for this code. Verify you are on %2\$s before entering it.",
                'mystore-security'
            ),
            $code,
            $domain
        );
        wp_mail($to_email, $subject, $message);
    }

    public static function alert_password_changed(WP_User $user): void {
        self::notify_account_security_change($user->ID, __('Account Password Changed', 'mystore-security'));
    }

    public static function alert_email_changed(int $user_id, WP_User $old_user_data): void {
        $new_user = get_userdata($user_id);
        if (!$new_user) {
            return;
        }
        if (strtolower($old_user_data->user_email) !== strtolower($new_user->user_email)) {
            // Send security alerts to BOTH the old and new email addresses.
            self::notify_account_security_change($user_id, __('Account Email Address Changed (Sent to Previous Email)', 'mystore-security'), $old_user_data->user_email);
            self::notify_account_security_change($user_id, __('Account Email Address Changed (Sent to New Email)', 'mystore-security'), $new_user->user_email);
            Mystore_Integrity::log_event('account_email_changed', 'User #' . $user_id . ' updated email address.');
        }
    }

    public static function alert_address_changed(int $user_id, string $load_address): void {
        self::notify_account_security_change(
            $user_id,
            sprintf(__('Saved %s Address Updated', 'mystore-security'), ucfirst(sanitize_key($load_address)))
        );
    }

    public static function enforce_sender_domain(string $from_email): string {
        $domain = self::get_fixed_domain();
        if ('' !== $domain && !str_ends_with(strtolower($from_email), '@' . strtolower($domain))) {
            return 'orders@' . preg_replace('/^www\./i', '', $domain);
        }
        return $from_email;
    }

    public static function configure_authenticated_smtp(mixed $phpmailer): void {
        $host = mystore_get_secret_constant('MYSTORE_SMTP_HOST');
        $user = mystore_get_secret_constant('MYSTORE_SMTP_USER');
        $pass = mystore_get_secret_constant('MYSTORE_SMTP_PASS');
        if ('' === $host || '' === $user || '' === $pass || !is_object($phpmailer)) {
            return;
        }
        $port = (int) mystore_get_secret_constant('MYSTORE_SMTP_PORT', '587');
        $phpmailer->isSMTP();
        $phpmailer->Host       = $host;
        $phpmailer->SMTPAuth   = true;
        $phpmailer->Port       = $port > 0 ? $port : 587;
        $phpmailer->Username   = $user;
        $phpmailer->Password   = $pass;
        $phpmailer->SMTPSecure = (465 === $phpmailer->Port) ? 'ssl' : 'tls';
    }

    public static function shortcode_how_we_contact_you(): string {
        $domain = self::get_fixed_domain();
        ob_start();
        ?>
        <section class="mystore_container mystore_trust_box">
            <h2><?php esc_html_e('How We Contact You (Anti-Scam Guarantee)', 'mystore-security'); ?></h2>
            <ul class="mystore_trust_list">
                <li><strong><?php esc_html_e('Official Website Only:', 'mystore-security'); ?></strong> <?php echo esc_html(sprintf(__('Every official order, login, and payment happens only on %s (and our verified [PAYMENT PROVIDER] hosted checkout).', 'mystore-security'), $domain)); ?></li>
                <li><strong><?php esc_html_e('Official Email Addresses:', 'mystore-security'); ?></strong> <?php echo esc_html(sprintf(__('We only send automated messages from @%s. Security alert emails contain zero login links.', 'mystore-security'), preg_replace('/^www\./i', '', $domain))); ?></li>
                <li><strong><?php esc_html_e('What We Never Ask For:', 'mystore-security'); ?></strong> <?php esc_html_e('Our staff will NEVER phone, SMS, or WhatsApp you asking for your password, full card number, CVV, PIN, or 6-digit verification code.', 'mystore-security'); ?></li>
                <li><strong><?php esc_html_e('Report Impersonation:', 'mystore-security'); ?></strong> <?php echo esc_html(sprintf(__('Forward suspicious messages immediately to security@%s.', 'mystore-security'), preg_replace('/^www\./i', '', $domain))); ?></li>
            </ul>
        </section>
        <?php
        return (string) ob_get_clean();
    }

    public static function shortcode_trust_footer(): string {
        $domain = self::get_fixed_domain();
        ob_start();
        ?>
        <aside class="mystore_trust_footer" aria-label="<?php esc_attr_e('Anti-Phishing Reminder', 'mystore-security'); ?>">
            <p>
                <strong><?php esc_html_e('Shop Safely:', 'mystore-security'); ?></strong>
                <?php echo esc_html(sprintf(__('Check that your browser address bar starts with https://%s before entering your password. We never ask for your password, CVV, PIN, or verification code by phone or WhatsApp.', 'mystore-security'), $domain)); ?>
            </p>
        </aside>
        <?php
        return (string) ob_get_clean();
    }

    public static function register_gutenberg_blocks(): void {
        if (!function_exists('register_block_type')) {
            return;
        }
        register_block_type('mystore/quick-order', array(
            'render_callback' => array('Mystore_WooCommerce', 'shortcode_quick_order'),
        ));
        register_block_type('mystore/delivery-status', array(
            'render_callback' => array('Mystore_WooCommerce', 'shortcode_delivery_status'),
        ));
        register_block_type('mystore/how-we-contact-you', array(
            'render_callback' => array(self::class, 'shortcode_how_we_contact_you'),
        ));
    }
}
