# WordPress / WooCommerce Hardened Plugin & Child Theme

Security-first, HPOS-compatible WordPress plugin (`mystore-security`) and companion Storefront child theme (`mystore-child`). Built exclusively with **PHP 8.1+**, **vanilla JavaScript**, and **CSS** (no React, Vite, Node.js, or build step required inside WordPress).

## Shortcodes & Gutenberg Blocks

- `[mystore_quick_order]` (or Gutenberg block `mystore/quick-order`): Tray-aware WooCommerce Quick Order grid (`500ml = 6 pcs/tray`, `250ml = 12 pcs/tray`, `100ml = 24 pcs/tray`) using DB-authoritative pricing and CSRF nonces.
- `[mystore_delivery_status]` (or Gutenberg block `mystore/delivery-status`): Cold-chain dispatch ETA widget & checkout Delivery Window integration.
- `[mystore_how_we_contact_you]` (or Gutenberg block `mystore/how-we-contact-you`): Anti-scam customer verification notice page.
- `[mystore_trust_footer]`: Domain verification anti-phishing bar for Checkout and My Account pages.
- `[mystore_account_security]`: Optional 2FA preference toggle + *"Log out of all devices"* session killer.

## Installation Quick Start

1. Zip `/wordpress/mystore-security/` -> upload & activate via **Plugins → Add New → Upload Plugin** (requires WooCommerce 8.5+ and PHP 8.1+).
2. Zip `/wordpress/mystore-child/` -> upload & activate via **Appearance → Themes → Add New → Upload Theme** (requires Storefront parent theme).
3. Add required constants (`MYSTORE_PAYMENT_*`, `MYSTORE_TURNSTILE_*`, `MYSTORE_STAFF_LOGIN_SLUG`, `MYSTORE_ALERT_WEBHOOK_URL`, SMTP credentials) to `wp-config.php` before enabling live payments.
4. Configure storefront policies under **Settings → MyStore Security** and enable **Hosted [PAYMENT PROVIDER] Checkout** under **WooCommerce → Settings → Payments**.
