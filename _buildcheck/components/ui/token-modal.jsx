'use client'

import { useMemo, useState } from 'react'
import { billingPeriods, paymentMethods } from '@/lib/token-plans'
import { pickLocalized } from '@/lib/utils'
import { useApp } from '@/components/providers/app-provider'
import { IconCheckCircle, IconCoin, IconX } from '@/components/ui/icons'

const initialDetails = {
  cardNumber: '',
  cardName: '',
  expiry: '',
  cvv: '',
  ccpNumber: '',
  ccpOwner: '',
  phone: '',
}

const formatPlanRate = (item, lang, t) => item?.billingPeriod
  ? `${t.unlimitedLabel} / ${pickLocalized(billingPeriods[item.billingPeriod], lang) || item.billingPeriod}`
  : `${item?.tokens || 0} ${t.tokenUnitLabel}`

export function TokenModal() {
  const { t, lang, profile, tokenModalOpen, closeTokenModal, purchaseTokens, tokenPacks, tokenPlans } = useApp()
  const [paymentMethod, setPaymentMethod] = useState('ccp')
  const [processingId, setProcessingId] = useState('')
  const [selectedItem, setSelectedItem] = useState(null)
  const [details, setDetails] = useState(initialDetails)

  const items = useMemo(() => [...tokenPacks, ...tokenPlans], [tokenPacks, tokenPlans])

  if (!tokenModalOpen) return null

  const activeItem = selectedItem || items[0]
  const activePlanItem = items.find((item) => item.id === profile?.active_plan_id)
  const activePlanName = activePlanItem ? pickLocalized(activePlanItem.name, lang) : (profile?.active_plan_name || t.noActivePlan)

  const updateDetail = (key, value) => setDetails((current) => ({ ...current, [key]: value }))

  const validateDetails = () => {
    if (paymentMethod === 'bank-card') return details.cardNumber && details.cardName && details.expiry && details.cvv
    if (paymentMethod === 'ccp') return details.ccpNumber && details.ccpOwner
    if (paymentMethod === 'baridimob') return details.phone
    return true
  }

  const handlePurchase = async () => {
    if (!activeItem || !validateDetails()) return
    setProcessingId(activeItem.id)
    await purchaseTokens(activeItem, paymentMethod, details)
    setProcessingId('')
    setDetails(initialDetails)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(3,10,18,.68)', zIndex: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
      <div className="card" style={{ width: '100%', maxWidth: 480, maxHeight: '88vh', overflowY: 'auto', padding: 0 }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--b)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}><IconCoin size={16} color="var(--am)" /> {t.tokenBalance}</div>
            <div style={{ fontSize: 11, color: 'var(--t2)', marginTop: 3 }}>{t.tokenDailyHint}</div>
          </div>
          <button onClick={closeTokenModal} style={{ border: '1px solid var(--b)', background: 'var(--card2)', borderRadius: 10, padding: 8, cursor: 'pointer', color: 'var(--t2)', display: 'flex' }}>
            <IconX size={16} />
          </button>
        </div>

        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
            <div style={{ background: 'rgba(255,173,53,.08)', border: '1px solid rgba(255,173,53,.18)', borderRadius: 12, padding: '12px 10px' }}>
              <div style={{ fontSize: 10, color: 'var(--t2)', fontWeight: 600 }}>{t.tokenBalance}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--am)', marginTop: 4 }}>{profile?.token_balance ?? 0}</div>
            </div>
            <div style={{ background: 'var(--card2)', border: '1px solid var(--b)', borderRadius: 12, padding: '12px 10px' }}>
              <div style={{ fontSize: 10, color: 'var(--t2)', fontWeight: 600 }}>{t.dailyAllowance}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, marginTop: 4 }}>{profile?.token_daily_allowance ?? 10}</div>
            </div>
            <div style={{ background: 'var(--card2)', border: '1px solid var(--b)', borderRadius: 12, padding: '12px 10px' }}>
              <div style={{ fontSize: 10, color: 'var(--t2)', fontWeight: 600 }}>{t.activePlan}</div>
              <div style={{ fontSize: 12, fontWeight: 700, marginTop: 6 }}>{activePlanName}</div>
            </div>
          </div>

          <div>
            <div className="section-title" style={{ marginBottom: 8 }}>{t.tokenSectionPacks}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              {tokenPacks.map((pack) => {
                const active = activeItem?.id === pack.id
                return (
                  <button key={pack.id} onClick={() => setSelectedItem(pack)} style={{ borderRadius: 12, border: `1.5px solid ${active ? 'var(--em)' : 'var(--b)'}`, background: active ? 'rgba(0,223,160,.06)' : 'var(--card2)', padding: '12px 10px', cursor: 'pointer', textAlign: 'left' }}>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{pack.tokens}</div>
                    <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 2 }}>{t.tokenUnitLabel}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, marginTop: 8 }}>{pack.priceDzd} DZD</div>
                    <div style={{ fontSize: 10, color: 'var(--t3)' }}>${pack.priceUsd.toFixed(2)}</div>
                    <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 6 }}>{pickLocalized(pack.name, lang)}</div>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <div className="section-title" style={{ marginBottom: 8 }}>{t.tokenSectionPlans}</div>
            <div style={{ display: 'grid', gap: 8 }}>
              {tokenPlans.map((plan) => {
                const active = activeItem?.id === plan.id
                return (
                  <button key={plan.id} onClick={() => setSelectedItem(plan)} style={{ textAlign: 'left', borderRadius: 12, border: `1.5px solid ${active ? 'var(--em)' : 'var(--b)'}`, background: active ? 'rgba(0,223,160,.06)' : 'var(--card2)', padding: '12px 14px', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{pickLocalized(plan.name, lang)}</div>
                        <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{formatPlanRate(plan, lang, t)}</div>
                        <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4 }}>{pickLocalized(plan.description, lang)}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{plan.priceDzd} DZD</div>
                        <div style={{ fontSize: 10, color: 'var(--t3)' }}>${plan.priceUsd.toFixed(2)}</div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="card" style={{ padding: 14, background: 'var(--card2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{pickLocalized(activeItem?.name, lang)}</div>
                <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{activeItem?.billingPeriod ? formatPlanRate(activeItem, lang, t) : `${activeItem?.tokens || 0} ${t.tokenUnitLabel}`}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{activeItem?.priceDzd} DZD</div>
                <div style={{ fontSize: 10, color: 'var(--t3)' }}>${activeItem?.priceUsd?.toFixed?.(2) || '0.00'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              {paymentMethods.map((method) => (
                <button key={method.id} onClick={() => setPaymentMethod(method.id)} style={{ borderRadius: 999, border: `1px solid ${paymentMethod === method.id ? 'var(--em)' : 'var(--b)'}`, background: paymentMethod === method.id ? 'rgba(0,223,160,.08)' : 'var(--bg)', padding: '7px 12px', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: paymentMethod === method.id ? 'var(--em)' : 'var(--t2)' }}>
                  {pickLocalized(method.name, lang)}
                </button>
              ))}
            </div>

            {paymentMethod === 'bank-card' ? (
              <div style={{ display: 'grid', gap: 8 }}>
                <input value={details.cardNumber} onChange={(event) => updateDetail('cardNumber', event.target.value)} placeholder={t.cardNumber} />
                <input value={details.cardName} onChange={(event) => updateDetail('cardName', event.target.value)} placeholder={t.cardHolderName} />
                <div className="grid-2">
                  <input value={details.expiry} onChange={(event) => updateDetail('expiry', event.target.value)} placeholder="MM/YY" />
                  <input value={details.cvv} onChange={(event) => updateDetail('cvv', event.target.value)} placeholder="CVV" />
                </div>
              </div>
            ) : null}

            {paymentMethod === 'ccp' ? (
              <div style={{ display: 'grid', gap: 8 }}>
                <input value={details.ccpNumber} onChange={(event) => updateDetail('ccpNumber', event.target.value)} placeholder={t.ccpAccountNumber} />
                <input value={details.ccpOwner} onChange={(event) => updateDetail('ccpOwner', event.target.value)} placeholder={t.accountHolderName} />
              </div>
            ) : null}

            {paymentMethod === 'baridimob' ? (
              <div style={{ display: 'grid', gap: 8 }}>
                <input value={details.phone} onChange={(event) => updateDetail('phone', event.target.value)} placeholder={t.baridiMobPhone} />
              </div>
            ) : null}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--t3)' }}><IconCheckCircle size={12} color="var(--em)" /> {t.checkoutTestHint}</div>
              <button className="btn btn-primary" style={{ padding: '10px 14px' }} onClick={handlePurchase} disabled={processingId === activeItem?.id || !validateDetails()}>
                {processingId === activeItem?.id ? <span className="spinner" /> : t.buyTokens}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
