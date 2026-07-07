import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-5';

export async function POST(req: NextRequest) {
  const { results, taskType } = await req.json();
  const key = process.env.ANTHROPIC_API_KEY;

  const validResults = (results || []).filter((r: any) => r.text);
  if (!key || validResults.length === 0) {
    return NextResponse.json({
      synthesis: 'No synthesis available — none of the three models returned a usable response, or ANTHROPIC_API_KEY is missing.'
    });
  }

  const combined = validResults.map((r: any) => `--- ${r.source} ---\n${r.text}`).join('\n\n');
  const prompt = taskType === 'email'
    ? `Three different AI models each drafted an outreach email. Here are their responses:

${combined}

Synthesize them into one polished final email. Keep the best subject line and body from the three drafts, remove repetition, and make it sound confident, concise, and professional. Return the output with a clear Subject: line and body.`
    : taskType === 'resume'
      ? `Three different AI models each drafted a résumé summary and bullet points for the same role. Here are their responses:

${combined}

Synthesize them into one polished résumé draft. Keep the strongest summary and the best bullet points, and make it feel tailored to the target role. Return a concise summary plus a short list of high-impact bullet points.`
      : `Three different AI models were each independently asked to assess a candidate's fit for a job. Here are their three independent responses:

${combined}

Synthesize these into a single, clear verdict for the candidate. Note where the three models agreed (that's the highest-confidence signal), where they disagreed, and give one concrete recommendation: apply as-is, apply with a specific framing change, or skip and why. Keep it under 250 words.`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: CLAUDE_MODEL, max_tokens: 500, messages: [{ role: 'user', content: prompt }] })
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ synthesis: `Synthesis failed: ${data.error?.message || res.status}` });
    const text = (data.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n');
    return NextResponse.json({ synthesis: text });
  } catch (e: any) {
    return NextResponse.json({ synthesis: `Synthesis failed: ${e.message}` });
  }
}
