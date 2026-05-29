'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { sendPasswordReset, signIn, signUp } from '@/lib/db'
import { useApp } from '@/components/providers/app-provider'
import { IconAlertTriangle, IconMoon, IconSun, IconZap } from '@/components/ui/icons'

export function AuthScreen() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t, lang, setLang, dark, setDark } = useApp()
  const [mode, setMode] = useState('signin')
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const isReset = mode === 'reset'
  const isSignup = mode === 'signup'

  useEffect(() => {
    const requestedMode = searchParams.get('mode')
    if (requestedMode === 'signup' || requestedMode === 'reset' || requestedMode === 'signin') {
      setMode(requestedMode)
      setError('')
      setSuccess('')
    }
  }, [searchParams])

  const helperText = useMemo(() => {
    if (isReset) return t.resetHint
    return t.tagline
  }, [isReset, t])

  const updateField = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  const handleReset = async () => {
    if (!form.email) {
      setError(t.fillRequired)
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    const redirectTo = `${window.location.origin}/auth/update-password`
    const { error: resetError } = await sendPasswordReset(form.email, redirectTo)
    setLoading(false)

    if (resetError) {
      setError(resetError.message || t.authConnectionError)
      return
    }

    setSuccess(t.resetSent)
  }

  const handleSubmit = async () => {
    setError('')
    setSuccess('')

    if (!form.email || (!isReset && !form.password)) {
      setError(t.fillRequired)
      return
    }

    if (isSignup && form.password !== form.confirm) {
      setError(t.passwordMismatch)
      return
    }

    if (isSignup && form.password.length < 6) {
      setError(t.passwordMin)
      return
    }

    if (isReset) {
      await handleReset()
      return
    }

    setLoading(true)

    try {
      if (isSignup) {
        const { data, error: signUpError } = await signUp(form.email, form.password, form.name)
        const identities = data?.user?.identities || []
        const errorMessage = signUpError?.message?.toLowerCase() || ''
        const alreadyExists = errorMessage.includes('already') || (data?.user && identities.length === 0)

        if (alreadyExists) {
          setError(t.emailExists)
          setLoading(false)
          return
        }

        if (signUpError) {
          setError(signUpError.message || t.authConnectionError)
          setLoading(false)
          return
        }

        if (data?.session) {
          setLoading(false)
          router.replace('/onboarding')
          return
        }

        setSuccess(t.accountCreatedConfirm)
        setMode('signin')
        setForm((current) => ({ ...current, password: '', confirm: '' }))
        setLoading(false)
        return
      }

      const { error: signInError } = await signIn(form.email, form.password)
      if (signInError) {
        const message = signInError.message?.toLowerCase() || ''

        if (message.includes('email not confirmed')) {
          setError(t.emailNotConfirmed)
        } else {
          setError(t.invalidCredentials)
        }

        setLoading(false)
        return
      }

      setLoading(false)
      router.replace('/dashboard')
      return
    } catch {
      setError(t.authConnectionError)
    }

    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--bg)' }}>
      <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 8 }}>
        <button onClick={() => setDark((value) => !value)} style={{ background: 'var(--card)', border: '1px solid var(--b)', borderRadius: 8, padding: 7, cursor: 'pointer', color: 'var(--t2)', display: 'flex', alignItems: 'center' }}>
          {dark ? <IconSun size={15} /> : <IconMoon size={15} />}
        </button>
        <select value={lang} onChange={(event) => setLang(event.target.value)} style={{ width: 'auto', padding: '6px 10px', borderRadius: 8, fontSize: 12 }}>
          <option value="en">EN</option>
          <option value="fr">FR</option>
          <option value="ar">AR</option>
        </select>
      </div>

      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--em)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <IconZap size={26} color="#040e18" strokeWidth={2.5} />
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, letterSpacing: '-.03em' }}>Trackily</div>
          <div style={{ fontSize: 13, color: 'var(--t2)', marginTop: 4 }}>{helperText}</div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700 }}>
            {isReset ? t.resetPassword : isSignup ? t.createAccount : t.welcomeBack}
          </div>

          {error ? (
            <div style={{ background: 'rgba(255,77,109,.06)', border: '1px solid rgba(255,77,109,.2)', borderRadius: 9, padding: '10px 12px', fontSize: 13, color: 'var(--ro)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <IconAlertTriangle size={14} color="var(--ro)" /> {error}
            </div>
          ) : null}

          {success ? (
            <div style={{ background: 'rgba(0,223,160,.06)', border: '1px solid rgba(0,223,160,.2)', borderRadius: 9, padding: '10px 12px', fontSize: 13, color: 'var(--em)' }}>
              {success}
            </div>
          ) : null}

          {isSignup ? (
            <div>
              <label style={{ fontSize: 12, color: 'var(--t2)', display: 'block', marginBottom: 6, fontWeight: 500 }}>{t.fullName}</label>
              <input value={form.name} onChange={(event) => updateField('name', event.target.value)} placeholder={t.fullName} />
            </div>
          ) : null}

          <div>
            <label style={{ fontSize: 12, color: 'var(--t2)', display: 'block', marginBottom: 6, fontWeight: 500 }}>{t.email}</label>
            <input type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} placeholder={t.email} />
          </div>

          {!isReset ? (
            <div>
              <label style={{ fontSize: 12, color: 'var(--t2)', display: 'block', marginBottom: 6, fontWeight: 500 }}>{t.password}</label>
              <input type="password" value={form.password} onChange={(event) => updateField('password', event.target.value)} placeholder={t.password} onKeyDown={(event) => event.key === 'Enter' && handleSubmit()} />
            </div>
          ) : null}

          {isSignup ? (
            <div>
              <label style={{ fontSize: 12, color: 'var(--t2)', display: 'block', marginBottom: 6, fontWeight: 500 }}>{t.confirmPassword}</label>
              <input type="password" value={form.confirm} onChange={(event) => updateField('confirm', event.target.value)} placeholder={t.confirmPassword} onKeyDown={(event) => event.key === 'Enter' && handleSubmit()} />
            </div>
          ) : null}

          <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleSubmit} disabled={loading}>
            {loading ? <><span className="spinner" /> {t.loading}</> : isReset ? t.sendResetLink : isSignup ? t.signUp : t.signIn}
          </button>

          {!isReset ? (
            <button onClick={() => { setMode('reset'); setError(''); setSuccess('') }} style={{ color: 'var(--am)', fontSize: 13, fontWeight: 600, textAlign: 'center', cursor: 'pointer', border: 'none' }}>
              {t.forgotPassword}
            </button>
          ) : null}

          <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--t3)' }}>
            {isReset ? (
              <span style={{ color: 'var(--em)', fontWeight: 600, cursor: 'pointer' }} onClick={() => setMode('signin')}>{t.signIn}</span>
            ) : (
              <>
                {isSignup ? t.haveAccount : t.noAccount}{' '}
                <span style={{ color: 'var(--em)', fontWeight: 600, cursor: 'pointer' }} onClick={() => { setMode(isSignup ? 'signin' : 'signup'); setError(''); setSuccess('') }}>
                  {isSignup ? t.signIn : t.signUp}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

