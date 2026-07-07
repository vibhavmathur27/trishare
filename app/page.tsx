'use client';

import { useState } from 'react';
import CompareTab from '@/app/components/CompareTab';
import EmailsTab from '@/app/components/EmailsTab';
import CallsTab from '@/app/components/CallsTab';
import ApplicationsTab from '@/app/components/ApplicationsTab';

const TABS = [
  { id: 'compare', label: 'Compare' },
  { id: 'emails', label: 'Emails' },
  { id: 'calls', label: 'Calls' },
  { id: 'applications', label: 'Applications' }
] as const;

type TabId = typeof TABS[number]['id'];

export default function Home() {
  const [tab, setTab] = useState<TabId>('compare');

  return (
    <div>
      <header style={{ background: 'var(--navy-deep)', color: 'var(--cream)', padding: '30px 40px 0', borderBottom: '3px solid var(--gold)' }}>
        <div className="font-mono" style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--gold-soft)', marginBottom: 10 }}>
          Tri-Read
        </div>
        <h1 className="font-display" style={{ fontWeight: 600, fontSize: 30, margin: '0 0 6px', letterSpacing: '-0.01em' }}>
          Job search command center
        </h1>
        <p style={{ margin: '0 0 22px', color: 'rgba(244,240,230,0.7)', fontSize: 13.5, maxWidth: 680, lineHeight: 1.5 }}>
          Compare AI takes on a role, then log every email, call, and application in one place — including which resume version went where.
        </p>
        <nav style={{ display: 'flex', gap: 8 }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`nav-tab ${tab === t.id ? 'active' : ''}`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 40px 80px' }}>
        {tab === 'compare' && <CompareTab />}
        {tab === 'emails' && <EmailsTab />}
        {tab === 'calls' && <CallsTab />}
        {tab === 'applications' && <ApplicationsTab />}
      </main>
    </div>
  );
}
