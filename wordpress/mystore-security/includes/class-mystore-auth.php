<?php
declare(strict_types=1);

defined('ABSPATH') || exit;

/**
 * Customer scope lock, bot protection, rate limits, mandatory staff 2FA, optional customer 2FA,
 * email verification, disposable-email & breached-password checks, session hygiene, and secure password resets.
 */
final class Mystore_Auth {
    private const MAX_LOGIN_ATTEMPTS  = 5;
    private const LOCKOUT_SECONDS     = 900;
    private const RESET_TTL_SECONDS   = 1200; // 20 minutes single-use token
    private const OTP_TTL_SECONDS     = 600;  // 10 minutes 2FA code

    public static function init(): void {
        // Strict customer-only registration lock.
        add_filter('pre_option_users_can_register', '__return_zero');
        add_filter('pre_option_default_role', static fn(): string => 'customer');
        add_filter('woocommerce_new_customer_data', array(self::class, 'force_customer_role_on_signup'));
        add_action('user_register', array(self::class, 'guard_public_registration_role'), 5, 1);

        // Customer /wp-admin/ and admin bar lock.
        add_filter('woocommerce_prevent_admin_access', array(self::class, 'prevent_customer_admin_access'));
        add_filter('show_admin_bar', array(self::class, 'filter_admin_bar'));
        add_action('admin_init', array(self::class, 'redirect_non_staff_from_admin'));

        // Separate staff login & IP restriction when configured.
        add_action('login_init', array(self::class, 'enforce_staff_login_route'));
        add_filter('authenticate', array(self::class, 'enforce_auth_security'), 30, 3);
        add_action('wp_login', array(self::class, 'handle_post_login_2fa_and_audit'), 10, 2);
        add_action('init', array(self::class, 'handle_security_actions'));

        // Registration email verification, disposable domain check, password strength & HIBP.
        add_filter('woocommerce_process_registration_errors', array(self::class, 'validate_wc_registration'), 10, 4);
        add_action('woocommerce_created_customer', array(self::class, 'send_email_verification_on_signup'), 10, 1);
        add_filter('woocommerce_process_login_errors', array(self::class, 'validate_wc_login_request'), 10, 3);
        add_action('lostpassword_post', array(self::class, 'validate_lost_password_request'), 10, 1);

        // Idle timeout for authenticated sessions & daily zero-order account cleanup.
        add_action('init', array(self::class, 'enforce_session_idle_timeout'), 25);
        add_action('mystore_cron_cleanup_inactive_accounts', array(self::class, 'cleanup_unverified_zero_order_accounts'));
    }

    public static function force_customer_role_on_signup(array $data): array {
        $data['role'] = 'customer';
        return $data;
    }

    public static function guard_public_registration_role(int $user_id): void {
        if (current_user_can('promote_users')) {
            return;
        }
        $user = get_userdata($user_id);
        if (!$user) {
            return;
        }
        if ((array) $user->roles !== array('customer')) {
            $user->set_role('customer');
            Mystore_Integrity::log_event('role_lock_enforced', 'Forced non-privileged registration back to customer role for user #' . $user_id);
        }
    }

    public static function is_staff_user(?WP_User $user = null): bool {
        if (null === $user) {
            $user = wp_get_current_user();
        }
        if (!($user instanceof WP_User) || 0 === $user->ID) {
            return false;
        }
        return user_can($user, 'manage_options') || user_can($user, 'manage_woocommerce');
    }

    public static function prevent_customer_admin_access(bool $prevent): bool {
        return !self::is_staff_user() ? true : $prevent;
    }

    public static function filter_admin_bar(bool $show): bool {
        return self::is_staff_user() ? $show : false;
    }

    public static function redirect_non_staff_from_admin(): void {
        if (wp_doing_ajax() || !is_user_logged_in()) {
            return;
        }
        if (!self::is_staff_user()) {
            wp_safe_redirect(function_exists('wc_get_page_permalink') ? wc_get_page_permalink('myaccount') : home_url('/'));
            exit;
        }
    }

    /**
     * Separate staff login URL + optional IP allowlist for wp-login.php.
     */
    public static function enforce_staff_login_route(): void {
        $action = isset($_REQUEST['action']) ? sanitize_key((string) $_REQUEST['action']) : '';
        if (in_array($action, array('logout', 'postpass'), true)) {
            return;
        }

        // Disable standard wp-login registration and unthrottled lostpassword endpoints.
        if ('register' === $action) {
            wp_safe_redirect(home_url('/'));
            exit;
        }

        $allowed_ips_raw = mystore_get_secret_constant('MYSTORE_STAFF_ALLOWED_IPS');
        if ('' !== $allowed_ips_raw) {
            $allowed = array_filter(array_map('trim', explode(',', $allowed_ips_raw)));
            $ip      = Mystore_Hardening::get_client_ip();
            if (!in_array($ip, $allowed, true)) {
                Mystore_Integrity::log_event('staff_login_ip_blocked', 'Blocked staff login access from non-allowlisted IP', $ip, $ip);
                status_header(403);
                wp_die(esc_html__('Access denied.', 'mystore-security'), 403);
            }
        }

        $staff_slug = mystore_get_secret_constant('MYSTORE_STAFF_LOGIN_SLUG');
        if ('' !== $staff_slug) {
            $provided = isset($_GET['mystore_staff']) ? sanitize_key((string) $_GET['mystore_staff']) : '';
            $cookie   = isset($_COOKIE['mystore_staff_gate']) ? sanitize_key((string) $_COOKIE['mystore_staff_gate']) : '';
            if (hash_equals($staff_slug, $provided)) {
                setcookie('mystore_staff_gate', $staff_slug, time() + 600, ADMIN_COOKIE_PATH, COOKIE_DOMAIN, is_ssl(), true);
                return;
            }
            if ('' === $cookie || !hash_equals($staff_slug, $cookie)) {
                status_header(404);
                wp_die(esc_html__('Not found.', 'mystore-security'), 404);
            }
        }
    }

    /**
     * Validate WooCommerce login requests (rate limit + bot protection + block staff on public login if desired).
     */
    public static function validate_wc_login_request(WP_Error $validation_error, string $username, string $password): WP_Error {
        if (self::is_rate_limited('login', $username)) {
            $validation_error->add('mystore_rate_limit', __('Too many login attempts. Please wait 15 minutes before trying again.', 'mystore-security'));
            return $validation_error;
        }

        if (!self::verify_bot_challenge('login')) {
            $validation_error->add('mystore_bot_check', __('Verification challenge failed. Please try again.', 'mystore-security'));
        }
        return $validation_error;
    }

    /**
     * Core WordPress authenticate hook: lockouts, wp-login customer block, email verification, and staff/customer 2FA gate.
     */
    public static function enforce_auth_security(mixed $user, string $username, string $password): mixed {
        if ('' === $username && '' === $password) {
            return $user;
        }

        if (self::is_rate_limited('login', $username)) {
            return new WP_Error('mystore_locked', __('Invalid credentials or too many attempts. Please try again later.', 'mystore-security'));
        }

        if (is_wp_error($user)) {
            self::record_failed_attempt('login', $username);
            return new WP_Error('mystore_invalid', __('Invalid credentials or verification failed.', 'mystore-security'));
        }

        if (!($user instanceof WP_User)) {
            return $user;
        }

        // Prevent customer accounts from authenticating via wp-login.php directly.
        $script_name = sanitize_text_field((string) ($_SERVER['SCRIPT_NAME'] ?? ''));
        if (str_ends_with($script_name, 'wp-login.php') && !self::is_staff_user($user)) {
            Mystore_Integrity::log_event('customer_wplogin_blocked', 'Blocked customer login attempt via wp-login.php for user #' . $user->ID);
            return new WP_Error('mystore_invalid', __('Customers must sign in via the storefront My Account page.', 'mystore-security'));
        }

        // Require email verification for newly registered customers.
        if (!self::is_staff_user($user) && !empty(Mystore_Settings::get_option('require_email_verification', 1))) {
            $verified = get_user_meta($user->ID, '_mystore_email_verified', true);
            if ('0' === (string) $verified) {
                return new WP_Error('mystore_unverified', __('Please verify your email address using the link sent to your inbox before signing in.', 'mystore-security'));
            }
        }

        self::clear_failed_attempts('login', $username);
        return $user;
    }

    /**
     * Trigger mandatory 2FA challenge for staff (or opt-in customer 2FA) and rotate session cookies.
     */
    public static function handle_post_login_2fa_and_audit(string $user_login, WP_User $user): void {
        if (wp_doing_cron() || (defined('REST_REQUEST') && REST_REQUEST)) {
            return;
        }

        // Record activity timestamp for idle timeout enforcement.
        update_user_meta($user->ID, '_mystore_last_activity', time());

        $require_2fa = self::is_staff_user($user)
            || (!empty(Mystore_Settings::get_option('enable_customer_2fa', 1)) && '1' === (string) get_user_meta($user->ID, '_mystore_2fa_enabled', true));

        // Skip challenge if current request already completed 2FA verification.
        if (isset($_REQUEST['mystore_2fa_verified_internal'])) {
            return;
        }

        if ($require_2fa && !is_email($user->user_email)) {
            if (self::is_staff_user($user)) {
                wp_clear_auth_cookie();
                wp_set_current_user(0);
                wp_die(esc_html__('Staff login requires a valid email address for two-factor authentication.', 'mystore-security'), 403);
            }
            return;
        }

        if ($require_2fa) {
            $challenge_token = bin2hex(random_bytes(24));
            $code            = (string) random_int(100000, 999999);
            $code_hash       = wp_hash($code . '|' . $challenge_token);

            set_transient(
                'mystore_2fa_' . $challenge_token,
                array(
                    'user_id'   => $user->ID,
                    'code_hash' => $code_hash,
                    'attempts'  => 0,
                    'redirect'  => self::is_staff_user($user) ? admin_url() : (function_exists('wc_get_page_permalink') ? wc_get_page_permalink('myaccount') : home_url('/')),
                ),
                self::OTP_TTL_SECONDS
            );

            // Destroy active auth cookie until 2FA code is verified cleanly.
            wp_clear_auth_cookie();
            wp_set_current_user(0);

            Mystore_Notifications::send_plain_verification_code_email($user->user_email, $code);
            Mystore_Integrity::log_event('2fa_challenge_sent', 'Issued 2FA verification code for user #' . $user->ID);

            $url = add_query_arg(
                array(
                    'mystore_action' => 'verify_2fa',
                    'token'          => $challenge_token,
                ),
                home_url('/')
            );
            wp_safe_redirect($url);
            exit;
        }

        Mystore_Integrity::log_event('user_login', 'User #' . $user->ID . ' signed in.');
    }

    /**
     * Validate WooCommerce customer registration: rate limits, honeypot/Turnstile, disposable domains, password strength & HIBP.
     */
    public static function validate_wc_registration(
        WP_Error $errors,
        string $username,
        string $password,
        string $email
    ): WP_Error {
        if (self::is_rate_limited('register', $email)) {
            $errors->add('mystore_rate_limit', __('Too many registration attempts. Please try again later.', 'mystore-security'));
            return $errors;
        }
        self::record_failed_attempt('register', $email);

        if (!self::verify_bot_challenge('register')) {
            $errors->add('mystore_bot', __('Automated request check failed. Please complete the challenge.', 'mystore-security'));
            return $errors;
        }

        $clean_email = sanitize_email($email);
        if (!is_email($clean_email)) {
            $errors->add('mystore_email', __('Please enter a valid email address.', 'mystore-security'));
            return $errors;
        }

        if (!empty(Mystore_Settings::get_option('block_disposable_emails', 1)) && self::is_disposable_email($clean_email)) {
            $errors->add('mystore_disposable', __('Disposable or temporary email addresses are not permitted.', 'mystore-security'));
            return $errors;
        }

        $pw_check = self::validate_password_policy($password);
        if (is_wp_error($pw_check)) {
            $errors->add($pw_check->get_error_code(), $pw_check->get_error_message());
        }

        return $errors;
    }

    public static function send_email_verification_on_signup(int $customer_id): void {
        if (empty(Mystore_Settings::get_option('require_email_verification', 1))) {
            update_user_meta($customer_id, '_mystore_email_verified', '1');
            return;
        }

        $user = get_userdata($customer_id);
        if (!$user || !is_email($user->user_email)) {
            return;
        }

        $raw_token = bin2hex(random_bytes(24));
        update_user_meta($customer_id, '_mystore_email_verified', '0');
        update_user_meta($customer_id, '_mystore_verify_token_hash', hash('sha256', $raw_token));
        update_user_meta($customer_id, '_mystore_verify_expires', time() + DAY_IN_SECONDS);

        $verify_url = add_query_arg(
            array(
                'mystore_action' => 'verify_email',
                'uid'            => $customer_id,
                'token'          => $raw_token,
            ),
            home_url('/')
        );

        $subject = __('Verify your email address — Limuru Dairy Store', 'mystore-security');
        $body    = sprintf(
            __("Welcome! Please confirm your email address within 24 hours by opening this link:\n\n%s\n\nIf you did not create an account, you can ignore this email.", 'mystore-security'),
            esc_url_raw($verify_url)
        );
        wp_mail($user->user_email, $subject, $body);
        Mystore_Integrity::log_event('email_verification_sent', 'Dispatched email verification token for customer #' . $customer_id);
    }

    public static function validate_lost_password_request(WP_Error $errors): void {
        if (self::is_rate_limited('reset', Mystore_Hardening::get_client_ip())) {
            $errors->add('mystore_reset_limit', __('If an account exists for that email, instructions have been sent.', 'mystore-security'));
            return;
        }
        self::record_failed_attempt('reset', Mystore_Hardening::get_client_ip());

        if (!self::verify_bot_challenge('reset')) {
            $errors->add('mystore_bot', __('Verification challenge failed. Please try again.', 'mystore-security'));
        }
    }

    /**
     * Handle standalone security GET/POST routes: email verification, 2FA OTP verification, single-use reset, logout all devices.
     */
    public static function handle_security_actions(): void {
        // 1. Email verification link handler.
        if (isset($_GET['mystore_action']) && 'verify_email' === sanitize_key((string) $_GET['mystore_action'])) {
            $uid   = isset($_GET['uid']) ? absint($_GET['uid']) : 0;
            $token = isset($_GET['token']) ? sanitize_text_field(wp_unslash((string) $_GET['token'])) : '';
            $saved = (string) get_user_meta($uid, '_mystore_verify_token_hash', true);
            $exp   = (int) get_user_meta($uid, '_mystore_verify_expires', true);

            if ($uid > 0 && '' !== $token && '' !== $saved && time() <= $exp && hash_equals($saved, hash('sha256', $token))) {
                update_user_meta($uid, '_mystore_email_verified', '1');
                delete_user_meta($uid, '_mystore_verify_token_hash');
                delete_user_meta($uid, '_mystore_verify_expires');
                Mystore_Integrity::log_event('email_verified', 'Customer #' . $uid . ' verified email address.');
                if (function_exists('wc_add_notice')) {
                    wc_add_notice(__('Email verified! You may now sign in to your account.', 'mystore-security'), 'success');
                }
            } else {
                if (function_exists('wc_add_notice')) {
                    wc_add_notice(__('Verification link is invalid or expired.', 'mystore-security'), 'error');
                }
            }
            wp_safe_redirect(function_exists('wc_get_page_permalink') ? wc_get_page_permalink('myaccount') : home_url('/'));
            exit;
        }

        // 2. 2FA verification form & submission handler.
        if (isset($_GET['mystore_action']) && 'verify_2fa' === sanitize_key((string) $_GET['mystore_action'])) {
            $token = isset($_REQUEST['token']) ? sanitize_text_field(wp_unslash((string) $_REQUEST['token'])) : '';
            $data  = '' !== $token ? get_transient('mystore_2fa_' . $token) : false;

            if ('POST' === ($_SERVER['REQUEST_METHOD'] ?? '') && isset($_POST['mystore_2fa_code'])) {
                check_admin_referer('mystore_verify_2fa_nonce', '_mystore_nonce');
                $submitted = preg_replace('/\D+/', '', (string) wp_unslash($_POST['mystore_2fa_code']));
                if (!is_array($data)) {
                    wp_die(esc_html__('Verification session expired. Please sign in again.', 'mystore-security'), 403);
                }

                $attempts = (int) ($data['attempts'] ?? 0);
                if ($attempts >= 5) {
                    delete_transient('mystore_2fa_' . $token);
                    wp_die(esc_html__('Too many incorrect codes. Please sign in again.', 'mystore-security'), 403);
                }

                if ('' !== $submitted && hash_equals((string) $data['code_hash'], wp_hash($submitted . '|' . $token))) {
                    delete_transient('mystore_2fa_' . $token);
                    $uid = (int) $data['user_id'];
                    // Rotate session cookie cleanly after 2FA completion.
                    wp_clear_auth_cookie();
                    wp_set_current_user($uid);
                    wp_set_auth_cookie($uid, false, is_ssl());
                    update_user_meta($uid, '_mystore_last_activity', time());
                    Mystore_Integrity::log_event('2fa_verified', 'User #' . $uid . ' completed 2FA verification.');
                    wp_safe_redirect((string) $data['redirect']);
                    exit;
                }

                $data['attempts'] = $attempts + 1;
                set_transient('mystore_2fa_' . $token, $data, self::OTP_TTL_SECONDS);
                $error_msg = __('Invalid 6-digit code. Please check your email and try again.', 'mystore-security');
            } else {
                $error_msg = '';
            }

            if (!is_array($data)) {
                wp_safe_redirect(home_url('/'));
                exit;
            }

            self::render_2fa_challenge_page($token, $error_msg);
            exit;
        }

        // 3. Log out of all devices handler.
        if (
            'POST' === ($_SERVER['REQUEST_METHOD'] ?? '') &&
            isset($_POST['mystore_action']) &&
            'logout_all_devices' === sanitize_key((string) $_POST['mystore_action']) &&
            is_user_logged_in()
        ) {
            check_admin_referer('mystore_logout_all_nonce', '_mystore_nonce');
            $uid     = get_current_user_id();
            $manager = WP_Session_Tokens::get_instance($uid);
            $manager->destroy_all();
            wp_clear_auth_cookie();
            Mystore_Integrity::log_event('logout_all_devices', 'User #' . $uid . ' terminated all active sessions.');
            wp_safe_redirect(function_exists('wc_get_page_permalink') ? wc_get_page_permalink('myaccount') : home_url('/'));
            exit;
        }

        // 4. Toggle optional Customer 2FA.
        if (
            'POST' === ($_SERVER['REQUEST_METHOD'] ?? '') &&
            isset($_POST['mystore_action']) &&
            'toggle_customer_2fa' === sanitize_key((string) $_POST['mystore_action']) &&
            is_user_logged_in()
        ) {
            check_admin_referer('mystore_toggle_2fa_nonce', '_mystore_nonce');
            $uid     = get_current_user_id();
            $enabled = !empty($_POST['mystore_enable_2fa']) ? '1' : '0';
            update_user_meta($uid, '_mystore_2fa_enabled', $enabled);
            Mystore_Notifications::notify_account_security_change($uid, '1' === $enabled ? 'Two-Factor Authentication Enabled' : 'Two-Factor Authentication Disabled');
            if (function_exists('wc_add_notice')) {
                wc_add_notice(__('Account 2FA preference updated.', 'mystore-security'), 'success');
            }
            wp_safe_redirect(function_exists('wc_get_page_permalink') ? wc_get_page_permalink('myaccount') : home_url('/'));
            exit;
        }

        // 5. Custom 20-minute single-use password reset token handler.
        if (
            'POST' === ($_SERVER['REQUEST_METHOD'] ?? '') &&
            isset($_POST['mystore_action']) &&
            'request_single_use_reset' === sanitize_key((string) $_POST['mystore_action'])
        ) {
            check_admin_referer('mystore_reset_request_nonce', '_mystore_nonce');
            $email = isset($_POST['mystore_reset_email']) ? sanitize_email(wp_unslash((string) $_POST['mystore_reset_email'])) : '';
            if (!self::is_rate_limited('reset', $email) && self::verify_bot_challenge('reset') && is_email($email)) {
                self::record_failed_attempt('reset', $email);
                $user = get_user_by('email', $email);
                if ($user instanceof WP_User) {
                    $raw_token = bin2hex(random_bytes(32));
                    update_user_meta($user->ID, '_mystore_reset_token_hash', hash('sha256', $raw_token));
                    update_user_meta($user->ID, '_mystore_reset_expires', time() + self::RESET_TTL_SECONDS);

                    $reset_url = add_query_arg(
                        array(
                            'mystore_action' => 'complete_reset',
                            'uid'            => $user->ID,
                            'token'          => $raw_token,
                        ),
                        home_url('/')
                    );
                    wp_mail(
                        $user->user_email,
                        __('Password Reset Link (Valid 20 Minutes) — Limuru Dairy Store', 'mystore-security'),
                        sprintf(
                            __("A single-use password reset link was requested for your account (expires in 20 minutes):\n\n%s\n\nIf you did not request this reset, please change your password by visiting the store directly.", 'mystore-security'),
                            esc_url_raw($reset_url)
                        )
                    );
                    Mystore_Integrity::log_event('password_reset_requested', 'Issued 20-minute single-use reset token for user #' . $user->ID);
                }
            }
            if (function_exists('wc_add_notice')) {
                // Identical generic message prevents account enumeration.
                wc_add_notice(__('If an account exists for that email, a single-use reset link valid for 20 minutes has been sent.', 'mystore-security'), 'notice');
            }
            wp_safe_redirect(function_exists('wc_get_page_permalink') ? wc_get_page_permalink('myaccount') : home_url('/'));
            exit;
        }

        // 6. Complete single-use 20-minute password reset (verify SHA-256 hash, validate policy, destroy all sessions).
        if (isset($_GET['mystore_action']) && 'complete_reset' === sanitize_key((string) $_GET['mystore_action'])) {
            $uid   = isset($_REQUEST['uid']) ? absint($_REQUEST['uid']) : 0;
            $token = isset($_REQUEST['token']) ? sanitize_text_field(wp_unslash((string) $_REQUEST['token'])) : '';
            $saved = (string) get_user_meta($uid, '_mystore_reset_token_hash', true);
            $exp   = (int) get_user_meta($uid, '_mystore_reset_expires', true);

            $valid_token = ($uid > 0 && '' !== $token && '' !== $saved && time() <= $exp && hash_equals($saved, hash('sha256', $token)));
            if (!$valid_token) {
                wp_die(esc_html__('This password reset link is invalid or has expired (20-minute limit).', 'mystore-security'), 403);
            }

            $error_msg = '';
            if ('POST' === ($_SERVER['REQUEST_METHOD'] ?? '') && isset($_POST['mystore_new_password'])) {
                check_admin_referer('mystore_complete_reset_nonce', '_mystore_nonce');
                $new_pass = (string) wp_unslash($_POST['mystore_new_password']);
                $confirm  = (string) wp_unslash($_POST['mystore_confirm_password'] ?? '');

                if ($new_pass !== $confirm) {
                    $error_msg = __('Passwords do not match.', 'mystore-security');
                } else {
                    $policy = self::validate_password_policy($new_pass);
                    if (is_wp_error($policy)) {
                        $error_msg = $policy->get_error_message();
                    } else {
                        delete_user_meta($uid, '_mystore_reset_token_hash');
                        delete_user_meta($uid, '_mystore_reset_expires');
                        wp_set_password($new_pass, $uid);
                        WP_Session_Tokens::get_instance($uid)->destroy_all();
                        $user = get_userdata($uid);
                        if ($user instanceof WP_User) {
                            Mystore_Notifications::alert_password_changed($user);
                        }
                        Mystore_Integrity::log_event('password_reset_completed', 'Single-use password reset completed for user #' . $uid);
                        wp_safe_redirect(function_exists('wc_get_page_permalink') ? wc_get_page_permalink('myaccount') : home_url('/'));
                        exit;
                    }
                }
            }

            self::render_password_reset_page($uid, $token, $error_msg);
            exit;
        }
    }

    private static function render_password_reset_page(int $uid, string $token, string $error_msg): void {
        nocache_headers();
        status_header(200);
        ?>
        <!DOCTYPE html>
        <html <?php language_attributes(); ?>>
        <head>
            <meta charset="<?php bloginfo('charset'); ?>" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title><?php esc_html_e('Choose New Password', 'mystore-security'); ?></title>
            <style>
                body { font-family: system-ui, -apple-system, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 32px 16px; }
                .mystore_2fa_box { max-width: 440px; margin: 48px auto; background: #fff; border: 1px solid #cbd5e1; border-radius: 12px; padding: 28px; box-shadow: 0 8px 24px rgba(15,23,42,0.06); }
                .mystore_2fa_err { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 10px 12px; border-radius: 8px; margin-bottom: 16px; font-size: 14px; }
                .mystore_2fa_input { width: 100%; box-sizing: border-box; font-size: 16px; padding: 10px 12px; border: 1px solid #94a3b8; border-radius: 8px; margin: 6px 0 14px; }
                .mystore_2fa_btn { width: 100%; padding: 12px 16px; background: #0f172a; color: #fff; border: 0; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; }
            </style>
        </head>
        <body>
            <div class="mystore_2fa_box">
                <h1><?php esc_html_e('Set a New Password', 'mystore-security'); ?></h1>
                <p><?php esc_html_e('Minimum 12 characters. Avoid previously used or breached passwords.', 'mystore-security'); ?></p>
                <?php if ('' !== $error_msg) : ?>
                    <div class="mystore_2fa_err"><?php echo esc_html($error_msg); ?></div>
                <?php endif; ?>
                <form method="post" action="<?php echo esc_url(add_query_arg(array('mystore_action' => 'complete_reset', 'uid' => $uid, 'token' => $token), home_url('/'))); ?>">
                    <?php wp_nonce_field('mystore_complete_reset_nonce', '_mystore_nonce'); ?>
                    <label for="mystore_new_password"><?php esc_html_e('New Password', 'mystore-security'); ?></label>
                    <input class="mystore_2fa_input" id="mystore_new_password" name="mystore_new_password" type="password" minlength="12" autocomplete="new-password" required />
                    <label for="mystore_confirm_password"><?php esc_html_e('Confirm New Password', 'mystore-security'); ?></label>
                    <input class="mystore_2fa_input" id="mystore_confirm_password" name="mystore_confirm_password" type="password" minlength="12" autocomplete="new-password" required />
                    <button class="mystore_2fa_btn" type="submit"><?php esc_html_e('Update Password', 'mystore-security'); ?></button>
                </form>
            </div>
        </body>
        </html>
        <?php
    }

    private static function render_2fa_challenge_page(string $token, string $error_msg): void {
        nocache_headers();
        status_header(200);
        ?>
        <!DOCTYPE html>
        <html <?php language_attributes(); ?>>
        <head>
            <meta charset="<?php bloginfo('charset'); ?>" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title><?php esc_html_e('Verify 2FA Code', 'mystore-security'); ?></title>
            <style>
                body { font-family: system-ui, -apple-system, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 32px 16px; }
                .mystore_2fa_box { max-width: 420px; margin: 48px auto; background: #fff; border: 1px solid #cbd5e1; border-radius: 12px; padding: 28px; box-shadow: 0 8px 24px rgba(15,23,42,0.06); }
                .mystore_2fa_err { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 10px 12px; border-radius: 8px; margin-bottom: 16px; font-size: 14px; }
                .mystore_2fa_input { width: 100%; box-sizing: border-box; font-size: 20px; letter-spacing: 0.25em; padding: 12px; border: 1px solid #94a3b8; border-radius: 8px; margin: 12px 0 18px; }
                .mystore_2fa_btn { width: 100%; padding: 12px 16px; background: #0f172a; color: #fff; border: 0; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; }
            </style>
        </head>
        <body>
            <div class="mystore_2fa_box">
                <h1><?php esc_html_e('Two-Factor Verification', 'mystore-security'); ?></h1>
                <p><?php esc_html_e('Enter the 6-digit verification code sent to your registered email address. The code expires in 10 minutes.', 'mystore-security'); ?></p>
                <?php if ('' !== $error_msg) : ?>
                    <div class="mystore_2fa_err"><?php echo esc_html($error_msg); ?></div>
                <?php endif; ?>
                <form method="post" action="<?php echo esc_url(add_query_arg(array('mystore_action' => 'verify_2fa', 'token' => $token), home_url('/'))); ?>">
                    <?php wp_nonce_field('mystore_verify_2fa_nonce', '_mystore_nonce'); ?>
                    <label for="mystore_2fa_code"><?php esc_html_e('6-Digit Verification Code', 'mystore-security'); ?></label>
                    <input class="mystore_2fa_input" id="mystore_2fa_code" name="mystore_2fa_code" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" required />
                    <button class="mystore_2fa_btn" type="submit"><?php esc_html_e('Verify & Continue', 'mystore-security'); ?></button>
                </form>
            </div>
        </body>
        </html>
        <?php
    }

    public static function enforce_session_idle_timeout(): void {
        if (!is_user_logged_in() || wp_doing_cron()) {
            return;
        }
        $uid       = get_current_user_id();
        $last_seen = (int) get_user_meta($uid, '_mystore_last_activity', true);
        $timeout   = max(5, absint(Mystore_Settings::get_option('idle_timeout_minutes', 30))) * 60;

        if ($last_seen > 0 && (time() - $last_seen) > $timeout) {
            wp_logout();
            wp_safe_redirect(function_exists('wc_get_page_permalink') ? wc_get_page_permalink('myaccount') : home_url('/'));
            exit;
        }
        if (0 === $last_seen || (time() - $last_seen) > 60) {
            update_user_meta($uid, '_mystore_last_activity', time());
        }
    }

    public static function cleanup_unverified_zero_order_accounts(): void {
        $days      = max(30, absint(Mystore_Settings::get_option('purge_zero_order_days', 90)));
        $cutoff    = gmdate('Y-m-d H:i:s', time() - ($days * DAY_IN_SECONDS));
        $candidates = get_users(array(
            'role'       => 'customer',
            'number'     => 100,
            'fields'     => 'ID',
            'date_query' => array(array('before' => $cutoff, 'inclusive' => true)),
        ));

        require_once ABSPATH . 'wp-admin/includes/user.php';

        foreach ($candidates as $uid) {
            $verified = get_user_meta((int) $uid, '_mystore_email_verified', true);
            if ('1' === (string) $verified) {
                continue;
            }
            $orders = function_exists('wc_get_orders')
                ? wc_get_orders(array('customer_id' => (int) $uid, 'limit' => 1, 'return' => 'ids'))
                : array();
            if (empty($orders)) {
                wp_delete_user((int) $uid);
                Mystore_Integrity::log_event('inactive_account_purged', 'Removed unverified zero-order customer #' . (int) $uid, '', '127.0.0.1');
            }
        }
    }

    /**
     * Password policy: >=12 chars, common-password blocklist, optional HIBP k-anonymity check.
     *
     * @return true|WP_Error
     */
    public static function validate_password_policy(string $password): true|WP_Error {
        if (strlen($password) < 12) {
            return new WP_Error('mystore_pw_len', __('Password must be at least 12 characters long.', 'mystore-security'));
        }

        $common = array(
            '123456789012', 'password1234', 'limurudairy1', 'qwerty123456',
            'administrator', 'changeme1234', 'letmein12345', 'welcome12345',
        );
        if (in_array(strtolower($password), $common, true)) {
            return new WP_Error('mystore_pw_common', __('Please choose a less predictable password.', 'mystore-security'));
        }

        if (!empty(Mystore_Settings::get_option('enable_hibp_check', 0))) {
            $sha1   = strtoupper(sha1($password));
            $prefix = substr($sha1, 0, 5);
            $suffix = substr($sha1, 5);
            $res    = wp_remote_get('https://api.pwnedpasswords.com/range/' . $prefix, array('timeout' => 3));
            if (!is_wp_error($res) && 200 === wp_remote_retrieve_response_code($res)) {
                $body = wp_remote_retrieve_body($res);
                if (str_contains($body, $suffix . ':')) {
                    return new WP_Error('mystore_pw_pwned', __('This password appeared in a known data breach. Please choose a unique password.', 'mystore-security'));
                }
            }
        }

        return true;
    }

    public static function is_disposable_email(string $email): bool {
        $parts  = explode('@', strtolower($email));
        $domain = $parts[1] ?? '';
        $blocked = array(
            'mailinator.com', 'guerrillamail.com', 'tempmail.com', '10minutemail.com',
            'yopmail.com', 'trashmail.com', 'dispostable.com', 'sharklasers.com',
        );
        return in_array($domain, $blocked, true);
    }

    /**
     * Bot challenge check: honeypot + Cloudflare Turnstile / Google reCAPTCHA server-side validation.
     */
    public static function verify_bot_challenge(string $context = 'general'): bool {
        // Hidden honeypot must remain empty.
        if (isset($_POST['mystore_hp']) && '' !== trim((string) wp_unslash($_POST['mystore_hp']))) {
            Mystore_Integrity::log_event('honeypot_triggered', 'Blocked bot via honeypot in context: ' . $context);
            return false;
        }

        $provider = (string) Mystore_Settings::get_option('bot_provider', 'turnstile');
        if ('none' === $provider) {
            return true;
        }

        if ('turnstile' === $provider) {
            $secret = mystore_get_secret_constant('MYSTORE_TURNSTILE_SECRET_KEY');
            if ('' === $secret) {
                return true; // Allow progression in pre-configuration local sandbox; checklist enforces configuration.
            }
            $token = isset($_POST['cf-turnstile-response']) ? sanitize_text_field(wp_unslash((string) $_POST['cf-turnstile-response'])) : '';
            if ('' === $token) {
                return false;
            }
            $res = wp_remote_post('https://challenges.cloudflare.com/turnstile/v0/siteverify', array(
                'timeout' => 5,
                'body'    => array(
                    'secret'   => $secret,
                    'response' => $token,
                    'remoteip' => Mystore_Hardening::get_client_ip(),
                ),
            ));
            if (is_wp_error($res)) {
                return false;
            }
            $json = json_decode(wp_remote_retrieve_body($res), true);
            return !empty($json['success']);
        }

        if ('recaptcha' === $provider) {
            $secret = mystore_get_secret_constant('MYSTORE_RECAPTCHA_SECRET_KEY');
            if ('' === $secret) {
                return true;
            }
            $token = isset($_POST['g-recaptcha-response']) ? sanitize_text_field(wp_unslash((string) $_POST['g-recaptcha-response'])) : '';
            if ('' === $token) {
                return false;
            }
            $res = wp_remote_post('https://www.google.com/recaptcha/api/siteverify', array(
                'timeout' => 5,
                'body'    => array(
                    'secret'   => $secret,
                    'response' => $token,
                    'remoteip' => Mystore_Hardening::get_client_ip(),
                ),
            ));
            if (is_wp_error($res)) {
                return false;
            }
            $json = json_decode(wp_remote_retrieve_body($res), true);
            return !empty($json['success']);
        }

        return true;
    }

    public static function is_rate_limited(string $bucket, string $identifier): bool {
        $ip   = Mystore_Hardening::get_client_ip();
        $key1 = 'mystore_rl_ip_' . md5($bucket . '|' . $ip);
        $key2 = 'mystore_rl_id_' . md5($bucket . '|' . strtolower(trim($identifier)));
        return ((int) get_transient($key1) >= self::MAX_LOGIN_ATTEMPTS) || ((int) get_transient($key2) >= self::MAX_LOGIN_ATTEMPTS);
    }

    public static function record_failed_attempt(string $bucket, string $identifier): void {
        $ip   = Mystore_Hardening::get_client_ip();
        $key1 = 'mystore_rl_ip_' . md5($bucket . '|' . $ip);
        $key2 = 'mystore_rl_id_' . md5($bucket . '|' . strtolower(trim($identifier)));
        set_transient($key1, ((int) get_transient($key1)) + 1, self::LOCKOUT_SECONDS);
        if ('' !== trim($identifier)) {
            set_transient($key2, ((int) get_transient($key2)) + 1, self::LOCKOUT_SECONDS);
        }
    }

    public static function clear_failed_attempts(string $bucket, string $identifier): void {
        $ip = Mystore_Hardening::get_client_ip();
        delete_transient('mystore_rl_ip_' . md5($bucket . '|' . $ip));
        if ('' !== trim($identifier)) {
            delete_transient('mystore_rl_id_' . md5($bucket . '|' . strtolower(trim($identifier))));
        }
    }
}
