'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { calcGoal } from '@/lib/utils'
import { useApp } from '@/components/providers/app-provider'
import { IconChevronL, IconChevronR, IconTarget, IconZap } from '@/components/ui/icons'

export function OnboardingScreen() {
  const router = useRouter()
  const { t, profile: existingProfile, completeOnboarding } = useApp()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [formProfile, setFormProfile] = useState({ name: '', age: 25, weight: 75, height: 175, gender: 'male', goal: 'lose' })

  useEffect(() => {
    if (existingProfile) {
      router.replace('/dashboard')
    }
  }, [existingProfile, router])

  const update = (key, value) => setFormProfile((current) => ({ ...current, [key]: value }))
  const bmi = (formProfile.weight / Math.pow(formProfile.height / 100, 2)).toFixed(1)
  const bmiColor = bmi < 18.5 ? 'var(--bl)' : bmi < 25 ? 'var(--em)' : bmi < 30 ? 'var(--am)' : 'var(--ro)'

  const submit = async () => {
    setLoading(true)
    const { error } = await completeOnboarding(formProfile)
    setLoading(false)
    if (!error) router.replace('/dashboard')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--bg)' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--em)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <IconZap size={22} color="#040e18" strokeWidth={2.5} />
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 10 }}>{t.setupProfile}</div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
            {[0, 1].map((index) => <div key={index} style={{ height: 3, borderRadius: 2, transition: 'all .3s', width: index === step ? 32 : 12, background: index <= step ? 'var(--em)' : 'var(--b)' }} />)}
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {step === 0 ? (
            <>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700 }}>{t.bodyStatsStep}</div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--t2)', display: 'block', marginBottom: 6, fontWeight: 500 }}>{t.fullName}</label>
                <input value={formProfile.name} onChange={(event) => update('name', event.target.value)} placeholder={t.fullName} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {['male', 'female'].map((gender) => (
                  <button key={gender} className="btn" onClick={() => update('gender', gender)} style={{ flex: 1, background: formProfile.gender === gender ? 'var(--em)' : 'var(--card2)', color: formProfile.gender === gender ? '#040e18' : 'var(--t2)', border: `1.5px solid ${formProfile.gender === gender ? 'var(--em)' : 'var(--b)'}` }}>
                    {t[gender]}
                  </button>
                ))}
              </div>
              {[[t.age, 'age', t.yearsUnit || 'yrs'], [t.weightKg, 'weight', 'kg'], [t.heightCm, 'height', 'cm']].map(([label, key, unit]) => (
                <div key={key}>
                  <label style={{ fontSize: 12, color: 'var(--t2)', display: 'block', marginBottom: 6, fontWeight: 500 }}>{label}</label>
                  <div style={{ position: 'relative' }}>
                    <input type="number" value={formProfile[key]} onChange={(event) => update(key, Number(event.target.value))} />
                    <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: 'var(--t3)', fontWeight: 500 }}>{unit}</span>
                  </div>
                </div>
              ))}
              <div style={{ background: 'var(--card2)', border: `1px solid ${bmiColor}30`, borderRadius: 10, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--t2)', fontWeight: 500 }}>{t.bmiLabel || 'BMI'}</div>
                  <div style={{ fontSize: 11, color: bmiColor, marginTop: 2, fontWeight: 600 }}>{bmi}</div>
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: bmiColor }}>{bmi}</div>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}><IconTarget size={16} color="var(--em)" /> {t.goalStep}</div>
              {[['lose', t.loseWeight, t.goalLoseHint], ['maintain', t.maintain, t.goalMaintainHint], ['gain', t.buildMuscle, t.goalGainHint]].map(([id, label, hint]) => (
                <button key={id} onClick={() => update('goal', id)} style={{ background: formProfile.goal === id ? 'rgba(0,223,160,.06)' : 'var(--card2)', border: `1.5px solid ${formProfile.goal === id ? 'var(--em)' : 'var(--b)'}`, borderRadius: 11, padding: '13px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', border: `2px solid ${formProfile.goal === id ? 'var(--em)' : 'var(--b)'}`, background: formProfile.goal === id ? 'var(--em)' : 'transparent' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: formProfile.goal === id ? 'var(--em)' : 'var(--tx)', fontSize: 14 }}>{label}</div>
                    <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{hint}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: formProfile.goal === id ? 'var(--em)' : 'var(--t2)' }}>{calcGoal({ ...formProfile, goal: id })}</div>
                    <div style={{ fontSize: 9, color: 'var(--t3)' }}>kcal/day</div>
                  </div>
                </button>
              ))}
              <div style={{ background: 'rgba(0,223,160,.05)', border: '1px solid rgba(0,223,160,.15)', borderRadius: 10, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--t2)', fontWeight: 500 }}>{t.yourDailyTarget}</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 1 }}>{t.dashboardSubtitle}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'var(--em)' }}>{calcGoal(formProfile)}</span>
                  <span style={{ fontSize: 11, color: 'var(--t3)', marginLeft: 3 }}>kcal</span>
                </div>
              </div>
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          {step > 0 ? <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setStep((current) => current - 1)}><IconChevronL size={15} /> {t.back}</button> : null}
          <button className="btn btn-primary" style={{ flex: 2 }} onClick={() => step < 1 ? setStep(1) : submit()} disabled={loading}>
            {loading ? <><span className="spinner" /> {t.loading}</> : step === 1 ? <><IconZap size={15} /> {t.startTracking}</> : <>{t.continue} <IconChevronR size={15} /></>}
          </button>
        </div>
      </div>
    </div>
  )
}
