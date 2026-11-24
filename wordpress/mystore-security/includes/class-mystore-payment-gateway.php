<?php
declare(strict_types=1);

defined('ABSPATH') || exit;

/**
 * [PAYMENT PROVIDER] Hosted Checkout WooCommerce Payment Gateway (PCI DSS SAQ A & Fraud Rules).
 * Never collects, stores, or logs PAN or CVV on this server; orders are marked paid ONLY via signed webhooks.
 */
function mystore_init_hosted_gateway_class(): void {
    if (!class_exists('WC_Payment_Gateway')) {
        return;
    }

    class Mystore_Payment_Gateway extends WC_Payment_Gateway {
        public function __construct() {
            $this->id                 = 'mystore_hosted_gateway';
            $this->method_title       = __('MyStore Hosted Checkout ([PAYMENT PROVIDER])', 'mystore-security');
            $this->method_description = __('Redirects customers to [PAYMENT PROVIDER] hosted checkout with 3D Secure, AVS/CVV, and signed webhook verification. Zero card fields touch this WordPress server.', 'mystore-security');
            $this->has_fields         = false;
            $this->supports           = array('products', 'refunds');

            $this->init_form_fields();
            $this->init_settings();

            $this->title       = (string) $this->get_option('title', __('Card & Mobile Payment (3D Secure Hosted Checkout)', 'mystore-security'));
            $this->description = (string) $this->get_option('description', __('You will be securely redirected to [PAYMENT PROVIDER] hosted checkout to complete payment.', 'mystore-security'));
            $this->enabled     = (string) $this->get_option('enabled', 'yes');

            add_action('woocommerce_update_options_payment_gateways_' . $this->id, array($this, 'process_admin_options'));
        }

        public function init_form_fields(): void {
            $this->form_fields = array(
                'enabled' => array(
                    'title'   => __('Enable/Disable', 'mystore-security'),
                    'type'    => 'checkbox',
                    'label'   => __('Enable Hosted [PAYMENT PROVIDER] Checkout', 'mystore-security'),
                    'default' => 'yes',
                ),
                'title' => array(
                    'title'   => __('Checkout Title', 'mystore-security'),
                    'type'    => 'text',
                    'default' => __('Card / Mobile Money (3D Secure Hosted Checkout)', 'mystore-security'),
                ),
                'description' => array(
                    'title'   => __('Customer Notice', 'mystore-security'),
                    'type'    => 'textarea',
                    'default' => __('Payments are processed off-site inside [PAYMENT PROVIDER] PCI-compliant hosted checkout with 3D Secure verification.', 'mystore-security'),
                ),
                'sandbox_mode' => array(
                    'title'   => __('Sandbox Mode', 'mystore-security'),
                    'type'    => 'checkbox',
                    'label'   => __('Use [PAYMENT PROVIDER] sandbox endpoints (recommended while testing)', 'mystore-security'),
                    'default' => 'yes',
                ),
            );
        }

        public function process_payment($order_id): array {
            $order = wc_get_order(absint($order_id));
            if (!($order instanceof WC_Order)) {
                wc_add_notice(__('Unable to locate order.', 'mystore-security'), 'error');
                return array('result' => 'fail');
            }

            // Always calculate authoritative totals on the server from WooCommerce database records.
            $order->calculate_totals(true);
            $order->save();

            // Block repeated failed payment card-testing attacks before touching payment provider.
            $ip    = Mystore_Hardening::get_client_ip();
            $email = strtolower($order->get_billing_email());
            if (self::is_payment_blocked($ip, $email)) {
                Mystore_Integrity::log_event('payment_card_testing_blocked', 'Blocked checkout after repeated failed payments', $email, $ip);
                wc_add_notice(__('Multiple failed payment attempts detected. Please wait 15 minutes before retrying.', 'mystore-security'), 'error');
                return array('result' => 'fail');
            }

            // Evaluate fraud rules (velocity, billing/shipping mismatch, high-value manual review hold).
            $fraud_flags = self::evaluate_fraud_rules($order, $ip, $email);
            if (in_array('velocity_exceeded', $fraud_flags, true)) {
                wc_add_notice(__('Order velocity limit reached. Please contact store support if you need bulk assistance.', 'mystore-security'), 'error');
                return array('result' => 'fail');
            }

            if (!empty($fraud_flags)) {
                $order->update_meta_data('_mystore_fraud_flags', implode(',', $fraud_flags));
                $order->add_order_note(sprintf(__('Security fraud flags recorded: %s', 'mystore-security'), implode(', ', $fraud_flags)));
            }

            if (in_array('high_value_hold', $fraud_flags, true)) {
                $order->update_meta_data('_mystore_requires_manual_review', '1');
                $order->update_status('on-hold', __('Held automatically for manual fraud review due to high order value.', 'mystore-security'));
            } else {
                $order->update_status('pending', __('Awaiting [PAYMENT PROVIDER] server-to-server payment webhook confirmation.', 'mystore-security'));
            }

            $idempotency_key = wp_generate_uuid4();
            $order->update_meta_data('_mystore_payment_idempotency', $idempotency_key);
            $order->save();

            $hosted_url = $this->create_hosted_checkout_session($order, $idempotency_key);
            if (is_wp_error($hosted_url)) {
                wc_add_notice($hosted_url->get_error_message(), 'error');
                return array('result' => 'fail');
            }

            return array(
                'result'   => 'success',
                'redirect' => $hosted_url,
            );
        }

        private function create_hosted_checkout_session(WC_Order $order, string $idempotency_key): string|WP_Error {
            $secret_key = mystore_get_secret_constant('MYSTORE_PAYMENT_SECRET_KEY');
            $sandbox    = 'yes' === $this->get_option('sandbox_mode', 'yes');
            $endpoint   = mystore_get_secret_constant('MYSTORE_PAYMENT_API_URL');

            if ('' === $secret_key || str_contains($secret_key, 'REPLACE_WITH') || '' === $endpoint) {
                if ($sandbox) {
                    // Safe placeholder return URL during local sandbox testing when keys are not yet provisioned.
                    $order->add_order_note(__('Sandbox placeholder hosted redirect used (set MYSTORE_PAYMENT_SECRET_KEY and MYSTORE_PAYMENT_API_URL for live sessions).', 'mystore-security'));
                    return $this->get_return_url($order);
                }
                return new WP_Error('mystore_gateway_config', __('Payment gateway credentials are not configured cleanly on the server.', 'mystore-security'));
            }

            $amount_minor = (int) round((float) $order->get_total() * 100);
            $payload      = array(
                'amount_minor'   => $amount_minor,
                'currency'       => $order->get_currency(),
                'order_id'       => $order->get_id(),
                'order_key'      => $order->get_order_key(),
                'customer_email' => $order->get_billing_email(),
                'require_3ds'    => true,
                'require_cvv'    => true,
                'require_avs'    => true,
                'success_url'    => $this->get_return_url($order),
                'cancel_url'     => $order->get_cancel_order_url_raw(),
                'webhook_url'    => rest_url('mystore/v1/payment-webhook'),
            );

            $res = wp_remote_post($endpoint, array(
                'timeout' => 12,
                'headers' => array(
                    'Authorization'    => 'Bearer ' . $secret_key,
                    'Content-Type'     => 'application/json',
                    'Idempotency-Key'  => $idempotency_key,
                ),
                'body'    => wp_json_encode($payload),
            ));

            if (is_wp_error($res) || wp_remote_retrieve_response_code($res) >= 400) {
                return new WP_Error('mystore_gateway_error', __('Could not start hosted payment session. Please try again.', 'mystore-security'));
            }

            $body = json_decode(wp_remote_retrieve_body($res), true);
            $url  = isset($body['checkout_url']) ? esc_url_raw((string) $body['checkout_url']) : '';
            if ('' === $url || !str_starts_with($url, 'https://')) {
                return new WP_Error('mystore_gateway_url', __('Invalid hosted checkout session returned by payment provider.', 'mystore-security'));
            }

            return $url;
        }

        public static function is_payment_blocked(string $ip, string $email): bool {
            $ip_fails    = (int) get_transient('mystore_pay_fail_ip_' . md5($ip));
            $email_fails = '' !== $email ? (int) get_transient('mystore_pay_fail_em_' . md5($email)) : 0;
            return ($ip_fails >= 3) || ($email_fails >= 3);
        }

        public static function record_failed_payment(string $ip, string $email, string $card_fingerprint = ''): void {
            $k_ip = 'mystore_pay_fail_ip_' . md5($ip);
            set_transient($k_ip, ((int) get_transient($k_ip)) + 1, 900);
            if ('' !== $email) {
                $k_em = 'mystore_pay_fail_em_' . md5($email);
                set_transient($k_em, ((int) get_transient($k_em)) + 1, 900);
            }
            if ('' !== $card_fingerprint) {
                $k_fp = 'mystore_pay_fail_fp_' . md5($card_fingerprint);
                set_transient($k_fp, ((int) get_transient($k_fp)) + 1, 1800);
            }
        }

        public static function evaluate_fraud_rules(WC_Order $order, string $ip, string $email): array {
            $flags = array();

            // 1. Velocity limit per IP and email per hour.
            $max_per_hour = max(1, absint(Mystore_Settings::get_option('velocity_max_orders_per_hour', 4)));
            $v_ip_key     = 'mystore_order_vel_ip_' . md5($ip);
            $v_em_key     = 'mystore_order_vel_em_' . md5($email);
            $ip_cnt       = (int) get_transient($v_ip_key);
            $em_cnt       = '' !== $email ? (int) get_transient($v_em_key) : 0;

            if ($ip_cnt >= $max_per_hour || $em_cnt >= $max_per_hour) {
                $flags[] = 'velocity_exceeded';
                return $flags;
            }
            set_transient($v_ip_key, $ip_cnt + 1, 3600);
            if ('' !== $email) {
                set_transient($v_em_key, $em_cnt + 1, 3600);
            }

            // 2. Billing vs Shipping address mismatch flag.
            $ship_country = strtoupper(trim($order->get_shipping_country()));
            $bill_country = strtoupper(trim($order->get_billing_country()));
            $ship_city    = strtolower(trim($order->get_shipping_city()));
            $bill_city    = strtolower(trim($order->get_billing_city()));
            if (('' !== $ship_country && $ship_country !== $bill_country) || ('' !== $ship_city && $ship_city !== $bill_city)) {
                $flags[] = 'billing_shipping_mismatch';
            }

            // 3. Large order manual review hold.
            $hold_threshold = (float) absint(Mystore_Settings::get_option('high_value_hold_kes', 50000));
            if ((float) $order->get_total() >= $hold_threshold) {
                $flags[] = 'high_value_hold';
            }

            return $flags;
        }
    }
}
add_action('plugins_loaded', 'mystore_init_hosted_gateway_class', 11);

/**
 * Signed Server-to-Server Payment Webhook Endpoint with Replay Protection & Idempotency.
 */
final class Mystore_Payment_Webhook {
    public static function register_routes(): void {
        register_rest_route('mystore/v1', '/payment-webhook', array(
            'methods'             => 'POST',
            'permission_callback' => array(self::class, 'verify_webhook_signature'),
            'callback'            => array(self::class, 'handle_webhook'),
        ));
    }

    public static function verify_webhook_signature(WP_REST_Request $request): bool|WP_Error {
        $secret = mystore_get_secret_constant('MYSTORE_PAYMENT_WEBHOOK_SECRET');
        if ('' === $secret) {
            return new WP_Error('mystore_webhook_unconfigured', __('Webhook secret is not configured.', 'mystore-security'), array('status' => 403));
        }

        $signature = sanitize_text_field((string) $request->get_header('x-mystore-signature'));
        $timestamp = absint($request->get_header('x-mystore-timestamp'));
        if ('' === $signature || 0 === $timestamp) {
            return new WP_Error('mystore_webhook_headers', __('Missing webhook authentication headers.', 'mystore-security'), array('status' => 401));
        }

        // Replay protection window: 5 minutes (300 seconds).
        if (abs(time() - $timestamp) > 300) {
            return new WP_Error('mystore_webhook_replay', __('Webhook timestamp outside allowed window.', 'mystore-security'), array('status' => 401));
        }

        $raw_body  = (string) $request->get_body();
        $expected  = hash_hmac('sha256', $timestamp . '.' . $raw_body, $secret);
        $norm_sig  = strtolower((string) preg_replace('/^sha256=/i', '', $signature));
        if (!hash_equals($expected, $norm_sig)) {
            Mystore_Integrity::log_event('webhook_signature_invalid', 'Rejected payment webhook with invalid HMAC signature.');
            return new WP_Error('mystore_webhook_sig', __('Invalid webhook signature.', 'mystore-security'), array('status' => 403));
        }

        return true;
    }

    public static function handle_webhook(WP_REST_Request $request): WP_REST_Response {
        $payload = json_decode((string) $request->get_body(), true);
        if (!is_array($payload)) {
            return new WP_REST_Response(array('error' => 'Invalid JSON payload'), 400);
        }

        $event_id    = sanitize_key((string) ($payload['event_id'] ?? ''));
        $event_type  = sanitize_text_field((string) ($payload['event_type'] ?? ''));
        $order_id    = absint($payload['order_id'] ?? 0);
        $tx_id       = sanitize_text_field((string) ($payload['transaction_id'] ?? ''));
        $amount_paid = absint($payload['amount_minor'] ?? 0);
        $currency    = strtoupper(sanitize_text_field((string) ($payload['currency'] ?? '')));
        $card_fp     = sanitize_text_field((string) ($payload['card_fingerprint'] ?? ''));

        if ('' === $event_id || 0 === $order_id) {
            return new WP_REST_Response(array('error' => 'Missing event_id or order_id'), 400);
        }

        $order = wc_get_order($order_id);
        if (!($order instanceof WC_Order) || 'mystore_hosted_gateway' !== $order->get_payment_method()) {
            return new WP_REST_Response(array('error' => 'Order not eligible for hosted gateway webhook'), 404);
        }

        // Idempotency check prevents duplicate status transitions.
        $idem_meta = '_mystore_webhook_processed_' . $event_id;
        if ('1' === (string) $order->get_meta($idem_meta, true)) {
            return new WP_REST_Response(array('status' => 'already_processed'), 200);
        }
        $order->update_meta_data($idem_meta, '1');

        if ('payment.failed' === $event_type) {
            Mystore_Payment_Gateway::record_failed_payment(
                (string) $order->get_customer_ip_address(),
                strtolower($order->get_billing_email()),
                $card_fp
            );
            $order->add_order_note(__('Payment failed via signed provider webhook.', 'mystore-security'));
            $order->save();
            return new WP_REST_Response(array('status' => 'failure_recorded'), 200);
        }

        if ('payment.succeeded' === $event_type) {
            $expected_minor = (int) round((float) $order->get_total() * 100);
            $expected_curr  = strtoupper($order->get_currency());

            if ($amount_paid !== $expected_minor || $currency !== $expected_curr) {
                $order->update_status('on-hold', __('Payment webhook amount/currency mismatch detected against DB total.', 'mystore-security'));
                $order->save();
                Mystore_Integrity::send_second_channel_alert(
                    'Payment Amount Mismatch on Order #' . $order_id,
                    sprintf('Expected %d %s, received %d %s.', $expected_minor, $expected_curr, $amount_paid, $currency)
                );
                return new WP_REST_Response(array('status' => 'mismatch_held'), 200);
            }

            if ('' !== $card_fp && (int) get_transient('mystore_pay_fail_fp_' . md5($card_fp)) >= 3) {
                $order->update_status('on-hold', __('Held for review: card fingerprint previously triggered failed payment attempts.', 'mystore-security'));
                $order->save();
                return new WP_REST_Response(array('status' => 'card_velocity_held'), 200);
            }

            if ('1' === (string) $order->get_meta('_mystore_requires_manual_review', true)) {
                $order->set_transaction_id($tx_id);
                $order->add_order_note(__('Payment confirmed via verified webhook; awaiting staff manual review completion.', 'mystore-security'));
                $order->save();
                return new WP_REST_Response(array('status' => 'verified_awaiting_review'), 200);
            }

            $order->payment_complete($tx_id);
            $order->add_order_note(sprintf(__('Payment verified via signed server-to-server webhook (%s).', 'mystore-security'), $event_id));
            $order->save();
            return new WP_REST_Response(array('status' => 'completed'), 200);
        }

        $order->save();
        return new WP_REST_Response(array('status' => 'ignored_event'), 200);
    }
}
add_action('rest_api_init', array('Mystore_Payment_Webhook', 'register_routes'));
