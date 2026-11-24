<?php
declare(strict_types=1);

defined('ABSPATH') || exit;

/**
 * WordPress Personal Data Export & Erasure handlers + Privacy Policy notice text.
 */
final class Mystore_Privacy {
    public static function init(): void {
        add_filter('wp_privacy_personal_data_exporters', array(self::class, 'register_exporter'));
        add_filter('wp_privacy_personal_data_erasers', array(self::class, 'register_eraser'));
        add_action('admin_init', array(self::class, 'add_privacy_policy_guide'));
    }

    public static function register_exporter(array $exporters): array {
        $exporters['mystore-security'] = array(
            'exporter_friendly_name' => __('MyStore Security Metadata', 'mystore-security'),
            'callback'               => array(self::class, 'export_user_data'),
        );
        return $exporters;
    }

    public static function register_eraser(array $erasers): array {
        $erasers['mystore-security'] = array(
            'eraser_friendly_name' => __('MyStore Security Metadata', 'mystore-security'),
            'callback'             => array(self::class, 'erase_user_data'),
        );
        return $erasers;
    }

    public static function export_user_data(string $email_address, int $page = 1): array {
        $user = get_user_by('email', sanitize_email($email_address));
        if (!$user) {
            return array('data' => array(), 'done' => true);
        }

        $items = array(
            array(
                'group_id'    => 'mystore-security',
                'group_label' => __('Storefront Security Profile', 'mystore-security'),
                'item_id'     => 'mystore-user-' . $user->ID,
                'data'        => array(
                    array(
                        'name'  => __('Email Verification Status', 'mystore-security'),
                        'value' => '1' === (string) get_user_meta($user->ID, '_mystore_email_verified', true) ? 'Verified' : 'Unverified',
                    ),
                    array(
                        'name'  => __('2FA Preference', 'mystore-security'),
                        'value' => '1' === (string) get_user_meta($user->ID, '_mystore_2fa_enabled', true) ? 'Enabled' : 'Disabled',
                    ),
                ),
            ),
        );

        return array('data' => $items, 'done' => true);
    }

    public static function erase_user_data(string $email_address, int $page = 1): array {
        global $wpdb;
        $user = get_user_by('email', sanitize_email($email_address));
        if (!$user) {
            return array('items_removed' => false, 'items_retained' => false, 'messages' => array(), 'done' => true);
        }

        $meta_keys = array(
            '_mystore_email_verified',
            '_mystore_verify_token_hash',
            '_mystore_verify_expires',
            '_mystore_2fa_enabled',
            '_mystore_reset_token_hash',
            '_mystore_reset_expires',
            '_mystore_last_activity',
        );
        foreach ($meta_keys as $k) {
            delete_user_meta($user->ID, $k);
        }

        $table = $wpdb->prefix . MYSTORE_AUDIT_TABLE;
        $wpdb->query(
            $wpdb->prepare(
                "UPDATE `{$table}` SET ip_address = '0.0.0.0', actor_id = 0 WHERE actor_id = %d",
                $user->ID
            )
        );

        return array(
            'items_removed'  => true,
            'items_retained' => false,
            'messages'       => array(__('Removed security meta and anonymized security audit references.', 'mystore-security')),
            'done'           => true,
        );
    }

    public static function add_privacy_policy_guide(): void {
        if (!function_exists('wp_add_privacy_policy_content')) {
            return;
        }
        $content = '<p>' . esc_html__(
            'This store processes payment transactions off-site via [PAYMENT PROVIDER] hosted checkout and never collects or stores payment card numbers or CVV codes. Server security logs record limited IP and event metadata solely for fraud prevention and breach monitoring.',
            'mystore-security'
        ) . '</p>';
        wp_add_privacy_policy_content(__('MyStore Security & Hardened WooCommerce Storefront', 'mystore-security'), $content);
    }
}
