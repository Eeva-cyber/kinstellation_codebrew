'use client';

import { useState } from 'react';
import { useApp } from '@/lib/store/AppContext';
import { SignInModal } from '@/components/auth/SignInModal';

export function SavePrompt() {
  const { user, state } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Only show if: unauthenticated, has at least one person, not dismissed
  const hasSelfPerson = state.persons.length > 0;
  if (user || !hasSelfPerson || dismissed) return null;

  return (
    <>
      <div className="fixed bottom-6 left-6 z-30 animate-fade-in">
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm transition-all duration-200"
          style={{
            background: 'rgba(88,28,135,0.4)',
            border: '1px solid rgba(212,164,84,0.2)',
            color: 'rgba(212,164,84,0.75)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(88,28,135,0.6)';
            e.currentTarget.style.color = 'rgba(212,164,84,1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(88,28,135,0.4)';
            e.currentTarget.style.color = 'rgba(212,164,84,0.75)';
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v8M4 6l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M1 10v2a1 1 0 001 1h10a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          Save your progress
        </button>
        {/* Dismiss X */}
        <button
          onClick={() => setDismissed(true)}
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center transition-colors"
          style={{ background: 'rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.3)' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; }}
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1 1l6 6M7 1L1 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {showModal && (
        <SignInModal
          defaultView="signup"
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
