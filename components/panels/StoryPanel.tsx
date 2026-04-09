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

  return (
    <div className="absolute top-0 right-0 h-full w-80 z-30 animate-slide-right">
      <div className="h-full bg-[var(--panel-bg)] border-l border-[var(--panel-border)] backdrop-blur-xl overflow-y-auto">
        <div className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-medium text-white/70 tracking-wide">
              Add story for {person.displayName}
            </h2>
            <button
              onClick={onClose}
              className="text-white/30 hover:text-white/60 transition-colors text-lg leading-none"
              aria-label="Close"
            >
              &times;
            </button>
          </div>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs text-white/30 mb-1">Story title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give this story a name"
                className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/70 placeholder:text-white/15 focus:outline-none focus:border-white/[0.15]"
              />
            </div>

            {/* Type selector */}
            <div>
              <label className="block text-xs text-white/30 mb-1">Type</label>
              <div className="flex gap-2">
                {(['text', 'photo'] as StoryType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setStoryType(t);
                      setContent('');
                      setPhotoPreview(null);
                    }}
                    className={`flex-1 px-3 py-2 rounded-lg border text-xs capitalize transition-all ${
                      storyType === t
                        ? 'border-white/20 bg-white/[0.08] text-white/80'
                        : 'border-white/[0.04] bg-white/[0.02] text-white/40 hover:bg-white/[0.04]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            {storyType === 'text' ? (
              <div>
                <label className="block text-xs text-white/30 mb-1">Story</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Tell the story..."
                  rows={6}
                  className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/70 placeholder:text-white/15 focus:outline-none focus:border-white/[0.15] resize-none"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs text-white/30 mb-1">Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="w-full text-xs text-white/40 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-white/[0.06] file:bg-white/[0.04] file:text-white/50 file:text-xs file:cursor-pointer"
                />
                {photoPreview && (
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="mt-2 rounded-lg max-h-32 object-cover w-full"
                  />
                )}
              </div>
            )}

            {/* Season picker */}
            <SeasonPicker value={seasonTag} onChange={setSeasonTag} />

            {/* Seasonal context */}
            <div>
              <label className="block text-xs text-white/30 mb-1">
                What was happening on Country? (optional)
              </label>
              <input
                type="text"
                value={seasonalContext}
                onChange={(e) => setSeasonalContext(e.target.value)}
                placeholder="e.g. the wattle was flowering, emus were sitting on eggs"
                className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/70 placeholder:text-white/15 focus:outline-none focus:border-white/[0.15]"
              />
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-xs text-white/30 mb-1">Who can see this?</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as Visibility)}
                className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:border-white/[0.15]"
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
              className="w-full py-2.5 rounded-lg bg-white/[0.08] border border-white/[0.1]
                text-white/70 text-sm hover:bg-white/[0.12] transition-all
                disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Save story
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
