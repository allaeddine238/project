'use client'

// Simple public intro page for signed-out users.
import { useRouter } from 'next/navigation'
import { useApp } from '@/components/providers/app-provider'
import { IconMeals, IconMoon, IconSun, IconZap } from '@/components/ui/icons'

export function PublicHomeScreen() {
  const router = useRouter()
  const { t, lang, setLang, dark, setDark } = useApp()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--tx)' }}>
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '20px 16px 40px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
            marginBottom: 28,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: 'var(--em)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconZap size={20} color="#04131d" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800 }}>Trackily</div>
              <div style={{ fontSize: 12, color: 'var(--t2)' }}>{t.tagline}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => setDark((value) => !value)}
              style={{
                background: 'var(--card)',
                border: '1px solid var(--b)',
                borderRadius: 10,
                padding: 8,
                cursor: 'pointer',
                color: 'var(--t2)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {dark ? <IconSun size={15} /> : <IconMoon size={15} />}
            </button>
            <select
              value={lang}
              onChange={(event) => setLang(event.target.value)}
              style={{ width: 'auto', minWidth: 72, padding: '8px 10px', borderRadius: 10, fontSize: 12 }}
            >
              <option value="en">EN</option>
              <option value="fr">FR</option>
              <option value="ar">AR</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 800, lineHeight: 1 }}>
              {t.landingTitle}
            </div>
            <div style={{ marginTop: 14, maxWidth: 640, color: 'var(--t2)', lineHeight: 1.7 }}>
              {t.landingSubtitle}
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
              <button className="btn btn-primary" onClick={() => router.push('/auth')}>
                {t.signIn}
              </button>
              <button className="btn btn-secondary" onClick={() => router.push('/auth?mode=signup')}>
                {t.signUp}
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {[t.landingProofMeals, t.landingProofWorkouts, t.landingProofCoach].map((item) => (
              <div key={item} className="card" style={{ padding: 18 }}>
                <div style={{ color: 'var(--tx)', lineHeight: 1.6 }}>{item}</div>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <IconMeals size={16} color="var(--em)" />
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>
                {t.landingPreviewTitle}
              </div>
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              <div
                style={{
                  border: '1px solid var(--b)',
                  borderRadius: 14,
                  padding: '12px 14px',
                  background: 'var(--card2)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 10,
                  flexWrap: 'wrap',
                }}
              >
                <span>{t.dailyGoal}</span>
                <strong>2150 kcal</strong>
              </div>
              <div
                style={{
                  border: '1px solid var(--b)',
                  borderRadius: 14,
                  padding: '12px 14px',
                  background: 'var(--card2)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 10,
                  flexWrap: 'wrap',
                }}
              >
                <span>{t.tokenBalance}</span>
                <strong>10 {t.tokenUnitLabel}</strong>
              </div>
              <div
                style={{
                  border: '1px solid var(--b)',
                  borderRadius: 14,
                  padding: '12px 14px',
                  background: 'var(--card2)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 10,
                  flexWrap: 'wrap',
                }}
              >
                <span>{t.landingPreviewMeals}</span>
                <span>3 {t.mealsLabel.toLowerCase()}</span>
              </div>
              <div
                style={{
                  border: '1px solid var(--b)',
                  borderRadius: 14,
                  padding: '12px 14px',
                  background: 'var(--card2)',
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{t.landingPreviewCoach}</div>
                <div style={{ color: 'var(--t2)', lineHeight: 1.6 }}>{t.landingPreviewCoachCopy}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
