import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  Sparkles,
} from 'lucide-react';
import type { AuthUser } from '../types/dairy';
import {
  deriveDisplayNameFromEmail,
  sanitizeAndValidateEmail,
  sanitizeTextInput,
} from '../utils/security';
import { buildApiHeaders, resolveApiUrl } from '../utils/wpConfig';

interface EmailSignInPanelProps {
  authUser: AuthUser | null;
  onSignedIn: (user: AuthUser, sessionToken?: string) => void;
  onSignOut: () => void;
  heading?: string;
  subtitle?: string;
  compact?: boolean;
}

export function EmailSignInPanel({
  authUser,
  onSignedIn,
  onSignOut,
  heading = 'Sign in with your email to order',
  subtitle = 'Verify your email in seconds so your order receipt, M-Pesa dispatch tracking, and history stay linked to you.',
  compact = false,
}: EmailSignInPanelProps) {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [emailInput, setEmailInput] = useState(authUser?.email ?? '');
  const [verifiedTargetEmail, setVerifiedTargetEmail] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [isStaticFallback, setIsStaticFallback] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (authUser) {
    return (
      <div
        data-testid="email-signed-in-banner"
        className="bg-[#f0fdf4] border border-[#bbf7d0] p-3.5 flex flex-wrap items-center justify-between gap-3"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <CheckCircle2 className="w-4 h-4 text-[#15803d] shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#15803d]">
              Signed In via Email
            </div>
            <div className="text-xs font-bold text-[#0d2433] truncate">
              {authUser.email}
            </div>
          </div>
        </div>
        <button
          type="button"
          data-testid="sign-out-email-btn"
          onClick={onSignOut}
          className="inline-flex items-center gap-1.5 bg-white hover:bg-[#fef2f2] text-[#0d2433] hover:text-[#991b1b] border border-[#bbf7d0] hover:border-[#fecaca] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-colors min-h-[36px]"
        >
          <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Sign out</span>
        </button>
      </div>
    );
  }

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = sanitizeAndValidateEmail(emailInput);
    if (!cleanEmail) {
      setError('Please enter a valid email address (e.g. wanjiku@example.com).');
      return;
    }

    setError('');
    setBusy(true);
    try {
      const res = await fetch(resolveApiUrl('/api/auth/request-code'), {
        method: 'POST',
        credentials: 'same-origin',
        headers: buildApiHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ email: cleanEmail }),
      });

      const contentType = res.headers.get('content-type') ?? '';
      if (!contentType.includes('application/json')) {
        // Graceful preview fallback when hosted purely statically without Express
        const buf = new Uint32Array(1);
        const fallbackCode =
          typeof window !== 'undefined' && window.crypto?.getRandomValues
            ? String(100000 + (window.crypto.getRandomValues(buf)[0] % 900000))
            : String(100000 + (Date.now() % 900000));
        setVerifiedTargetEmail(cleanEmail);
        setPreviewCode(fallbackCode);
        setIsStaticFallback(true);
        setStep('code');
        return;
      }

      const data = (await res.json()) as {
        ok?: boolean;
        email?: string;
        previewCode?: string;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'Could not send verification code. Please retry.');
        return;
      }

      setVerifiedTargetEmail(data.email ?? cleanEmail);
      setPreviewCode(data.previewCode ?? null);
      setIsStaticFallback(false);
      setCodeInput('');
      setStep('code');
    } catch {
      setError('Network error while checking your email. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const submitCodeVerification = async (submittedCode: string) => {
    const cleanCode = sanitizeTextInput(submittedCode, 12).replace(/\s+/g, '');
    if (!/^\d{6}$/.test(cleanCode)) {
      setError('Enter the 6-digit verification code sent to your email.');
      return;
    }

    setError('');
    setBusy(true);
    try {
      if (isStaticFallback) {
        if (previewCode && cleanCode !== previewCode) {
          setError('Verification code did not match. Tap "Use Preview Code" or try again.');
          return;
        }
        onSignedIn({
          email: verifiedTargetEmail,
          displayName: deriveDisplayNameFromEmail(verifiedTargetEmail),
          signedInAt: new Date().toISOString(),
          verified: true,
        });
        return;
      }

      const res = await fetch(resolveApiUrl('/api/auth/verify-code'), {
        method: 'POST',
        credentials: 'same-origin',
        headers: buildApiHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          email: verifiedTargetEmail,
          code: cleanCode,
        }),
      });

      const contentType = res.headers.get('content-type') ?? '';
      if (!contentType.includes('application/json')) {
        onSignedIn({
          email: verifiedTargetEmail,
          displayName: deriveDisplayNameFromEmail(verifiedTargetEmail),
          signedInAt: new Date().toISOString(),
          verified: true,
        });
        return;
      }

      const data = (await res.json()) as {
        authenticated?: boolean;
        user?: AuthUser;
        sessionToken?: string;
        error?: string;
      };

      if (!res.ok || !data.authenticated || !data.user) {
        setError(data.error ?? 'Invalid or expired code. Please try again.');
        return;
      }

      onSignedIn(data.user, data.sessionToken);
    } catch {
      setError('Network error while verifying code. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submitCodeVerification(codeInput);
  };

  return (
    <div
      data-testid="email-signin-gate"
      className={`bg-[#eef8fe] border-2 border-[#27a8ec]/60 ${
        compact ? 'p-4' : 'p-5'
      } space-y-3.5 shadow-[0_12px_32px_-20px_rgba(10,116,181,0.3)]`}
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 bg-[#0a74b5] text-white flex items-center justify-center shrink-0">
          <Lock className="w-4 h-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#0a74b5]">
            Required Before Ordering
          </div>
          <h3 className="text-sm font-bold text-[#0d2433] leading-snug">
            {heading}
          </h3>
          {!compact && (
            <p className="text-xs text-[#0d2433]/75 mt-1 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {step === 'email' ? (
        <form onSubmit={handleRequestCode} noValidate className="space-y-3">
          <div>
            <label
              htmlFor="order-signin-email"
              className="block text-xs font-semibold text-[#0d2433] mb-1"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail
                className="w-4 h-4 text-[#0a74b5] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="order-signin-email"
                data-testid="signin-email-input"
                type="email"
                inputMode="email"
                autoComplete="email"
                maxLength={160}
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  if (error) setError('');
                }}
                placeholder="you@example.com"
                className="w-full min-h-[44px] pl-10 pr-3.5 py-2.5 text-sm bg-white border border-[#c3e8fb] text-[#0d2433] focus:outline-none focus:ring-2 focus:ring-[#27a8ec]"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs font-semibold text-[#991b1b]" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            data-testid="signin-send-code-btn"
            className="btn-shine w-full min-h-[44px] inline-flex items-center justify-center gap-2 bg-[#0d2433] hover:bg-[#0a74b5] disabled:opacity-60 text-white text-xs font-bold uppercase tracking-[0.14em] px-4 py-3 cursor-pointer transition-colors"
          >
            <span>{busy ? 'Sending Code...' : 'Continue with Email'}</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifySubmit} noValidate className="space-y-3">
          <div className="bg-white border border-[#c3e8fb] px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-[#0d2433]/80 truncate">
              Code for <strong className="text-[#0d2433]">{verifiedTargetEmail}</strong>
            </span>
            <button
              type="button"
              onClick={() => {
                setStep('email');
                setCodeInput('');
                setPreviewCode(null);
                setError('');
              }}
              className="text-[11px] font-bold text-[#0a74b5] hover:text-[#0d2433] uppercase tracking-wider cursor-pointer"
            >
              Change email
            </button>
          </div>

          {previewCode && (
            <div
              data-testid="preview-otp-banner"
              className="bg-white border border-[#27a8ec] p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center gap-1.5 text-[#0d2433]">
                <Sparkles className="w-3.5 h-3.5 text-[#0a74b5] shrink-0" aria-hidden="true" />
                <span>
                  Preview code:{' '}
                  <strong
                    data-testid="preview-otp-code"
                    className="font-black tracking-widest text-[#0a74b5] tabular-nums"
                  >
                    {previewCode}
                  </strong>
                </span>
              </div>
              <button
                type="button"
                data-testid="autofill-otp-btn"
                disabled={busy}
                onClick={() => {
                  setCodeInput(previewCode);
                  void submitCodeVerification(previewCode);
                }}
                className="bg-[#0a74b5] hover:bg-[#0d2433] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 cursor-pointer transition-colors"
              >
                Use &amp; Verify Now
              </button>
            </div>
          )}

          <div>
            <label
              htmlFor="order-signin-code"
              className="block text-xs font-semibold text-[#0d2433] mb-1"
            >
              6-Digit Verification Code
            </label>
            <div className="relative">
              <KeyRound
                className="w-4 h-4 text-[#0a74b5] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="order-signin-code"
                data-testid="signin-code-input"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={codeInput}
                onChange={(e) => {
                  const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setCodeInput(digitsOnly);
                  if (error) setError('');
                }}
                placeholder="Enter 6-digit code"
                className="w-full min-h-[44px] pl-10 pr-3.5 py-2.5 text-sm font-bold tracking-[0.25em] tabular-nums bg-white border border-[#c3e8fb] text-[#0d2433] focus:outline-none focus:ring-2 focus:ring-[#27a8ec]"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs font-semibold text-[#991b1b]" role="alert">
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={busy}
              data-testid="signin-verify-code-btn"
              className="btn-shine flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 bg-[#0a74b5] hover:bg-[#0d2433] disabled:opacity-60 text-white text-xs font-bold uppercase tracking-[0.14em] px-4 py-3 cursor-pointer transition-colors"
            >
              <span>{busy ? 'Verifying...' : 'Verify & Unlock Order'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
