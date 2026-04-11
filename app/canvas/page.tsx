'use client';

import { useState, useEffect } from 'react';
import { SkyCanvas } from '@/components/canvas/SkyCanvas';
import { OnboardOverlay } from '@/components/canvas/OnboardOverlay';
import { SavePrompt } from '@/components/canvas/SavePrompt';

export default function CanvasPage() {
  const [needsOnboard, setNeedsOnboard] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const selfId = localStorage.getItem('kinstellation_self_id');
    setNeedsOnboard(!selfId);
    setChecked(true);
  }, []);

  if (!checked) return null;

  return (
    <>
      <SkyCanvas />
      {needsOnboard && (
        <OnboardOverlay onComplete={() => setNeedsOnboard(false)} />
      )}
      <SavePrompt />
    </>
  );
}
