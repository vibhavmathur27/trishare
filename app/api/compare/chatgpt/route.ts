import { NextRequest, NextResponse } from 'next/server';
import { buildFitPrompt } from '@/lib/compare';

export const dynamic = 'force-dynamic';

const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1';

export async function POST(req: NextRequest) {
  const { jobDescription, profile, question } = await req.json();
  const key = process.env.OPENAI_API_KEY;
  if (!key) return NextResponse.json({ source: 'ChatGPT', error: 'No OPENAI_API_KEY set' });

  const prompt = buildFitPrompt(jobDescription, profile, question);
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: OPENAI_MODEL, max_tokens: 600, messages: [{ role: 'user', content: prompt }] })
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ source: 'ChatGPT', error: data.error?.message || `HTTP ${res.status}` });
    const text = data.choices?.[0]?.message?.content || '';
    return NextResponse.json({ source: 'ChatGPT', text });
  } catch (e: any) {
    return NextResponse.json({ source: 'ChatGPT', error: e.message });
  }
}
