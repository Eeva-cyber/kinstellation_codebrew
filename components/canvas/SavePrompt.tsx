'use client';

import { useState } from 'react';
import { useApp } from '@/lib/store/AppContext';
import { SignInModal } from '@/components/auth/SignInModal';

/** Inline toolbar button — only renders for unauthenticated users who have added data. */
export function SavePrompt({ tutorialHighlight }: { tutorialHighlight?: boolean }) {
  const { user, state } = useApp();
  const [showModal, setShowModal] = useState(false);

  const hasSelfPerson = state.persons.length > 0;
  if (user || !hasSelfPerson) return null;

  return (
    <>
      <div className={`flex items-center gap-3 group/save${tutorialHighlight ? ' z-[61] relative' : ''}`}>
        <span
          className="text-xs opacity-0 group-hover/save:opacity-100 transition-all duration-200 tracking-wide font-light"
          style={{ color: 'rgba(255,255,255,0.5)' }}
        >
          Save progress
        </span>
        <button
          onClick={() => setShowModal(true)}
          className={`w-14 h-14 rounded-2xl backdrop-blur-sm transition-all duration-200 flex items-center justify-center group shadow-lg${tutorialHighlight ? ' animate-tutorial-box-glow' : ''}`}
          style={{
            background: 'rgba(88,28,135,0.55)',
            border: '1px solid rgba(212,164,84,0.2)',
            boxShadow: '0 4px 24px rgba(88,28,135,0.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(109,40,217,0.7)';
            e.currentTarget.style.transform = 'scale(1.06)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(88,28,135,0.55)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          aria-label="Save progress"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-amber-200/80 group-hover:text-amber-100 transition-colors">
            <path d="M10 3v10M7 10l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 14v2a1 1 0 001 1h12a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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
