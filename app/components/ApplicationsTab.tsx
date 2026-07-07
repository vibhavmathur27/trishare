'use client';

import { useEffect, useRef, useState } from 'react';

type ResumeVersion = { id: string; originalName: string; blobUrl: string; uploadedAt: string };
type AppRow = {
  id: string; company: string; role: string; source: string; dateApplied: string;
  jobDescription: string; status: string; notes: string; resumeVersions: ResumeVersion[];
};

function todayStr() { return new Date().toISOString().slice(0, 10); }

export default function ApplicationsTab() {
  const [rows, setRows] = useState<AppRow[]>([]);
  const [form, setForm] = useState({ company: '', role: '', source: '', dateApplied: todayStr(), jobDescription: '', notes: '' });
  const [msg, setMsg] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const res = await fetch('/api/applications');
    setRows(await res.json());
  }
  useEffect(() => { load(); }, []);

  async function addApplication() {
    if (!form.company || !form.role) { setMsg('Company and role are required.'); return; }
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (fileRef.current?.files?.[0]) fd.append('resume', fileRef.current.files[0]);
    await fetch('/api/applications', { method: 'POST', body: fd });
    setForm({ company: '', role: '', source: '', dateApplied: todayStr(), jobDescription: '', notes: '' });
    if (fileRef.current) fileRef.current.value = '';
    setMsg('Logged.');
    load();
  }

  async function setStatus(id: string, status: string) {
    await fetch(`/api/applications/${id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status }) });
    load();
  }
  async function remove(id: string) {
    await fetch(`/api/applications/${id}`, { method: 'DELETE' });
    load();
  }
  async function uploadNewVersion(id: string, file: File) {
    const fd = new FormData();
    fd.append('resume', file);
    await fetch(`/api/applications/${id}/resume`, { method: 'POST', body: fd });
    load();
  }

  return (
    <div>
      <h2 className="font-display" style={{ fontSize: 22, fontWeight: 600, margin: '0 0 4px' }}>Application tracker</h2>
      <p style={{ color: 'var(--slate)', fontSize: 13.5, margin: '0 0 22px' }}>
        One row per application, with the exact resume version you submitted attached.
      </p>

      <div className="form-card">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div><label>Company</label><input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></div>
          <div><label>Role</label><input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div><label>Source / portal</label><input value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} placeholder="e.g. LinkedIn, company site, recruiter" /></div>
          <div><label>Date applied</label><input type="date" value={form.dateApplied} onChange={e => setForm({ ...form, dateApplied: e.target.value })} /></div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label>Job description</label>
          <textarea rows={4} value={form.jobDescription} onChange={e => setForm({ ...form, jobDescription: e.target.value })} placeholder="Paste the JD for reference later" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div><label>Resume file for this application</label><input ref={fileRef} type="file" accept=".pdf,.doc,.docx" /></div>
          <div><label>Notes</label><input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional" /></div>
        </div>
        <button className="btn-primary" onClick={addApplication}>Log application</button>
        <span style={{ marginLeft: 12, fontSize: 12.5, color: 'var(--slate)', fontStyle: 'italic' }}>{msg}</span>
      </div>

      {rows.length === 0 ? (
        <div className="empty-state">No applications logged yet.</div>
      ) : (
        <table>
          <thead><tr><th>Company / Role</th><th>Source</th><th>Applied</th><th>JD</th><th>Resume version(s)</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td>{r.company}<br /><span style={{ color: 'var(--slate)', fontSize: 12 }}>{r.role}</span></td>
                <td>{r.source}</td>
                <td>{r.dateApplied.slice(0, 10)}</td>
                <td style={{ maxWidth: 260, color: 'var(--slate)', fontSize: 12.5 }}>
                  {(r.jobDescription || '').slice(0, 140)}{(r.jobDescription || '').length > 140 ? '…' : ''}
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {r.resumeVersions.length === 0
                      ? <span style={{ color: 'var(--slate)' }}>none</span>
                      : r.resumeVersions.map(v => (
                          <a key={v.id} href={v.blobUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--navy)', fontSize: 12.5, textDecoration: 'underline' }}>
                            {v.originalName}
                          </a>
                        ))}
                    <label className="btn-ghost" style={{ display: 'inline-block', cursor: 'pointer', marginTop: 4, width: 'fit-content' }}>
                      + new version
                      <input type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }}
                        onChange={e => { if (e.target.files?.[0]) uploadNewVersion(r.id, e.target.files[0]); }} />
                    </label>
                  </div>
                </td>
                <td>
                  <select value={r.status} onChange={e => setStatus(r.id, e.target.value)} style={{ width: 'auto', fontSize: 12, padding: '5px 8px' }}>
                    <option value="applied">Applied</option>
                    <option value="interview">Interview</option>
                    <option value="offer">Offer</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </td>
                <td><button className="btn-ghost btn-danger" onClick={() => remove(r.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
