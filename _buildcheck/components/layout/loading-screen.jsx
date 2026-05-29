'use client'

import { IconZap } from '@/components/ui/icons'
import { useApp } from '@/components/providers/app-provider'

export function LoadingScreen() {
  const { t } = useApp()
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at top, rgba(0,223,160,.08), transparent 42%), var(--bg)' }}>
      <div style={{ textAlign: 'center', maxWidth: 260, padding: 20 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--em)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
          <IconZap size={22} color="#040e18" strokeWidth={2.5} />
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--tx)' }}>Trackily</div>
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 6, alignItems: 'center', color: 'var(--t2)', fontSize: 13 }}>
          <span className="spinner" /> {t.loading}
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--t3)' }}>{t.loadingApp}</div>
      </div>
    </div>
  )
}
