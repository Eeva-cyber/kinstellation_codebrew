'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { RelationshipType } from '@/lib/types';

interface Invitation {
  inviter_display_name: string;
  status: string;
  expires_at: string;
}

const RELATIONSHIP_OPTIONS: { value: RelationshipType; label: string }[] = [
  { value: 'mother', label: 'Mother' },
  { value: 'father', label: 'Father' },
  { value: 'child', label: 'Child' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'classificatory_mother', label: 'Classificatory Mother' },
  { value: 'classificatory_father', label: 'Classificatory Father' },
  { value: 'classificatory_sibling', label: 'Classificatory Sibling' },
  { value: 'country_connection', label: 'Country Connection' },
  { value: 'totemic', label: 'Totemic' },
  { value: 'kupai_omasker', label: 'Kupai Omasker' },
];

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedType, setSelectedType] = useState<RelationshipType | ''>('');
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);

  // Check auth + fetch invitation
  useEffect(() => {
    async function init() {
      const [
        { data: { user: u } },
        { data: inv },
      ] = await Promise.all([
        supabase.auth.getUser(),
        supabase
          .from('invitations')
          .select('inviter_display_name, status, expires_at')
          .eq('token', token)
          .single(),
      ]);

      setUser(u);

      if (!inv) {
        setError('This invitation link is invalid or has been removed.');
      } else if (inv.status === 'accepted') {
        setAccepted(true);
        setInvitation(inv);
      } else if (new Date(inv.expires_at) < new Date()) {
        setError('This invitation has expired.');
      } else {
        setInvitation(inv);
      }

      setLoading(false);
    }
    init();
  }, [token]);

  async function handleAccept() {
    if (!selectedType) return;
    setAccepting(true);
    setError('');

    const res = await fetch('/api/invite/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, relationshipType: selectedType }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Something went wrong.');
      setAccepting(false);
      return;
    }

    setAccepted(true);
    setAccepting(false);
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="w-3 h-3 rounded-full bg-amber-400/40 animate-star-pulse" />
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <p className="text-white/60 text-sm">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-6 text-amber-400/60 hover:text-amber-400/80 text-xs transition-colors"
          >
            Go home
          </button>
        </div>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <div className="w-4 h-4 rounded-full bg-amber-400/60 mx-auto mb-4 animate-star-pulse" />
          <h2 className="text-white text-lg mb-2">Connected!</h2>
          <p className="text-white/50 text-sm mb-6">
            You and {invitation?.inviter_display_name} are now linked in each
            other&apos;s constellations.
          </p>
          <button
            onClick={() => router.push('/canvas')}
            className="bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/20 text-amber-200 rounded-lg px-6 py-3 text-sm transition-colors"
          >
            Open your sky
          </button>
        </div>
      </div>
    );
  }

  // Not logged in — show invite info + login prompt
  if (!user) {
    return (
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <div className="w-3 h-3 rounded-full bg-amber-400/60 mx-auto mb-4 animate-star-pulse" />
          <h2 className="text-white text-lg mb-2">
            {invitation?.inviter_display_name} has invited you
          </h2>
          <p className="text-white/50 text-sm mb-6">
            to join their constellation on Kinstellation. Sign in to accept and
            connect your stars.
          </p>
          <button
            onClick={() =>
              router.push(`/login?next=${encodeURIComponent(`/invite/${token}`)}`)
            }
            className="bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/20 text-amber-200 rounded-lg px-6 py-3 text-sm transition-colors"
          >
            Sign in to accept
          </button>
        </div>
      </div>
    );
  }

  // Logged in — show relationship selector
  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="text-center">
          <div className="w-3 h-3 rounded-full bg-amber-400/60 mx-auto mb-4 animate-star-pulse" />
          <h2 className="text-white text-lg mb-1">
            Connect with {invitation?.inviter_display_name}
          </h2>
          <p className="text-white/40 text-sm">
            How are you related?
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {RELATIONSHIP_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSelectedType(opt.value)}
              className={`text-left px-4 py-2.5 rounded-lg text-sm transition-colors border ${
                selectedType === opt.value
                  ? 'bg-amber-500/20 border-amber-400/30 text-amber-200'
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {error && <p className="text-red-400/80 text-xs text-center">{error}</p>}

        <button
          onClick={handleAccept}
          disabled={!selectedType || accepting}
          className="bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/20 text-amber-200 rounded-lg px-4 py-3 text-sm transition-colors disabled:opacity-40"
        >
          {accepting ? 'Connecting stars\u2026' : 'Accept invitation'}
        </button>
      </div>
    </div>
  );
}
