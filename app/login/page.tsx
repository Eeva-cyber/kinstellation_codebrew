'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const authError = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(authError === 'auth_failed' ? 'Sign-in link expired or invalid. Try again.' : '');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col gap-8">
        {/* Header */}
        <div className="text-center">
          <div className="w-3 h-3 rounded-full bg-amber-400/60 mx-auto mb-4 animate-star-pulse" />
          <h1 className="text-white text-xl tracking-wide">Kinstellation</h1>
          <p className="text-white/40 text-sm mt-1">Your family&apos;s sky</p>
        </div>

        {sent ? (
          <div className="text-center text-white/70 text-sm leading-relaxed animate-fade-in">
            <p>Check your email for a sign-in link.</p>
            <p className="text-white/40 mt-2">You can close this tab once you click the link.</p>
            <button
              type="button"
              onClick={() => { setSent(false); setEmail(''); }}
              className="mt-6 text-amber-400/60 hover:text-amber-400/80 text-xs transition-colors"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 animate-fade-in">
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

            {error && (
              <p className="text-red-400/80 text-xs">{error}</p>
            )}

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
        )}
      </div>
    </div>
  );
}
