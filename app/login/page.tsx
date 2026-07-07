'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Incorrect password');
        setLoading(false);
        return;
      }
      router.push(params.get('next') || '/');
      router.refresh();
    } catch {
      setError('Something went wrong. Try again.');
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--navy-deep)' }}>
      <form
        onSubmit={handleSubmit}
        style={{ background: '#fff', borderRadius: 4, padding: '36px 34px', width: 340, borderTop: '3px solid var(--gold)' }}
      >
        <div className="font-mono" style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--slate)', marginBottom: 8 }}>
          Tri-Read
        </div>
        <h1 className="font-display" style={{ fontSize: 22, fontWeight: 600, margin: '0 0 20px' }}>
          Enter password
        </h1>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          autoFocus
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ marginBottom: 14 }}
        />
        {error && <div style={{ color: 'var(--err)', fontSize: 12.5, marginBottom: 12 }}>{error}</div>}
        <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Checking...' : 'Enter'}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
