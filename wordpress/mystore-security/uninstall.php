<?php
declare(strict_types=1);

defined('WP_UNINSTALL_PLUGIN') || exit;

global $wpdb;
delete_option('mystore_security_options');
delete_option('mystore_file_hash_baseline');

$table_name = $wpdb->prefix . 'mystore_audit_log';
$wpdb->query("DROP TABLE IF EXISTS `{$table_name}`");
