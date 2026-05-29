'use client'

import { useMemo, useState } from 'react'
import { useApp } from '@/components/providers/app-provider'
import { IconPlus } from '@/components/ui/icons'

export function FoodParserCard({ mealType, onComplete }) {
  const { t, lang, logMeal, notify } = useApp()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState([])
  const [provider, setProvider] = useState('')

  const totals = useMemo(() => items.reduce((accumulator, item) => ({
    calories: accumulator.calories + Number(item.calories || 0),
    protein: accumulator.protein + Number(item.protein || 0),
    carbs: accumulator.carbs + Number(item.carbs || 0),
    fat: accumulator.fat + Number(item.fat || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 }), [items])

  const handleSubmit = async () => {
    const safeQuery = query.trim()
    if (!safeQuery || loading) return

    setLoading(true)
    setItems([])

    try {
      const response = await fetch('/api/meal-parser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: safeQuery, lang }),
      })
      const data = await response.json()
      if (!response.ok || !Array.isArray(data?.items) || data.items.length === 0) {
        notify(data?.error || t.foodParserError)
        return
      }

      setProvider(data.provider || '')
      setItems(data.items)

      for (const item of data.items) {
        const result = await logMeal({
          name: item.name,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          type: mealType,
        })
        if (result?.error) break
      }

      setQuery('')
      onComplete?.()
    } catch {
      notify(t.foodParserError)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card" style={{ padding: 14, background: 'linear-gradient(135deg,rgba(80,128,240,.06),rgba(0,223,160,.03))', borderColor: 'rgba(80,128,240,.18)' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700 }}>{t.foodParserTitle}</div>
      <div style={{ fontSize: 12, color: 'var(--t2)', marginTop: 4 }}>{t.foodParserHint}</div>

      <textarea
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t.foodParserPlaceholder}
        rows={3}
        style={{ width: '100%', marginTop: 12, resize: 'vertical', borderRadius: 12, border: '1px solid var(--b)', background: 'var(--card2)', color: 'var(--t)', padding: 12, font: 'inherit' }}
      />

      <button className="btn btn-primary" style={{ width: '100%', marginTop: 10 }} onClick={handleSubmit} disabled={loading || !query.trim()}>
        <IconPlus size={14} /> {loading ? t.foodParserWorking : t.foodParserSubmit}
      </button>

      {items.length > 0 ? (
        <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
          <div style={{ fontSize: 11, color: 'var(--t3)' }}>
            {provider === 'groq' ? t.foodParserProviderGroq : t.foodParserProviderLocal}
          </div>
          {items.map((item) => (
            <div key={item.id} style={{ background: 'var(--card2)', border: '1px solid var(--b)', borderRadius: 10, padding: '10px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--bl)' }}>{item.calories} {t.kcalShort}</div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4 }}>
                {item.grams}{t.gramsShort} • {item.protein}{t.gramsShort} {t.protein} • {item.carbs}{t.gramsShort} {t.carbs} • {item.fat}{t.gramsShort} {t.fat}
              </div>
            </div>
          ))}
          <div className="meal-macro-grid">
            {[
              [t.calories, `${totals.calories}`],
              [t.protein, `${Math.round(totals.protein)}${t.gramsShort}`],
              [t.carbs, `${Math.round(totals.carbs)}${t.gramsShort}`],
              [t.fat, `${Math.round(totals.fat)}${t.gramsShort}`],
            ].map(([label, value]) => (
              <div key={label} style={{ background: 'var(--card2)', border: '1px solid var(--b)', borderRadius: 10, padding: '9px 8px', textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: 12 }}>{value}</div>
                <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
