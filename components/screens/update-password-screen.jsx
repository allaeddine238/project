'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateUserPassword } from '@/lib/db'
import { useApp } from '@/components/providers/app-provider'
import { IconAlertTriangle, IconLock } from '@/components/ui/icons'

export function UpdatePasswordScreen() {
  const router = useRouter()
  const { t } = useApp()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  const submit = async () => {
    setError('')
    if (password.length < 6) {
      setError(t.passwordMin)
      return
    }
    if (password !== confirmPassword) {
      setError(t.passwordMismatch)
      return
    }

    setLoading(true)
    const { error: updateError } = await updateUserPassword(password)
    setLoading(false)

    if (updateError) {
      setError(updateError.message || t.authConnectionError)
      return
    }

    setSuccess(t.passwordUpdated)
    setTimeout(() => router.replace('/auth'), 1200)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700 }}>{t.resetPassword}</div>
          <div style={{ fontSize: 13, color: 'var(--t2)' }}>{t.updatePasswordHint}</div>

          {error ? <div style={{ background: 'rgba(255,77,109,.06)', border: '1px solid rgba(255,77,109,.2)', borderRadius: 9, padding: '10px 12px', fontSize: 13, color: 'var(--ro)', display: 'flex', alignItems: 'center', gap: 8 }}><IconAlertTriangle size={14} color="var(--ro)" /> {error}</div> : null}
          {success ? <div style={{ background: 'rgba(0,223,160,.06)', border: '1px solid rgba(0,223,160,.2)', borderRadius: 9, padding: '10px 12px', fontSize: 13, color: 'var(--em)' }}>{success}</div> : null}

          <div>
            <label style={{ fontSize: 12, color: 'var(--t2)', display: 'block', marginBottom: 6, fontWeight: 500 }}>{t.newPassword}</label>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={t.newPassword} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--t2)', display: 'block', marginBottom: 6, fontWeight: 500 }}>{t.confirmPassword}</label>
            <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder={t.confirmPassword} />
          </div>

          <button className="btn btn-primary" onClick={submit} disabled={loading}>
            {loading ? <><span className="spinner" /> {t.loading}</> : <><IconLock size={15} /> {t.save}</>}
          </button>
        </div>
      </div>
    </div>
  )
}
