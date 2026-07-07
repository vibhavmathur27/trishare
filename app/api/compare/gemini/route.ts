import { NextRequest, NextResponse } from 'next/server';
import { buildFitPrompt } from '@/lib/compare';

export const dynamic = 'force-dynamic';

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

export async function POST(req: NextRequest) {
  const { jobDescription, profile, question, taskType, instructions } = await req.json();
  const key = process.env.GEMINI_API_KEY;
  if (!key) return NextResponse.json({ source: 'Gemini', error: 'No GEMINI_API_KEY set' });

  const prompt = buildFitPrompt(jobDescription, profile, question, taskType, instructions);
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ source: 'Gemini', error: data.error?.message || `HTTP ${res.status}` });
    const text = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('\n') || '';
    return NextResponse.json({ source: 'Gemini', text });
  } catch (e: any) {
    return NextResponse.json({ source: 'Gemini', error: e.message });
  }
}
