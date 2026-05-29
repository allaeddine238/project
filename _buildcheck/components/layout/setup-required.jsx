'use client'

import { IconAlertTriangle, IconZap } from '@/components/ui/icons'

export function SetupRequired() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--em)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <IconZap size={26} color="#040e18" strokeWidth={2.5} />
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700 }}>Trackily</div>
          <div style={{ fontSize: 13, color: 'var(--t2)', marginTop: 4 }}>Next.js production build with Supabase auth</div>
        </div>
        <div className="card" style={{ border: '1px solid rgba(255,173,53,.3)', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(255,173,53,.12)', border: '1px solid rgba(255,173,53,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconAlertTriangle size={18} color="var(--am)" />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Supabase Setup Required</div>
              <div style={{ fontSize: 12, color: 'var(--t2)', marginTop: 1 }}>Add your credentials to start using the app</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: 'var(--t2)' }}>
            {[
              ['1', 'Create a free Supabase project', 'supabase.com ? New Project'],
              ['2', 'Run the schema', 'SQL Editor ? paste supabase/schema.sql ? Run'],
              ['3', 'Copy .env.example to .env.local', 'Add your project URL and anon key'],
              ['4', 'Restart the dev server', 'npm run dev'],
            ].map(([n, title, sub]) => (
              <div key={n} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 12px', background: 'var(--card2)', borderRadius: 9, border: '1px solid var(--b)' }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--em)', color: '#040e18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{n}</div>
                <div>
                  <div style={{ fontWeight: 500, color: 'var(--tx)' }}>{title}</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
