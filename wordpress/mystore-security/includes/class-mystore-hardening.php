<?php
declare(strict_types=1);

defined('ABSPATH') || exit;

/**
 * Security headers, strict Checkout/Account Magecart CSP, XML-RPC disablement, author enumeration block,
 * restricted upload MIME validation, and tracking script blocking on sensitive flows.
 */
final class Mystore_Hardening {
    public static function init(): void {
        add_filter('xmlrpc_enabled', '__return_false');
        remove_action('wp_head', 'wp_generator');
        add_filter('wp_headers', array(self::class, 'filter_http_headers'));
        add_action('send_headers', array(self::class, 'send_csp_headers'));
        add_action('template_redirect', array(self::class, 'block_author_enumeration_and_enforce_ssl'));
        add_filter('rest_endpoints', array(self::class, 'restrict_user_rest_endpoints'));
        add_filter('upload_mimes', array(self::class, 'restrict_upload_mimes'));
        add_filter('wp_check_filetype_and_ext', array(self::class, 'verify_real_upload_mime'), 10, 4);
        add_action('wp_enqueue_scripts', array(self::class, 'strip_third_party_trackers_on_sensitive_pages'), 999);
        add_action('rest_api_init', array(self::class, 'register_csp_report_endpoint'));
    }

    public static function is_sensitive_commerce_page(): bool {
        if (function_exists('is_cart') && is_cart()) {
            return true;
        }
        if (function_exists('is_checkout') && is_checkout()) {
            return true;
        }
        if (function_exists('is_account_page') && is_account_page()) {
            return true;
        }
        return false;
    }

    public static function filter_http_headers(array $headers): array {
        unset($headers['X-Pingback']);
        $headers['X-Content-Type-Options'] = 'nosniff';
        $headers['Referrer-Policy']        = 'strict-origin-when-cross-origin';
        $headers['Permissions-Policy']     = 'camera=(), microphone=(), geolocation=(), payment=(self), usb=()';
        $headers['X-Frame-Options']        = 'SAMEORIGIN';

        if (is_ssl()) {
            $headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
        }
        return $headers;
    }

    public static function send_csp_headers(): void {
        if (headers_sent() || is_admin()) {
            return;
        }

        $report_uri = esc_url_raw(rest_url('mystore/v1/csp-report'));
        $is_sensitive = self::is_sensitive_commerce_page();
        $turnstile_host = '';
        if (
            'turnstile' === Mystore_Settings::get_option('bot_provider', 'turnstile') &&
            '' !== mystore_get_secret_constant('MYSTORE_TURNSTILE_SITE_KEY')
        ) {
            $turnstile_host = ' https://challenges.cloudflare.com';
        }

        // Strict allowlist on Cart, Checkout, and My Account pages to stop Magecart script skimming.
        if ($is_sensitive) {
            $directives = array(
                "default-src 'self'",
                "script-src 'self'" . $turnstile_host,
                "style-src 'self' 'unsafe-inline'",
                "img-src 'self' data:",
                "font-src 'self'",
                "connect-src 'self'" . $turnstile_host,
                "frame-src 'self'" . $turnstile_host,
                "object-src 'none'",
                "base-uri 'self'",
                "form-action 'self'",
                "frame-ancestors 'self'",
                'report-uri ' . $report_uri,
            );
            $header_name = !empty(Mystore_Settings::get_option('csp_report_only', 0))
                ? 'Content-Security-Policy-Report-Only'
                : 'Content-Security-Policy';
            header($header_name . ': ' . implode('; ', $directives));
        } else {
            header(
                "Content-Security-Policy: default-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'" .
                $turnstile_host .
                '; report-uri ' . $report_uri
            );
        }
    }

    public static function block_author_enumeration_and_enforce_ssl(): void {
        if (!is_admin() && (isset($_GET['author']) || is_author())) {
            wp_safe_redirect(home_url('/'), 301);
            exit;
        }

        if (
            self::is_sensitive_commerce_page() &&
            !is_ssl() &&
            !wp_is_local_environment() &&
            'cli' !== php_sapi_name()
        ) {
            $canonical_host = wp_parse_url(home_url('/'), PHP_URL_HOST);
            $request_uri    = sanitize_text_field(wp_unslash((string) ($_SERVER['REQUEST_URI'] ?? '/')));
            $https_url      = 'https://' . (is_string($canonical_host) ? $canonical_host : '') . $request_uri;
            wp_safe_redirect($https_url, 301);
            exit;
        }
    }

    /**
     * Block anonymous user enumeration via /wp-json/wp/v2/users.
     */
    public static function restrict_user_rest_endpoints(array $endpoints): array {
        if (!is_user_logged_in() || !current_user_can('list_users')) {
            unset($endpoints['/wp/v2/users']);
            unset($endpoints['/wp/v2/users/(?P<id>[\\d]+)']);
        }
        return $endpoints;
    }

    /**
     * Allow only safe store image and invoice document uploads; forbid SVG, HTML, scripts, and executables.
     */
    public static function restrict_upload_mimes(array $mimes): array {
        return array(
            'jpg|jpeg|jpe' => 'image/jpeg',
            'png'          => 'image/png',
            'webp'         => 'image/webp',
            'pdf'          => 'application/pdf',
        );
    }

    public static function verify_real_upload_mime(
        array $data,
        string $file,
        string $filename,
        ?array $mimes
    ): array {
        $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        $allowed = array(
            'jpg'  => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'jpe'  => 'image/jpeg',
            'png'  => 'image/png',
            'webp' => 'image/webp',
            'pdf'  => 'application/pdf',
        );

        if (!isset($allowed[$ext]) || !file_exists($file)) {
            return array('ext' => false, 'type' => false, 'proper_filename' => false);
        }

        if (function_exists('finfo_open')) {
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $real_mime = $finfo ? (string) finfo_file($finfo, $file) : '';
            if ($finfo) {
                finfo_close($finfo);
            }
            if ($real_mime !== $allowed[$ext]) {
                return array('ext' => false, 'type' => false, 'proper_filename' => false);
            }
        }

        return $data;
    }

    /**
     * Strip analytics, chat widgets, marketing pixels, and third-party ad tags from cart/checkout/account pages.
     */
    public static function strip_third_party_trackers_on_sensitive_pages(): void {
        if (!self::is_sensitive_commerce_page()) {
            return;
        }

        global $wp_scripts;
        if (!($wp_scripts instanceof WP_Scripts)) {
            return;
        }

        $blocked_patterns = array(
            'gtag', 'google-analytics', 'googletagmanager', 'facebook-pixel', 'fbevents',
            'hotjar', 'clarity', 'intercom', 'tawk', 'crisp', 'drift', 'zendesk',
            'hubspot', 'pixel', 'doubleclick', 'tiktok',
        );

        foreach ($wp_scripts->queue as $handle) {
            $src = isset($wp_scripts->registered[$handle]) ? (string) $wp_scripts->registered[$handle]->src : '';
            $haystack = strtolower($handle . ' ' . $src);
            foreach ($blocked_patterns as $needle) {
                if (str_contains($haystack, $needle)) {
                    wp_dequeue_script($handle);
                    wp_deregister_script($handle);
                    break;
                }
            }
        }
    }

    public static function register_csp_report_endpoint(): void {
        register_rest_route('mystore/v1', '/csp-report', array(
            'methods'             => 'POST',
            'permission_callback' => '__return_true',
            'callback'            => array(self::class, 'handle_csp_report'),
        ));
    }

    public static function handle_csp_report(WP_REST_Request $request): WP_REST_Response {
        $ip = self::get_client_ip();
        $rl_key = 'mystore_csp_rl_' . md5($ip);
        $count = (int) get_transient($rl_key);
        if ($count > 20) {
            return new WP_REST_Response(array('ok' => true), 204);
        }
        set_transient($rl_key, $count + 1, 300);

        $raw = (string) $request->get_body();
        $decoded = json_decode(substr($raw, 0, 4096), true);
        if (is_array($decoded)) {
            $report = isset($decoded['csp-report']) && is_array($decoded['csp-report'])
                ? $decoded['csp-report']
                : $decoded;
            Mystore_Integrity::log_event(
                'csp_violation',
                sanitize_text_field((string) ($report['violated-directive'] ?? 'unknown')),
                sanitize_text_field((string) ($report['blocked-uri'] ?? '')),
                $ip
            );
        }

        return new WP_REST_Response(array('ok' => true), 204);
    }

    public static function get_client_ip(): string {
        $candidates = array('HTTP_CF_CONNECTING_IP', 'REMOTE_ADDR');
        foreach ($candidates as $key) {
            if (!empty($_SERVER[$key])) {
                $ip = filter_var(wp_unslash((string) $_SERVER[$key]), FILTER_VALIDATE_IP);
                if (false !== $ip) {
                    return $ip;
                }
            }
        }
        return '0.0.0.0';
    }
}
