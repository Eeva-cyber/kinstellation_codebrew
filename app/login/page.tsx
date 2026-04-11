'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function LoginForm() {
  const searchParams = useSearchParams();
  const authError = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(
    authError === 'auth_failed'
      ? 'Sign-in link expired or invalid. Try again.'
      : '',
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const nextPath = searchParams.get('next') ?? '/canvas';
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  async function handleGoogleSignIn() {
    const nextPath = searchParams.get('next') ?? '/canvas';
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    });
    if (error) {
      setError(error.message);
    }
  }

  if (sent) {
    return (
      <div className="text-center text-white/70 text-sm leading-relaxed animate-fade-in">
        <p>Check your email for a sign-in link.</p>
        <p className="text-white/40 mt-2">
          You can close this tab once you click the link.
        </p>
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setEmail('');
          }}
          className="mt-6 text-amber-400/60 hover:text-amber-400/80 text-xs transition-colors"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-sm text-white/80 transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.0 24.0 0 0 0 0 21.56l7.98-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
        Continue with Google
      </button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-white/20 text-xs uppercase tracking-widest">or</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label
            className="text-white/60 text-xs tracking-widest uppercase"
            htmlFor="email"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="your@email.com"
            autoComplete="email"
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-amber-400/40 text-sm"
          />
        </div>

        {error && <p className="text-red-400/80 text-xs">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/20 text-amber-200 rounded-lg px-4 py-3 text-sm transition-colors disabled:opacity-40"
        >
          {loading ? 'Sending\u2026' : 'Send sign-in link'}
        </button>

        <p className="text-white/30 text-xs text-center leading-relaxed">
          We&apos;ll email you a link — no password needed.
        </p>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <div className="text-center">
          <div className="w-3 h-3 rounded-full bg-amber-400/60 mx-auto mb-4 animate-star-pulse" />
          <h1 className="text-white text-xl tracking-wide">Kinstellation</h1>
          <p className="text-white/40 text-sm mt-1">Your family&apos;s sky</p>
        </div>

        <Suspense fallback={<div className="h-32" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
