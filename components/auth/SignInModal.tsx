'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

type View = 'signin' | 'signup';

interface SignInModalProps {
  defaultView?: View;
  onClose: () => void;
  onSuccess?: () => void;
}

export function SignInModal({ defaultView = 'signin', onClose, onSuccess }: SignInModalProps) {
  const [view, setView] = useState<View>(defaultView);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [showEmail, setShowEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const syntheticEmail = (u: string) => `${u.toLowerCase().trim()}@kinstellation.app`;

  async function handleSignIn() {
    if (!username.trim() || !password) return;
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({
      email: syntheticEmail(username),
      password,
    });
    setLoading(false);
    if (error) {
      setError('Username or password is incorrect.');
    } else {
      onSuccess?.();
      onClose();
    }
  }

  async function handleSignUp() {
    if (!username.trim() || !password) return;
    if (password !== confirmPassword) {
      setError('Passwords don\u2019t match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signUp({
      email: syntheticEmail(username),
      password,
    });
    setLoading(false);
    if (error) {
      if (error.message.includes('already registered') || error.message.includes('already been registered')) {
        setError('That username is taken. Try another.');
      } else {
        setError(error.message);
      }
    } else {
      onSuccess?.();
      onClose();
    }
  }

  async function handleGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/canvas` },
    });
    if (error) setError(error.message);
  }

  async function handleEmailLink() {
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/canvas` },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setEmailSent(true);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (view === 'signin') handleSignIn();
    else handleSignUp();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-sm mx-4 rounded-2xl border p-6 animate-fade-in"
        style={{
          background: 'rgba(10,5,20,0.92)',
          borderColor: 'rgba(139,92,246,0.2)',
          boxShadow: '0 8px 48px rgba(0,0,0,0.5), 0 0 60px rgba(88,28,135,0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* Title */}
        <div className="text-center mb-6">
          <div className="w-3 h-3 rounded-full bg-amber-400/60 mx-auto mb-3 animate-star-pulse" />
          <h2 className="text-white text-lg tracking-wide">
            {view === 'signin' ? 'Sign in' : 'Save your sky'}
          </h2>
          <p className="text-white/40 text-sm mt-1">
            {view === 'signin'
              ? 'Welcome back'
              : 'Create an account so your constellation is safe.'}
          </p>
        </div>

        {/* Username + password form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-white/50 text-xs tracking-widest uppercase">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              autoComplete={view === 'signin' ? 'username' : 'off'}
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-violet-400/40 text-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-white/50 text-xs tracking-widest uppercase">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={view === 'signin' ? 'Your password' : 'Create a password'}
              autoComplete={view === 'signin' ? 'current-password' : 'new-password'}
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-violet-400/40 text-sm"
            />
          </div>

          {view === 'signup' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-white/50 text-xs tracking-widest uppercase">
                Confirm password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Type it again"
                autoComplete="new-password"
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-violet-400/40 text-sm"
              />
            </div>
          )}

          {error && <p className="text-red-400/80 text-xs">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/20 text-amber-200 rounded-lg px-4 py-3 text-sm transition-colors disabled:opacity-40 mt-1"
          >
            {loading
              ? 'Working\u2026'
              : view === 'signin'
                ? 'Sign in'
                : 'Create account'}
          </button>
        </form>

        {/* Toggle sign-in / sign-up */}
        <p className="text-center text-xs mt-4 text-white/30">
          {view === 'signin' ? (
            <>
              Don&apos;t have an account?{' '}
              <button onClick={() => { setView('signup'); setError(''); }} className="text-amber-400/60 hover:text-amber-400/80 transition-colors">
                Create one
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button onClick={() => { setView('signin'); setError(''); }} className="text-amber-400/60 hover:text-amber-400/80 transition-colors">
                Sign in
              </button>
            </>
          )}
        </p>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/20 text-xs uppercase tracking-widest">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Google */}
        <button
          type="button"
          onClick={handleGoogle}
          className="flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-sm text-white/70 transition-colors w-full"
        >
          <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.0 24.0 0 0 0 0 21.56l7.98-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Continue with Google
        </button>

        {/* Email link */}
        {!showEmail ? (
          <button
            type="button"
            onClick={() => setShowEmail(true)}
            className="text-white/30 hover:text-white/50 text-xs text-center mt-3 transition-colors w-full"
          >
            Sign in with email link
          </button>
        ) : emailSent ? (
          <div className="text-center mt-3 animate-fade-in">
            <p className="text-white/50 text-xs">Check your email for a sign-in link.</p>
          </div>
        ) : (
          <div className="flex gap-2 mt-3 animate-fade-in">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/20 focus:outline-none focus:border-violet-400/40 text-xs"
            />
            <button
              type="button"
              onClick={handleEmailLink}
              disabled={loading}
              className="bg-violet-500/20 hover:bg-violet-500/30 border border-violet-400/20 text-violet-200 rounded-lg px-3 py-2 text-xs transition-colors disabled:opacity-40"
            >
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
