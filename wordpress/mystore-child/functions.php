<?php
declare(strict_types=1);

defined('ABSPATH') || exit;

/**
 * Enqueue parent theme and MyStore Child styles strictly via wp_enqueue_style.
 */
function mystore_child_enqueue_styles(): void {
    $parent_handle = 'storefront-style';
    $theme         = wp_get_theme();

    wp_enqueue_style(
        $parent_handle,
        get_template_directory_uri() . '/style.css',
        array(),
        $theme->parent() ? $theme->parent()->get('Version') : '1.0.0'
    );

    wp_enqueue_style(
        'mystore-child-style',
        get_stylesheet_uri(),
        array($parent_handle),
        $theme->get('Version')
    );
}
add_action('wp_enqueue_scripts', 'mystore_child_enqueue_styles', 15);

/**
 * Declare WooCommerce support cleanly for child theme layouts.
 */
function mystore_child_theme_setup(): void {
    add_theme_support('woocommerce');
}
add_action('after_setup_theme', 'mystore_child_theme_setup');
