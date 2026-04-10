'use client';

import { useState } from 'react';
import { useApp } from '@/lib/store/AppContext';
import { SeasonPicker } from '@/components/ui/SeasonPicker';
import type { Person, Story, StoryType, Visibility } from '@/lib/types';

interface StoryPanelProps {
  person: Person;
  onClose: () => void;
}

export function StoryPanel({ person, onClose }: StoryPanelProps) {
  const { dispatch } = useApp();

  const [title, setTitle] = useState('');
  const [storyType, setStoryType] = useState<StoryType>('text');
  const [content, setContent] = useState('');
  const [seasonTag, setSeasonTag] = useState('unsure');
  const [seasonalContext, setSeasonalContext] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('family');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setContent(result);
      setPhotoPreview(result);
    };
    reader.readAsDataURL(file);
  }

  function handleSave() {
    if (!title.trim()) return;
    if (storyType === 'text' && !content.trim()) return;
    if (storyType === 'photo' && !content) return;

    const story: Story = {
      id: crypto.randomUUID(),
      title: title.trim(),
      type: storyType,
      content,
      recordedBy: '',
      recordedDate: new Date().toISOString(),
      seasonTag,
      seasonalContext: seasonalContext.trim() || undefined,
      visibility,
      linkedPersonIds: [person.id],
    };

    dispatch({ type: 'ADD_STORY', payload: { personId: person.id, story } });
    onClose();
  }

  const INPUT_CLS = "w-full rounded-lg px-3 py-2.5 text-sm placeholder:text-white/20 focus:outline-none transition-colors";
  const INPUT_STYLE = { background: 'rgba(88,28,135,0.14)', border: '1px solid rgba(139,92,246,0.2)', color: 'rgba(255,255,255,0.82)' };
  const LABEL_STYLE = { color: 'rgba(212,164,84,0.65)' };

  return (
    <div className="absolute top-0 right-0 h-full w-[22rem] z-30 animate-slide-right select-auto">
      <div
        className="h-full backdrop-blur-xl panel-scroll"
        style={{ background: 'rgba(8,4,22,0.97)', borderLeft: '1px solid rgba(88,28,135,0.4)' }}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-medium tracking-wide" style={{ color: 'rgba(212,164,84,0.9)' }}>
                New story
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(139,92,246,0.6)' }}>for {person.displayName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-lg leading-none transition-colors"
              style={{ color: 'rgba(255,255,255,0.3)' }}
              aria-label="Close"
            >
              &times;
            </button>
          </div>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs mb-1.5" style={LABEL_STYLE}>Story title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give this story a name"
                className={INPUT_CLS}
                style={INPUT_STYLE}
              />
            </div>

            {/* Type selector */}
            <div>
              <label className="block text-xs mb-1.5" style={LABEL_STYLE}>Type</label>
              <div className="flex gap-2">
                {(['text', 'photo'] as StoryType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setStoryType(t); setContent(''); setPhotoPreview(null); }}
                    className="flex-1 px-3 py-2 rounded-lg text-xs capitalize transition-all"
                    style={storyType === t ? {
                      background: 'rgba(88,28,135,0.55)',
                      border: '1px solid rgba(212,164,84,0.35)',
                      color: 'rgba(212,164,84,0.9)',
                    } : {
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(139,92,246,0.15)',
                      color: 'rgba(255,255,255,0.38)',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            {storyType === 'text' ? (
              <div>
                <label className="block text-xs mb-1.5" style={LABEL_STYLE}>Story</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                  placeholder="Tell the story..."
                  rows={6}
                  className="w-full rounded-lg px-3 py-2.5 text-sm placeholder:text-white/20 focus:outline-none resize-none"
                  style={INPUT_STYLE}
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs mb-1.5" style={LABEL_STYLE}>Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="w-full text-xs text-white/40 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:cursor-pointer"
                  style={{ '--file-bg': 'rgba(88,28,135,0.3)' } as React.CSSProperties}
                />
                {photoPreview && (
                  <img src={photoPreview} alt="Preview" className="mt-2 rounded-lg max-h-32 object-cover w-full" />
                )}
              </div>
            )}

            {/* Season picker */}
            <SeasonPicker value={seasonTag} onChange={setSeasonTag} />

            {/* Seasonal context */}
            <div>
              <label className="block text-xs mb-1.5" style={LABEL_STYLE}>
                What was happening on Country? (optional)
              </label>
              <input
                type="text"
                value={seasonalContext}
                onChange={(e) => setSeasonalContext(e.target.value)}
                placeholder="e.g. the wattle was flowering, emus were sitting on eggs"
                className={INPUT_CLS}
                style={INPUT_STYLE}
              />
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-xs mb-1.5" style={LABEL_STYLE}>Who can see this?</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as Visibility)}
                className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                style={INPUT_STYLE}
              >
                <option value="public">Public</option>
                <option value="family">Family only</option>
                <option value="restricted">Restricted</option>
                <option value="gendered">Gendered (men&apos;s/women&apos;s business)</option>
              </select>
            </div>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={!title.trim() || (storyType === 'text' && !content.trim()) || (storyType === 'photo' && !content)}
              className="w-full py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: 'rgba(88,28,135,0.65)',
                border: '1px solid rgba(212,164,84,0.35)',
                color: 'rgba(212,164,84,0.95)',
              }}
            >
              Save story
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
