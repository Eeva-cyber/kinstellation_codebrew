import { NextRequest, NextResponse } from 'next/server';

interface StoryInput {
  title: string;
  content: string;
  type: string;
  personName?: string;
}

/** Pull the first meaningful sentence (or first 120 chars) from a string. */
function firstSentence(text: string): string {
  const dot = text.search(/[.!?]/);
  if (dot > 20 && dot < 200) return text.slice(0, dot + 1).trim();
  return text.slice(0, 120).trim() + (text.length > 120 ? '…' : '');
}

/** Build a readable extractive summary with no API call. */
function extractiveSummary(personName: string, stories: StoryInput[]): string {
  const textStories = stories.filter((s) => s.type === 'text' && s.content.trim());
  if (textStories.length === 0) {
    return `${personName} has shared ${stories.length} stor${stories.length === 1 ? 'y' : 'ies'} (photos or audio recordings).`;
  }
  const count = stories.length;
  const intro = `Across ${count === 1 ? 'this story' : `these ${count} stories`}, `;
  const names = [...new Set(stories.map((s) => s.personName).filter(Boolean))];
  const who = names.length > 1 ? names.join(', ') : personName;
  const snippets = textStories.slice(0, 3).map((s) => firstSentence(s.content));
  return intro + `${who} speaks of ${textStories[0].title.toLowerCase()}. ` + snippets.slice(1).join(' ');
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  let personName = '';
  let stories: StoryInput[] = [];
  try {
    const body = await req.json();
    personName = body.personName ?? 'this community';
    stories = body.stories ?? [];
  } catch {
    return NextResponse.json({ summary: 'Unable to summarise stories at this time.' }, { status: 200 });
  }

  if (stories.length === 0) {
    return NextResponse.json({ summary: 'No stories to summarise.' }, { status: 200 });
  }

  if (!apiKey) {
    return NextResponse.json({ summary: extractiveSummary(personName, stories) }, { status: 200 });
  }

  const textStories = stories.filter((s) => s.type === 'text' && s.content);
  if (!textStories.length) {
    return NextResponse.json({ summary: extractiveSummary(personName, stories) }, { status: 200 });
  }

  const names = [...new Set(stories.map((s) => s.personName).filter(Boolean))];
  const whoLabel = names.length > 1 ? names.join(', ') : personName;

  const storyBlock = textStories
    .map((s, i) => `Story ${i + 1}${s.personName ? ` (${s.personName})` : ''} — "${s.title}":\n${s.content}`)
    .join('\n\n');

  const prompt = `You are helping present Aboriginal and Torres Strait Islander oral histories to the public in a respectful, accessible way.

Below are oral history stories shared by ${whoLabel}. Write a single paragraph of 2–3 sentences that captures the essence of these stories for someone encountering them for the first time. Use plain English and a warm, grounded tone. Treat the stories with deep respect. Do not interpret, romanticise, or judge — simply reflect what is present in the voices of the storytellers.

${storyBlock.slice(0, 3500)}

Respond with only the paragraph — no preamble, no labels, no quotation marks.`;

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 320,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!resp.ok) {
      return NextResponse.json({ summary: extractiveSummary(personName, stories) }, { status: 200 });
    }

    const data = await resp.json();
    const summary: string = data?.content?.[0]?.text?.trim() ?? extractiveSummary(personName, stories);
    return NextResponse.json({ summary });
  } catch {
    return NextResponse.json({ summary: extractiveSummary(personName, stories) }, { status: 200 });
  }
}
