'use client';

import { useEffect, useState } from 'react';

type EmailRow = {
  id: string; name: string; company: string; role: string; email: string;
  subject: string; dateSent: string; status: string; resendCount: number; notes: string;
};

function todayStr() { return new Date().toISOString().slice(0, 10); }
function daysSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

export default function EmailsTab() {
  const [rows, setRows] = useState<EmailRow[]>([]);
  const [form, setForm] = useState({ name: '', company: '', role: '', email: '', subject: '', dateSent: todayStr(), notes: '' });
  const [draft, setDraft] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch('/api/emails');
    setRows(await res.json());
  }
  useEffect(() => { load(); }, []);

  async function generateDraft() {
    if (!form.subject.trim() || !form.notes.trim()) {
      setMsg('Add a short subject and a few notes to guide the draft.');
      return;
    }
    setLoading(true);
    setMsg('Drafting a stronger outreach email...');
    const res = await fetch('/api/compare/claude', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jobDescription: form.notes, profile: `${form.name} at ${form.company || 'target company'}`, taskType: 'email', instructions: `Write an email to ${form.email}. Keep it concise, polished, and tailored to ${form.role || 'the role'}. Use the subject: ${form.subject}` })
    });
    const data = await res.json();
    setDraft(data.text || '');
    setLoading(false);
    setMsg('Draft ready.');
  }

  async function addEmail() {
    if (!form.name || !form.email) { setMsg('Name and email are required.'); return; }
    await fetch('/api/emails', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...form, draft }) });
    setForm({ name: '', company: '', role: '', email: '', subject: '', dateSent: todayStr(), notes: '' });
    setDraft('');
    setMsg('Logged.');
    load();
  }

  async function markReplied(id: string) {
    await fetch(`/api/emails/${id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status: 'replied' }) });
    load();
  }
  async function resend(id: string) {
    await fetch(`/api/emails/${id}/resend`, { method: 'POST' });
    load();
  }
  async function remove(id: string) {
    await fetch(`/api/emails/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div>
      <h2 className="font-display" style={{ fontSize: 22, fontWeight: 600, margin: '0 0 4px' }}>Email command center</h2>
      <p style={{ color: 'var(--slate)', fontSize: 13.5, margin: '0 0 22px' }}>
        Log every outreach, keep a record of what was sent, and set reminder cues for follow-up after a few days.
      </p>

      <div className="form-card" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #fcfaf4 100%)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div><label>Name</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div><label>Company</label><input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></div>
          <div><label>Role</label><input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div><label>Email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          <div><label>Subject</label><input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} /></div>
          <div><label>Date sent</label><input type="date" value={form.dateSent} onChange={e => setForm({ ...form, dateSent: e.target.value })} /></div>
        </div>
        <div style={{ marginBottom: 14 }}><label>Notes / context</label><input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Add the reason for the email or your key points" /></div>
        <div style={{ marginBottom: 14 }}><label>Suggested draft</label><textarea rows={5} value={draft} onChange={e => setDraft(e.target.value)} placeholder="Use AI to generate a polished draft, then edit it before you send." /></div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="btn-primary" onClick={generateDraft} disabled={loading}>Make best draft</button>
          <button className="btn-primary" onClick={addEmail}>Log email</button>
          <span style={{ fontSize: 12.5, color: 'var(--slate)', fontStyle: 'italic' }}>{msg}</span>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="empty-state">No emails logged yet.</div>
      ) : (
        <table>
          <thead><tr><th>Person</th><th>Company / Role</th><th>Email</th><th>Sent</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {rows.map(r => {
              const d = daysSince(r.dateSent);
              const reminderState = d >= 3 ? 'badge-warn' : 'badge-neutral';
              return (
                <tr key={r.id}>
                  <td>{r.name}<br /><span style={{ color: 'var(--slate)', fontSize: 12 }}>{r.subject || '—'}</span></td>
                  <td>{r.company}{r.role ? ` — ${r.role}` : ''}</td>
                  <td>{r.email}</td>
                  <td>{r.dateSent.slice(0, 10)}{r.resendCount > 0 && <span className="badge badge-neutral" style={{ marginLeft: 6 }}>resent x{r.resendCount}</span>}</td>
                  <td>
                    {r.status === 'replied'
                      ? <span className="badge badge-ok">Replied</span>
                      : d >= 3 ? <span className={`badge ${reminderState}`}>Reminder soon</span>
                      : <span className="badge badge-neutral">Sent · {d}d ago</span>}
                  </td>
                  <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button className="btn-ghost" onClick={() => markReplied(r.id)}>Mark replied</button>
                    <button className="btn-ghost" onClick={() => resend(r.id)}>Send reminder</button>
                    <button className="btn-ghost btn-danger" onClick={() => remove(r.id)}>Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
