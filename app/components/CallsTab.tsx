'use client';

import { useEffect, useState } from 'react';

type CallRow = {
  id: string; name: string; company: string; role: string; phone: string;
  dateCalled: string; outcome: string; nextFollowUp: string | null; notes: string;
};

function todayStr() { return new Date().toISOString().slice(0, 10); }

export default function CallsTab() {
  const [rows, setRows] = useState<CallRow[]>([]);
  const [form, setForm] = useState({ name: '', company: '', role: '', phone: '', dateCalled: todayStr(), nextFollowUp: '', notes: '' });
  const [msg, setMsg] = useState('');

  async function load() {
    const res = await fetch('/api/calls');
    setRows(await res.json());
  }
  useEffect(() => { load(); }, []);

  async function addCall() {
    if (!form.name || !form.phone) { setMsg('Name and phone are required.'); return; }
    await fetch('/api/calls', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(form) });
    setForm({ name: '', company: '', role: '', phone: '', dateCalled: todayStr(), nextFollowUp: '', notes: '' });
    setMsg('Logged.');
    load();
  }

  async function setOutcome(id: string, outcome: string) {
    await fetch(`/api/calls/${id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ outcome }) });
    load();
  }
  async function remove(id: string) {
    await fetch(`/api/calls/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div>
      <h2 className="font-display" style={{ fontSize: 22, fontWeight: 600, margin: '0 0 4px' }}>Call follow-up hub</h2>
      <p style={{ color: 'var(--slate)', fontSize: 13.5, margin: '0 0 22px' }}>
        Keep the conversation moving with a clear log of calls, outcomes, and reminders.
      </p>

      <div className="form-card" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #fcfaf4 100%)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div><label>Name</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div><label>Company</label><input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></div>
          <div><label>Role</label><input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div><label>Phone</label><input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
          <div><label>Date called</label><input type="date" value={form.dateCalled} onChange={e => setForm({ ...form, dateCalled: e.target.value })} /></div>
          <div><label>Next follow-up</label><input type="date" value={form.nextFollowUp} onChange={e => setForm({ ...form, nextFollowUp: e.target.value })} /></div>
        </div>
        <div style={{ marginBottom: 14 }}><label>Notes</label><input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optional" /></div>
        <button className="btn-primary" onClick={addCall}>Log call</button>
        <span style={{ marginLeft: 12, fontSize: 12.5, color: 'var(--slate)', fontStyle: 'italic' }}>{msg}</span>
      </div>

      {rows.length === 0 ? (
        <div className="empty-state">No calls logged yet.</div>
      ) : (
        <table>
          <thead><tr><th>Person</th><th>Company / Role</th><th>Phone</th><th>Called</th><th>Outcome</th><th>Follow-up</th><th>Actions</th></tr></thead>
          <tbody>
            {rows.map(r => {
              const due = r.nextFollowUp && new Date(r.nextFollowUp) <= new Date();
              const badgeClass = r.outcome === 'connected' ? 'badge-ok' : r.outcome === 'no_answer' ? 'badge-err' : 'badge-neutral';
              return (
                <tr key={r.id}>
                  <td>{r.name}<br /><span style={{ color: 'var(--slate)', fontSize: 12 }}>{r.notes || 'No notes'}</span></td>
                  <td>{r.company}{r.role ? ` — ${r.role}` : ''}</td>
                  <td>{r.phone}</td>
                  <td>{r.dateCalled.slice(0, 10)}</td>
                  <td><span className={`badge ${badgeClass}`}>{r.outcome.replace('_', ' ')}</span></td>
                  <td>{r.nextFollowUp ? <>{r.nextFollowUp.slice(0, 10)} {due && <span className="badge badge-warn">Due</span>}</> : '—'}</td>
                  <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <select value={r.outcome} onChange={e => setOutcome(r.id, e.target.value)} style={{ width: 'auto', fontSize: 12, padding: '5px 8px' }}>
                      <option value="connected">Connected</option>
                      <option value="no_answer">No answer</option>
                      <option value="voicemail">Voicemail</option>
                      <option value="scheduled">Scheduled</option>
                    </select>
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
