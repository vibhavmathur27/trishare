import { NextRequest, NextResponse } from 'next/server';
import { buildFitPrompt } from '@/lib/compare';

export const dynamic = 'force-dynamic';

const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-5';

export async function POST(req: NextRequest) {
  const { jobDescription, profile, question, taskType, instructions } = await req.json();
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ source: 'Claude', error: 'No ANTHROPIC_API_KEY set' });

  const prompt = buildFitPrompt(jobDescription, profile, question, taskType, instructions);
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: CLAUDE_MODEL, max_tokens: 600, messages: [{ role: 'user', content: prompt }] })
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ source: 'Claude', error: data.error?.message || `HTTP ${res.status}` });
    const text = (data.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n');
    return NextResponse.json({ source: 'Claude', text });
  } catch (e: any) {
    return NextResponse.json({ source: 'Claude', error: e.message });
  }
}
