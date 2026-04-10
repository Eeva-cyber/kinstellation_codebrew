import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ impactScore: 5, reason: 'API key not configured' }, { status: 200 });
  }

  let title = '';
  let content = '';
  try {
    const body = await req.json();
    title = body.title ?? '';
    content = body.content ?? '';
  } catch {
    return NextResponse.json({ impactScore: 5 }, { status: 200 });
  }

  const prompt = `You are helping analyse Aboriginal and Torres Strait Islander oral history stories for cultural and emotional significance. Rate the impact of this story on a scale of 1–10.

Consider: ceremonial significance, connection to Country, ancestral knowledge, community and cultural identity, language preservation, historical trauma (Stolen Generations, dispossession), intergenerational healing, Dreaming connections, and elder knowledge.

Story title: ${title}
Story content: ${content.slice(0, 600)}

Respond with ONLY valid JSON, no other text: {"score": <integer 1-10>, "reason": "<one sentence>"}`;

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
        max_tokens: 120,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!resp.ok) {
      return NextResponse.json({ impactScore: 5 }, { status: 200 });
    }

    const data = await resp.json();
    const text: string = data?.content?.[0]?.text ?? '{"score":5}';
    const parsed = JSON.parse(text);
    const score = Math.max(1, Math.min(10, Number(parsed.score) || 5));
    return NextResponse.json({ impactScore: score, reason: parsed.reason ?? '' });
  } catch {
    return NextResponse.json({ impactScore: 5 }, { status: 200 });
  }
}
