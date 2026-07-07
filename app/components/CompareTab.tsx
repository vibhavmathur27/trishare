'use client';

import { useState } from 'react';

type Result = { source: string; text?: string; error?: string };

export default function CompareTab() {
  const [jd, setJd] = useState('');
  const [profile, setProfile] = useState('');
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [results, setResults] = useState<Record<string, Result>>({});
  const [synthesis, setSynthesis] = useState('');

  async function runCompare() {
    if (!jd.trim() || !profile.trim()) {
      setStatus('Please fill in both fields.');
      return;
    }
    setLoading(true);
    setStatus('Querying Claude, ChatGPT, and Gemini in parallel...');
    setSynthesis('');

    const payload = { jobDescription: jd, profile, question };
    try {
      const [claudeRes, chatgptRes, geminiRes] = await Promise.all([
        fetch('/api/compare/claude', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) }).then(r => r.json()),
        fetch('/api/compare/chatgpt', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) }).then(r => r.json()),
        fetch('/api/compare/gemini', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) }).then(r => r.json())
      ]);

      setResults({ claude: claudeRes, chatgpt: chatgptRes, gemini: geminiRes });
      setStatus('Synthesizing verdict...');

      const synthRes = await fetch('/api/compare/synthesize', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ results: [claudeRes, chatgptRes, geminiRes] })
      }).then(r => r.json());

      setSynthesis(synthRes.synthesis || '');
      setStatus('Done.');
    } catch (e: any) {
      setStatus('Request failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="font-display" style={{ fontSize: 22, fontWeight: 600, margin: '0 0 4px' }}>Three reads, one verdict</h2>
      <p style={{ color: 'var(--slate)', fontSize: 13.5, margin: '0 0 22px' }}>
        Claude, ChatGPT, and Gemini each assess independently — then Claude synthesizes a single recommendation.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
        <div>
          <label>Job description</label>
          <textarea rows={9} value={jd} onChange={e => setJd(e.target.value)} placeholder="Paste the full job posting here..." />
        </div>
        <div>
          <label>Your background / resume summary</label>
          <textarea rows={9} value={profile} onChange={e => setProfile(e.target.value)} placeholder="Paste your resume text or a summary..." />
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <label>Specific question (optional)</label>
        <input type="text" value={question} onChange={e => setQuestion(e.target.value)} placeholder="e.g. Is my back-office experience a dealbreaker for this front-office RM role?" />
      </div>

      <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
        <button className="btn-primary" onClick={runCompare} disabled={loading}>Compare all 3</button>
        <span style={{ fontSize: 12.5, color: 'var(--slate)', fontStyle: 'italic' }}>{status}</span>
      </div>

      {synthesis && (
        <div style={{ marginTop: 32, background: 'var(--navy-deep)', color: 'var(--cream)', borderRadius: 4, padding: '24px 28px' }}>
          <div className="font-mono" style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold-soft)', marginBottom: 10, borderBottom: '1px solid rgba(228,206,153,0.25)', paddingBottom: 10 }}>
            Synthesized verdict
          </div>
          <div className="font-display" style={{ fontSize: 16.5, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{synthesis}</div>
        </div>
      )}

      {Object.keys(results).length > 0 && (
        <div style={{ marginTop: 26, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {['claude', 'chatgpt', 'gemini'].map(key => {
            const r = results[key];
            if (!r) return null;
            return (
              <div key={key} style={{ background: '#fff', border: '1px solid var(--line)', borderTop: `3px solid ${r.error ? 'var(--err)' : 'var(--navy)'}`, borderRadius: 3, padding: '18px 20px' }}>
                <div className="font-mono" style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--navy)', marginBottom: 10 }}>
                  {r.source}
                </div>
                <div style={{ fontSize: 13.5, lineHeight: 1.6, whiteSpace: 'pre-wrap', color: r.error ? 'var(--err)' : 'var(--ink)' }}>
                  {r.error ? 'Error: ' + r.error : r.text || '(empty response)'}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
