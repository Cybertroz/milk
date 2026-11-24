<?php
/**
 * Plugin Name:       MyStore Security & Hardened WooCommerce Storefront
 * Plugin URI:        https://www.limurudairy.co.ke
 * Description:       Security-first WooCommerce storefront plugin with HPOS compatibility, hosted payment gateway integration, anti-fraud controls, strict customer account hardening, Magecart CSP protection, file integrity monitoring, and tray/delivery-window helpers.
 * Version:           2.0.0
 * Requires at least: 6.4
 * Requires PHP:      8.1
 * Author:            Limuru Dairy Farmers Co-operative Society Ltd.
 * License:           GPL-2.0-or-later
 * Text Domain:       mystore-security
 * WC requires at least: 8.5
 * WC tested up to:   9.4
 */

declare(strict_types=1);

defined('ABSPATH') || exit;

define('MYSTORE_VERSION', '2.0.0');
define('MYSTORE_PLUGIN_FILE', __FILE__);
define('MYSTORE_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('MYSTORE_PLUGIN_URL', plugins_url('/', __FILE__));
define('MYSTORE_AUDIT_TABLE', 'mystore_audit_log');

require_once MYSTORE_PLUGIN_DIR . 'includes/class-mystore-settings.php';
require_once MYSTORE_PLUGIN_DIR . 'includes/class-mystore-integrity.php';
require_once MYSTORE_PLUGIN_DIR . 'includes/class-mystore-hardening.php';
require_once MYSTORE_PLUGIN_DIR . 'includes/class-mystore-auth.php';
require_once MYSTORE_PLUGIN_DIR . 'includes/class-mystore-notifications.php';
require_once MYSTORE_PLUGIN_DIR . 'includes/class-mystore-woocommerce.php';
require_once MYSTORE_PLUGIN_DIR . 'includes/class-mystore-payment-gateway.php';
require_once MYSTORE_PLUGIN_DIR . 'includes/class-mystore-privacy.php';

/**
 * Declare WooCommerce High-Performance Order Storage (HPOS) compatibility.
 */
function mystore_declare_hpos_compatibility(): void {
    if (class_exists(\Automattic\WooCommerce\Utilities\FeaturesUtil::class)) {
        \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility(
            'custom_order_tables',
            MYSTORE_PLUGIN_FILE,
            true
        );
    }
}
add_action('before_woocommerce_init', 'mystore_declare_hpos_compatibility');

/**
 * Activation hook: lock down open WordPress registration, create audit table via dbDelta, and schedule cron checks.
 */
function mystore_activate(): void {
    update_option('users_can_register', 0);

    Mystore_Integrity::create_audit_table();
    Mystore_Integrity::refresh_file_hash_baseline();

    if (!wp_next_scheduled('mystore_cron_integrity_check')) {
        wp_schedule_event(time() + 300, 'twicedaily', 'mystore_cron_integrity_check');
    }
    if (!wp_next_scheduled('mystore_cron_cleanup_inactive_accounts')) {
        wp_schedule_event(time() + 600, 'daily', 'mystore_cron_cleanup_inactive_accounts');
    }

    flush_rewrite_rules();
}
register_activation_hook(__FILE__, 'mystore_activate');

/**
 * Deactivation hook: unschedule recurring integrity and cleanup jobs.
 */
function mystore_deactivate(): void {
    wp_clear_scheduled_hook('mystore_cron_integrity_check');
    wp_clear_scheduled_hook('mystore_cron_cleanup_inactive_accounts');
    flush_rewrite_rules();
}
register_deactivation_hook(__FILE__, 'mystore_deactivate');

/**
 * Enqueue public stylesheets and vanilla JS strictly with wp_enqueue_* (zero inline scripts or unpinned CDNs).
 */
function mystore_enqueue_public_assets(): void {
    wp_enqueue_style(
        'mystore-frontend-css',
        plugins_url('assets/css/mystore-frontend.css', MYSTORE_PLUGIN_FILE),
        array(),
        MYSTORE_VERSION
    );

    wp_enqueue_script(
        'mystore-frontend-js',
        plugins_url('assets/js/mystore-frontend.js', MYSTORE_PLUGIN_FILE),
        array(),
        MYSTORE_VERSION,
        true
    );

    // Pinned official Cloudflare Turnstile API only when configured in wp-config.php and enabled.
    $turnstile_site_key = mystore_get_secret_constant('MYSTORE_TURNSTILE_SITE_KEY');
    $bot_provider       = Mystore_Settings::get_option('bot_provider', 'turnstile');
    if (
        '' !== $turnstile_site_key &&
        'turnstile' === $bot_provider &&
        (is_checkout() || is_account_page() || is_page('my-account'))
    ) {
        wp_enqueue_script(
            'mystore-turnstile',
            'https://challenges.cloudflare.com/turnstile/v0/api.js',
            array(),
            null,
            true
        );
    }
}
add_action('wp_enqueue_scripts', 'mystore_enqueue_public_assets', 20);

/**
 * Helper to retrieve a secret or config constant from wp-config.php or server environment variables.
 */
function mystore_get_secret_constant(string $name, string $default = ''): string {
    if (defined($name)) {
        $val = constant($name);
        return is_string($val) ? trim($val) : $default;
    }
    $env = getenv($name);
    if (is_string($env) && '' !== trim($env)) {
        return trim($env);
    }
    return $default;
}

/**
 * Initialize all plugin subsystems cleanly on plugins_loaded.
 */
function mystore_bootstrap_modules(): void {
    load_plugin_textdomain('mystore-security', false, dirname(plugin_basename(MYSTORE_PLUGIN_FILE)) . '/languages');

    Mystore_Settings::init();
    Mystore_Integrity::init();
    Mystore_Hardening::init();
    Mystore_Auth::init();
    Mystore_Notifications::init();
    Mystore_WooCommerce::init();
    Mystore_Privacy::init();
}
add_action('plugins_loaded', 'mystore_bootstrap_modules', 10);

/**
 * Register the hosted [PAYMENT PROVIDER] WooCommerce payment gateway.
 */
function mystore_register_payment_gateway(array $gateways): array {
    if (class_exists('Mystore_Payment_Gateway')) {
        $gateways[] = 'Mystore_Payment_Gateway';
    }
    return $gateways;
}
add_filter('woocommerce_payment_gateways', 'mystore_register_payment_gateway');
