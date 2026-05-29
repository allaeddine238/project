'use client'

import { useState } from 'react'
import { calcGoal, formatDate, pickLocalized } from '@/lib/utils'
import { useApp } from '@/components/providers/app-provider'
import { billingPeriods, tokenPlans } from '@/lib/token-plans'
import { IconCoin, IconEdit, IconLogOut, IconMoon, IconRuler, IconSave, IconSettings, IconSun, IconTarget, IconWeight } from '@/components/ui/icons'

const formatPlanRate = (profile, lang, t) => {
  if (!profile?.active_plan_period) return t.noActivePlan
  return `\u221E / ${pickLocalized(billingPeriods[profile.active_plan_period], lang) || profile.active_plan_period}`
}

const getActivePlanName = (profile, lang) => {
  const plan = tokenPlans.find((item) => item.id === profile?.active_plan_id)
  return plan ? pickLocalized(plan.name, lang) : (profile?.active_plan_name || '')
}

export function ProfileScreen() {
  const { t, profile, session, mealCount, dark, setDark, lang, setLang, saveProfile, logout, openTokenModal } = useApp()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ ...profile })

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const submit = async () => {
    setSaving(true)
    await saveProfile({ ...form, daily_calorie_goal: calcGoal(form) })
    setSaving(false)
    setEditing(false)
  }

  const bmi = (profile.weight / Math.pow(profile.height / 100, 2)).toFixed(1)
  const goalLabel = profile.goal === 'lose' ? t.loseWeight : profile.goal === 'gain' ? t.buildMuscle : t.maintain

  return (
    <div className="page-content page-fade">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0 4px', gap: 10 }}>
        <div style={{ width: 72, height: 72, borderRadius: 18, background: 'linear-gradient(135deg,var(--em),var(--em2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontFamily: 'var(--font-display)', fontWeight: 700, color: '#040e18', boxShadow: '0 0 0 4px rgba(0,223,160,.15)' }}>
          {profile.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 700 }}>{profile.name}</div>
          <div style={{ fontSize: 12, color: 'var(--t2)', marginTop: 2 }}>{session.email}</div>
          <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{t.memberSince} {formatDate(session.created_at || Date.now(), lang === 'fr' ? 'fr-FR' : lang === 'ar' ? 'ar-DZ' : 'en-US')}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            ['var(--em)', mealCount, t.mealsLabel],
            ['var(--am)', profile.daily_calorie_goal, t.kcalPerDay],
            ['var(--bl)', bmi, t.bmiLabel],
            ['var(--am)', profile.token_balance ?? 0, t.tokenBalance],
          ].map(([color, value, label]) => (
            <div key={label} style={{ background: 'var(--card2)', border: '1px solid var(--b)', borderRadius: 10, padding: '9px 14px', textAlign: 'center', minWidth: 92 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color }}>{value}</div>
              <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 1 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid-2">
        <button onClick={openTokenModal} className="card" style={{ textAlign: 'left', padding: 14, background: 'rgba(255,173,53,.06)', borderColor: 'rgba(255,173,53,.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--t2)', fontWeight: 600 }}>{t.tokenBalance}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'var(--am)', marginTop: 3 }}>{profile?.token_balance ?? 0}</div>
            </div>
            <IconCoin size={18} color="var(--am)" />
          </div>
          <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 8 }}>{t.dailyAllowance}: {profile?.token_daily_allowance ?? 10}</div>
          <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4 }}>{t.totalSpent}: {profile?.token_total_spent ?? 0}</div>
        </button>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--t2)', fontWeight: 600 }}>{t.activePlan}</div>
          <div style={{ fontWeight: 700, fontSize: 15, marginTop: 4 }}>{getActivePlanName(profile, lang) || t.noActivePlan}</div>
          <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 8 }}>{profile?.active_plan_id ? formatPlanRate(profile, lang, t) : t.buyTokens}</div>
          <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4 }}>{profile?.active_plan_renews_at ? `${t.renewsOn}: ${formatDate(profile.active_plan_renews_at, lang === 'fr' ? 'fr-FR' : lang === 'ar' ? 'ar-DZ' : 'en-US')}` : null}</div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{t.bodyStats}</div>
          <button className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => setEditing((value) => !value)}>
            {editing ? <><IconSave size={13} /> {t.cancel}</> : <><IconEdit size={13} /> {t.editProfile}</>}
          </button>
        </div>

        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input value={form.name} onChange={(event) => update('name', event.target.value)} placeholder={t.fullName} />
            <div style={{ display: 'flex', gap: 8 }}>
              {['male', 'female'].map((gender) => <button key={gender} className="btn" onClick={() => update('gender', gender)} style={{ flex: 1, background: form.gender === gender ? 'var(--em)' : 'var(--card2)', color: form.gender === gender ? '#040e18' : 'var(--t2)', border: `1.5px solid ${form.gender === gender ? 'var(--em)' : 'var(--b)'}` }}>{t[gender]}</button>)}
            </div>
            <div className="grid-2">
              <input type="number" value={form.age} onChange={(event) => update('age', Number(event.target.value))} placeholder={t.age} />
              <input type="number" value={form.weight} onChange={(event) => update('weight', Number(event.target.value))} placeholder={t.weightKg} />
            </div>
            <input type="number" value={form.height} onChange={(event) => update('height', Number(event.target.value))} placeholder={t.heightCm} />
            {['lose', 'maintain', 'gain'].map((goal) => <button key={goal} onClick={() => update('goal', goal)} style={{ display: 'block', width: '100%', padding: '9px 12px', borderRadius: 9, border: `1.5px solid ${form.goal === goal ? 'var(--em)' : 'var(--b)'}`, background: form.goal === goal ? 'rgba(0,223,160,.06)' : 'var(--card2)', textAlign: 'left', fontSize: 13, fontWeight: 500, color: form.goal === goal ? 'var(--em)' : 'var(--t2)' }}>{t[goal === 'lose' ? 'loseWeight' : goal === 'gain' ? 'buildMuscle' : 'maintain']}</button>)}
            <button className="btn btn-primary" onClick={submit} disabled={saving}>{saving ? <><span className="spinner" /> {t.loading}</> : <><IconSave size={15} /> {t.saveProfile}</>}</button>
          </div>
        ) : (
          <div className="grid-2">
            {[
              [IconWeight, `${profile.weight}kg`, t.weightLabel],
              [IconRuler, `${profile.height}cm`, t.heightLabel],
              [null, `${profile.age} ${t.yearsUnit}`, t.age],
              [null, profile.gender === 'male' ? t.male : t.female, t.genderLabel],
              [null, bmi, t.bmiLabel],
              [IconTarget, goalLabel, t.goal],
            ].map(([Icon, value, label]) => (
              <div key={label} style={{ background: 'var(--card2)', border: '1px solid var(--b)', borderRadius: 10, padding: '11px 12px' }}>
                {Icon ? <Icon size={14} color="var(--t3)" style={{ marginBottom: 4 }} /> : null}
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{value}</div>
                <div style={{ fontSize: 10, color: 'var(--t3)' }}>{label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 7 }}><IconSettings size={14} color="var(--t2)" /> {t.profileSettings}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{t.appearance}</div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 1 }}>{dark ? t.darkMode : t.lightMode}</div>
          </div>
          <button onClick={() => setDark((value) => !value)} style={{ background: 'var(--card2)', border: '1px solid var(--b)', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 500, color: 'var(--t2)', display: 'flex', alignItems: 'center', gap: 6 }}>
            {dark ? <><IconSun size={13} /> {t.lightMode}</> : <><IconMoon size={13} /> {t.darkMode}</>}
          </button>
        </div>
        <div style={{ height: 1, background: 'var(--b)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{t.language}</div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 1 }}>EN / FR / AR</div>
          </div>
          <select value={lang} onChange={(event) => setLang(event.target.value)} style={{ width: 'auto', padding: '7px 12px', borderRadius: 8, fontSize: 12 }}>
            <option value="en">EN</option>
            <option value="fr">FR</option>
            <option value="ar">AR</option>
          </select>
        </div>
      </div>

      <button className="btn btn-danger" style={{ width: '100%' }} onClick={logout}><IconLogOut size={15} /> {t.signOut}</button>
    </div>
  )
}






