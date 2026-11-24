<?php
declare(strict_types=1);

defined('ABSPATH') || exit;

/**
 * Audit trail ($wpdb->prepare()), WP core checksum check, plugin/theme SHA-256 baseline diffing,
 * and second-channel alerts on sensitive administrative or configuration changes.
 */
final class Mystore_Integrity {
    public static function init(): void {
        add_action('mystore_cron_integrity_check', array(self::class, 'run_scheduled_integrity_check'));

        // Sensitive administrative & store-configuration change monitoring
        add_action('user_register', array(self::class, 'monitor_new_user_creation'), 10, 1);
        add_action('set_user_role', array(self::class, 'monitor_role_change'), 10, 3);
        add_action('activated_plugin', array(self::class, 'monitor_plugin_activated'), 10, 1);
        add_action('deactivated_plugin', array(self::class, 'monitor_plugin_deactivated'), 10, 1);
        add_action('switch_theme', array(self::class, 'monitor_theme_switch'), 10, 1);
        add_action('updated_option', array(self::class, 'monitor_critical_option_change'), 10, 3);
    }

    public static function create_audit_table(): void {
        global $wpdb;
        $table_name      = $wpdb->prefix . MYSTORE_AUDIT_TABLE;
        $charset_collate = $wpdb->get_charset_collate();

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        $sql = "CREATE TABLE {$table_name} (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            created_at datetime NOT NULL,
            event_type varchar(64) NOT NULL,
            summary varchar(255) NOT NULL,
            details text NOT NULL,
            ip_address varchar(45) NOT NULL,
            actor_id bigint(20) unsigned NOT NULL DEFAULT 0,
            PRIMARY KEY (id),
            KEY event_type_idx (event_type),
            KEY created_at_idx (created_at)
        ) {$charset_collate};";

        dbDelta($sql);
    }

    public static function log_event(string $event_type, string $summary, string $details = '', string $ip = ''): void {
        global $wpdb;
        $table_name = $wpdb->prefix . MYSTORE_AUDIT_TABLE;
        if ('' === $ip) {
            $ip = Mystore_Hardening::get_client_ip();
        }
        $actor_id = get_current_user_id();

        $wpdb->query(
            $wpdb->prepare(
                "INSERT INTO `{$table_name}` (created_at, event_type, summary, details, ip_address, actor_id) VALUES (%s, %s, %s, %s, %s, %d)",
                current_time('mysql', true),
                substr(sanitize_key($event_type), 0, 64),
                substr(sanitize_text_field($summary), 0, 255),
                substr(sanitize_textarea_field($details), 0, 2000),
                substr(sanitize_text_field($ip), 0, 45),
                $actor_id
            )
        );
    }

    public static function send_second_channel_alert(string $subject, string $message): void {
        $admin_email = (string) get_option('admin_email');
        if (is_email($admin_email)) {
            wp_mail($admin_email, '[MyStore Security Alert] ' . $subject, $message);
        }

        $webhook_url = mystore_get_secret_constant('MYSTORE_ALERT_WEBHOOK_URL');
        if ('' !== $webhook_url && str_starts_with($webhook_url, 'https://')) {
            wp_remote_post(
                $webhook_url,
                array(
                    'timeout'     => 5,
                    'blocking'    => false,
                    'headers'     => array('Content-Type' => 'application/json'),
                    'body'        => wp_json_encode(array(
                        'text'      => '[MyStore Alert] ' . $subject . ' — ' . $message,
                        'site'      => home_url('/'),
                        'timestamp' => gmdate('c'),
                    )),
                )
            );
        }
    }

    public static function monitor_new_user_creation(int $user_id): void {
        $user = get_userdata($user_id);
        if (!$user) {
            return;
        }
        if (array_intersect(array('administrator', 'shop_manager', 'editor'), (array) $user->roles)) {
            $msg = sprintf('New privileged account #%d created with roles: %s', $user_id, implode(', ', (array) $user->roles));
            self::log_event('privileged_user_created', $msg);
            self::send_second_channel_alert('Privileged User Created', $msg);
        }
    }

    public static function monitor_role_change(int $user_id, string $role, array $old_roles): void {
        $msg = sprintf('User #%d role changed from [%s] to [%s]', $user_id, implode(',', $old_roles), $role);
        self::log_event('user_role_changed', $msg);
        if (in_array($role, array('administrator', 'shop_manager'), true)) {
            self::send_second_channel_alert('User Promoted to Privileged Role', $msg);
        }
    }

    public static function monitor_plugin_activated(string $plugin): void {
        $msg = 'Plugin activated: ' . sanitize_text_field($plugin);
        self::log_event('plugin_activated', $msg);
        self::send_second_channel_alert('Plugin Activated', $msg);
        self::refresh_file_hash_baseline();
    }

    public static function monitor_plugin_deactivated(string $plugin): void {
        $msg = 'Plugin deactivated: ' . sanitize_text_field($plugin);
        self::log_event('plugin_deactivated', $msg);
        self::send_second_channel_alert('Plugin Deactivated', $msg);
    }

    public static function monitor_theme_switch(string $new_name): void {
        $msg = 'Active theme changed to: ' . sanitize_text_field($new_name);
        self::log_event('theme_switched', $msg);
        self::send_second_channel_alert('Theme Switched', $msg);
        self::refresh_file_hash_baseline();
    }

    public static function monitor_critical_option_change(string $option, mixed $old_value, mixed $new_value): void {
        $watched = array(
            'woocommerce_mystore_hosted_gateway_settings',
            'woocommerce_bacs_settings',
            'woocommerce_cod_settings',
            'admin_email',
            'default_role',
            'users_can_register',
            'siteurl',
            'home',
        );
        if (!in_array($option, $watched, true)) {
            return;
        }
        $msg = sprintf('Critical option updated: %s', sanitize_text_field($option));
        self::log_event('critical_option_changed', $msg);
        self::send_second_channel_alert('Critical Store Setting Changed', $msg);
    }

    public static function compute_directory_hashes(string $base_dir): array {
        $hashes = array();
        if (!is_dir($base_dir)) {
            return $hashes;
        }
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($base_dir, FilesystemIterator::SKIP_DOTS)
        );
        foreach ($iterator as $file) {
            if (!$file->isFile()) {
                continue;
            }
            $ext = strtolower($file->getExtension());
            if (!in_array($ext, array('php', 'js', 'css'), true)) {
                continue;
            }
            $real = $file->getRealPath();
            if (false !== $real) {
                $relative = ltrim(str_replace($base_dir, '', $real), '/\\');
                $hashes[$relative] = (string) hash_file('sha256', $real);
            }
        }
        ksort($hashes);
        return $hashes;
    }

    public static function refresh_file_hash_baseline(): void {
        $baseline = array(
            'plugin' => self::compute_directory_hashes(MYSTORE_PLUGIN_DIR),
            'theme'  => self::compute_directory_hashes(get_stylesheet_directory()),
        );
        update_option('mystore_file_hash_baseline', $baseline, false);
    }

    public static function run_scheduled_integrity_check(): void {
        global $wp_version;
        $diffs = array();

        // 1. Compare core files against official WordPress checksums API.
        $checksum_res = wp_remote_get(
            sprintf('https://api.wordpress.org/core/checksums/1.0/?version=%s&locale=%s', rawurlencode((string) $wp_version), rawurlencode(get_locale())),
            array('timeout' => 10)
        );
        if (!is_wp_error($checksum_res) && 200 === wp_remote_retrieve_response_code($checksum_res)) {
            $body = json_decode(wp_remote_retrieve_body($checksum_res), true);
            if (!empty($body['checksums']) && is_array($body['checksums'])) {
                foreach ($body['checksums'] as $file => $expected_md5) {
                    if (str_starts_with((string) $file, 'wp-content/')) {
                        continue;
                    }
                    $path = ABSPATH . $file;
                    if (!file_exists($path) || md5_file($path) !== $expected_md5) {
                        $diffs[] = 'WP Core mismatch: ' . $file;
                        if (count($diffs) >= 25) {
                            break;
                        }
                    }
                }
            }
        }

        // 2. Compare plugin and active child theme files against stored SHA-256 baseline.
        $baseline = get_option('mystore_file_hash_baseline', array());
        if (is_array($baseline)) {
            $current = array(
                'plugin' => self::compute_directory_hashes(MYSTORE_PLUGIN_DIR),
                'theme'  => self::compute_directory_hashes(get_stylesheet_directory()),
            );
            foreach (array('plugin', 'theme') as $scope) {
                $prev_map = isset($baseline[$scope]) && is_array($baseline[$scope]) ? $baseline[$scope] : array();
                $curr_map = $current[$scope];
                foreach ($curr_map as $rel => $hash) {
                    if (!isset($prev_map[$rel])) {
                        $diffs[] = strtoupper($scope) . ' unexpected file: ' . $rel;
                    } elseif (!hash_equals($prev_map[$rel], $hash)) {
                        $diffs[] = strtoupper($scope) . ' modified file: ' . $rel;
                    }
                }
                foreach ($prev_map as $rel => $_hash) {
                    if (!isset($curr_map[$rel])) {
                        $diffs[] = strtoupper($scope) . ' missing file: ' . $rel;
                    }
                }
            }
        }

        if (!empty($diffs)) {
            $summary = 'File integrity check detected ' . count($diffs) . ' difference(s).';
            $details = implode("\n", array_slice($diffs, 0, 25));
            self::log_event('integrity_mismatch', $summary, $details, '127.0.0.1');
            self::send_second_channel_alert($summary, $details);
        } else {
            self::log_event('integrity_ok', 'Scheduled core & plugin integrity check passed.', '', '127.0.0.1');
        }
    }
}
