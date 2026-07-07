'use client';

import { useMemo, useRef, useState } from 'react';

type Result = { source: string; text?: string; error?: string };

type Mode = 'compare' | 'email' | 'resume';

const MODE_OPTIONS: { id: Mode; label: string; helper: string }[] = [
  { id: 'compare', label: 'Fit check', helper: 'Use rules to judge how well you match the role.' },
  { id: 'email', label: 'Email draft', helper: 'Ask all three to draft the best outreach email.' },
  { id: 'resume', label: 'Resume draft', helper: 'Build the strongest resume version from all three suggestions.' }
];

export default function CompareTab() {
  const [mode, setMode] = useState<Mode>('compare');
  const [jd, setJd] = useState('');
  const [profile, setProfile] = useState('');
  const [question, setQuestion] = useState('');
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [results, setResults] = useState<Record<string, Result>>({});
  const [synthesis, setSynthesis] = useState('');
  const [selectedPoints, setSelectedPoints] = useState<string[]>([]);
  const [resumeFileName, setResumeFileName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const promptLabel = useMemo(() => {
    if (mode === 'email') return 'Rules for the email';
    if (mode === 'resume') return 'Rules for the resume';
    return 'Rules for the comparison';
  }, [mode]);

  async function extractResumeText(file: File | null) {
    if (!file) return '';
    const fd = new FormData();
    fd.append('resume', file);
    try {
      const res = await fetch('/api/compare/resume-text', { method: 'POST', body: fd });
      const data = await res.json();
      return data.text || '';
    } catch {
      return '';
    }
  }

  async function handleResumeUpload(file: File | null) {
    if (!file) return;
    setResumeFileName(file.name);
    setStatus(`Extracting text from ${file.name}...`);
    const text = await extractResumeText(file);
    if (text && text.trim()) {
      setProfile(text.slice(0, 12000));
      setStatus(`Loaded resume text from ${file.name}.`);
    } else {
      setProfile(`Resume file uploaded: ${file.name}`);
      setStatus(`Uploaded ${file.name}. You can still paste a summary if you want a richer comparison.`);
    }
  }

  function downloadDraft(format: 'doc' | 'pdf') {
    if (!synthesis) return;
    const content = mode === 'resume' && selectedPoints.length > 0 ? `${synthesis}\n\nSelected resume points:\n${selectedPoints.join('\n')}` : synthesis;
    const blob = format === 'pdf' ? new Blob([buildPdf(content)], { type: 'application/pdf' }) : new Blob([content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `best-${mode === 'resume' ? 'resume' : mode === 'email' ? 'email' : 'draft'}.${format}`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function buildPdf(text: string) {
    const escaped = text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    const lines = escaped.split('\n');
    const content = lines.map(line => `BT /F1 12 Tf 50 780 Td (${line}) Tj T* ET`).join('\n');
    return `%PDF-1.4\n1 0 obj<< /Type /Catalog /Pages 2 0 R>>endobj\n2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1>>endobj\n3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R>> >> >>endobj\n4 0 obj<< /Length 0 >>stream\n${content}\nendstream\nendobj\n5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\nxref\n0 6\n0000000000 65535 f \n0000000010 00000 n \n0000000062 00000 n \n0000000119 00000 n \n0000000207 00000 n \n0000000302 00000 n \ntrailer<< /Size 6 /Root 1 0 R>>\nstartxref\n0\n%%EOF`;
  }

  async function runCompare() {
    if (!jd.trim()) {
      setStatus('Please provide the job description.');
      return;
    }
    if (mode !== 'compare' && !instructions.trim()) {
      setStatus('Please add the rules you want the models to follow.');
      return;
    }
    setLoading(true);
    setStatus('Querying Claude, ChatGPT, and Gemini in parallel...');
    setSynthesis('');

    const selectedFile = fileRef.current?.files?.[0] || null;
    const extractedProfile = selectedFile ? await extractResumeText(selectedFile) : '';
    const effectiveProfile = (extractedProfile && extractedProfile.trim()) || profile.trim();
    const payload = { jobDescription: jd, profile: effectiveProfile, question, taskType: mode, instructions };
    try {
      const [claudeRes, chatgptRes, geminiRes] = await Promise.all([
        fetch('/api/compare/claude', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) }).then(r => r.json()),
        fetch('/api/compare/chatgpt', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) }).then(r => r.json()),
        fetch('/api/compare/gemini', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) }).then(r => r.json())
      ]);

      setResults({ claude: claudeRes, chatgpt: chatgptRes, gemini: geminiRes });
      setStatus(mode === 'compare' ? 'Synthesizing verdict...' : 'Synthesizing the best draft...');

      const synthRes = await fetch('/api/compare/synthesize', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ results: [claudeRes, chatgptRes, geminiRes], taskType: mode })
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
      <h2 className="font-display" style={{ fontSize: 22, fontWeight: 600, margin: '0 0 4px' }}>Three perspectives, one better draft</h2>
      <p style={{ color: 'var(--slate)', fontSize: 13.5, margin: '0 0 22px' }}>
        Upload your résumé, define the exact rules, and let Claude, ChatGPT, and Gemini each produce an answer before a synthesized best version is returned.
      </p>

      <div className="form-card" style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
          {MODE_OPTIONS.map(option => (
            <button key={option.id} className={mode === option.id ? 'btn-primary' : 'btn-ghost'} onClick={() => setMode(option.id)}>
              {option.label}
            </button>
          ))}
        </div>
        <div style={{ color: 'var(--slate)', fontSize: 12.5 }}>{MODE_OPTIONS.find(o => o.id === mode)?.helper}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
        <div>
          <label>Job description</label>
          <textarea rows={9} value={jd} onChange={e => setJd(e.target.value)} placeholder="Paste the full job posting here..." />
        </div>
        <div>
          <label>Your background / resume text</label>
          <textarea rows={9} value={profile} onChange={e => setProfile(e.target.value)} placeholder="Paste your resume text, summary, or notes..." />
          <div style={{ marginTop: 10 }}>
            <label>Upload resume (PDF / DOC / DOCX)</label>
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" onChange={e => handleResumeUpload(e.target.files?.[0] || null)} />
            {resumeFileName && <div style={{ marginTop: 6, fontSize: 12.5, color: 'var(--slate)' }}>Selected: {resumeFileName}</div>}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <label>{promptLabel}</label>
        <textarea rows={5} value={instructions} onChange={e => setInstructions(e.target.value)} placeholder={mode === 'email' ? 'Example: Write a concise outreach email, sound confident, include a clear subject line, and mention the role and why I fit.' : mode === 'resume' ? 'Example: Tailor the resume summary to this role, emphasize leadership and execution, and keep bullets measurable.' : 'Example: Tell me whether I am a strong fit and highlight the exact strengths and gaps to address before applying.'} />
      </div>

      {mode === 'compare' && (
        <div style={{ marginTop: 14 }}>
          <label>Specific question (optional)</label>
          <input type="text" value={question} onChange={e => setQuestion(e.target.value)} placeholder="Example: Is my back-office experience a dealbreaker for this front-office role?" />
        </div>
      )}

      <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <button className="btn-primary" onClick={runCompare} disabled={loading}>{mode === 'compare' ? 'Compare all 3' : mode === 'email' ? 'Generate the best email' : 'Generate the best resume'}</button>
        <span style={{ fontSize: 12.5, color: 'var(--slate)', fontStyle: 'italic' }}>{status}</span>
      </div>

      {synthesis && (
        <div style={{ marginTop: 32, background: 'var(--navy-deep)', color: 'var(--cream)', borderRadius: 4, padding: '24px 28px' }}>
          <div className="font-mono" style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold-soft)', marginBottom: 10, borderBottom: '1px solid rgba(228,206,153,0.25)', paddingBottom: 10 }}>
            Best draft from all 3
          </div>
          <div className="font-display" style={{ fontSize: 16.5, lineHeight: 1.6, whiteSpace: 'pre-wrap', color: 'var(--cream)' }}>{synthesis}</div>
          {mode === 'resume' && (
            <div style={{ marginTop: 16 }}>
              <div className="font-mono" style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold-soft)', marginBottom: 8 }}>Pick points for the final resume</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {synthesis.split('\n').filter(Boolean).slice(0, 8).map((point, index) => {
                  const value = point.replace(/^[-*]\s*/, '').trim();
                  if (!value) return null;
                  return (
                    <label key={`${value}-${index}`} style={{ background: 'rgba(255,255,255,0.1)', padding: '8px 10px', borderRadius: 999, cursor: 'pointer', fontSize: 12.5 }}>
                      <input type="checkbox" checked={selectedPoints.includes(value)} onChange={() => setSelectedPoints(prev => prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value])} style={{ marginRight: 6 }} />
                      {value}
                    </label>
                  );
                })}
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
            <button className="btn-ghost" onClick={() => downloadDraft('doc')}>Download .doc</button>
            <button className="btn-ghost" onClick={() => downloadDraft('pdf')}>Download .pdf</button>
          </div>
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
