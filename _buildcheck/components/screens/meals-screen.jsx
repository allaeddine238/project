'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import { useApp } from '@/components/providers/app-provider'
import { traditionalMeals } from '@/lib/meal-data'
import { clampNumber, pickLocalized } from '@/lib/utils'
import { FoodParserCard } from '@/components/ui/food-parser-card'
import { IconPlus, IconSearch, IconTrash } from '@/components/ui/icons'

const mealTypeOptions = ['breakfast', 'lunch', 'dinner', 'snack']

const defaultAmountState = (item) => ({
  mode: item.defaultMode || item.modes?.[0] || 'g',
  amount: item.defaultAmount ?? (item.defaultMode === 'unit' ? 1 : 100),
})

const round = (value) => Math.round(value * 10) / 10
const normalize = (text = '') => text.toLowerCase().trim()

const createTraditionalIndex = () => traditionalMeals.map((item) => ({
  id: item.id,
  image: item.image,
  names: item.names,
  descriptions: item.descriptions,
  nutritionPer100g: item.per100g,
  gramsPerUnit: item.defaultGrams,
  unitLabels: { en: 'plate', fr: 'assiette', ar: '\u0637\u0628\u0642' },
  modes: ['g', 'unit'],
  defaultMode: 'g',
  defaultAmount: item.defaultGrams,
  amountStep: { g: 10, unit: 1 },
  source: 'database',
  kind: 'traditional',
  category: item.category,
  origins: item.origins,
}))

function calculateNutrition(item, state) {
  const amount = clampNumber(state?.amount ?? item.defaultAmount ?? 0, 0)
  const mode = state?.mode || item.defaultMode || 'g'
  const grams = mode === 'unit' ? amount * (item.gramsPerUnit || 1) : amount
  const scale = grams / 100

  return {
    amount,
    mode,
    grams,
    calories: Math.round((item.nutritionPer100g?.calories || 0) * scale),
    protein: round((item.nutritionPer100g?.protein || 0) * scale),
    carbs: round((item.nutritionPer100g?.carbs || 0) * scale),
    fat: round((item.nutritionPer100g?.fat || 0) * scale),
  }
}

export function MealsScreen() {
  const { t, lang, meals, logMeal, removeMeal } = useApp()
  const [tab, setTab] = useState('traditional')
  const [mealType, setMealType] = useState('lunch')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [amountMap, setAmountMap] = useState({})
  const [pendingMealKey, setPendingMealKey] = useState('')
  const [successMealKey, setSuccessMealKey] = useState('')
  const [removingMealId, setRemovingMealId] = useState('')

  const traditionalIndex = useMemo(() => createTraditionalIndex(), [])
  const categories = useMemo(() => ['all', ...new Set(traditionalMeals.map((meal) => meal.category))], [])

  const filteredTraditional = useMemo(() => {
    const query = normalize(search)
    return traditionalMeals.filter((meal) => {
      const matchesCategory = category === 'all' || meal.category === category
      if (!query) return matchesCategory
      const names = [meal.names.en, meal.names.fr, meal.names.ar].join(' ').toLowerCase()
      const description = [meal.descriptions.en, meal.descriptions.fr, meal.descriptions.ar].join(' ').toLowerCase()
      return matchesCategory && (names.includes(query) || description.includes(query))
    })
  }, [category, search])

  const searchMatches = useMemo(() => {
    const query = normalize(search)
    if (!query) return []
    return traditionalIndex.filter((item) => {
      const names = [item.names?.en, item.names?.fr, item.names?.ar].filter(Boolean).join(' ').toLowerCase()
      const description = item.descriptions ? [item.descriptions.en, item.descriptions.fr, item.descriptions.ar].filter(Boolean).join(' ').toLowerCase() : ''
      return names.includes(query) || description.includes(query)
    })
  }, [search, traditionalIndex])

  const todayTotals = useMemo(() => meals.reduce((accumulator, meal) => ({
    calories: accumulator.calories + Number(meal.calories || 0),
    protein: accumulator.protein + Number(meal.protein || 0),
    carbs: accumulator.carbs + Number(meal.carbs || 0),
    fat: accumulator.fat + Number(meal.fat || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 }), [meals])

  const mealsByType = useMemo(() => mealTypeOptions
    .map((type) => {
      const items = meals.filter((meal) => (meal.meal_type || 'lunch') === type)
      const calories = items.reduce((total, meal) => total + Number(meal.calories || 0), 0)
      return { type, items, calories }
    })
    .filter((section) => section.items.length > 0), [meals])

  const handleLogMeal = async (meal, itemKey) => {
    setPendingMealKey(itemKey)
    setSuccessMealKey('')
    const result = await logMeal(meal)
    setPendingMealKey('')
    if (!result?.error) {
      setSearch('')
      setSuccessMealKey(itemKey)
      setTab('today')
      window.setTimeout(() => setSuccessMealKey((current) => current === itemKey ? '' : current), 1800)
    }
  }

  const updateAmount = (id, patch, item) => {
    setAmountMap((current) => {
      const existing = current[id] || defaultAmountState(item)
      return {
        ...current,
        [id]: { ...existing, ...patch },
      }
    })
  }

  const handleRemoveMeal = async (mealId) => {
    setRemovingMealId(mealId)
    await removeMeal(mealId)
    setRemovingMealId('')
  }

  const renderFoodCard = (item, accent = 'var(--em)') => {
    const state = amountMap[item.id] || defaultAmountState(item)
    const nutrition = calculateNutrition(item, state)
    const amountMode = state.mode
    const unitLabel = pickLocalized(item.unitLabels, lang)
    const title = pickLocalized(item.names, lang)
    const description = pickLocalized(item.descriptions, lang)
    const step = item.amountStep?.[amountMode] || 1

    return (
      <div key={item.id} className="card" style={{ padding: 14, borderColor: `${accent}25` }}>
        <div className="meal-card-layout">
          <div className="meal-card-image-wrap">
            <Image src={item.image} alt={title} width={180} height={130} className="meal-card-image" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{title}</div>
                <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{description}</div>
                <div style={{ fontSize: 11, color: accent, marginTop: 6, fontWeight: 700 }}>{t.sourceDatabase}</div>
                {item.origins ? <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{t.originLabel}: {pickLocalized(item.origins, lang)}</div> : null}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: accent }}>{nutrition.calories}</div>
                <div style={{ fontSize: 10, color: 'var(--t3)' }}>{t.kcalShort}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              {item.modes.map((mode) => (
                <button
                  key={mode}
                  className="btn"
                  onClick={() => updateAmount(item.id, { mode }, item)}
                  style={{
                    flex: 1,
                    background: amountMode === mode ? `${accent}15` : 'var(--card2)',
                    color: amountMode === mode ? accent : 'var(--t2)',
                    border: `1.5px solid ${amountMode === mode ? accent : 'var(--b)'}`,
                    padding: '8px 12px',
                  }}
                >
                  {mode === 'g' ? t.grams : t.unit}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
              <button onClick={() => updateAmount(item.id, { amount: Math.max(0, nutrition.amount - step) }, item)} className="btn btn-secondary" style={{ padding: '8px 14px' }}>-</button>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  type="number"
                  min="0"
                  step={step}
                  value={nutrition.amount}
                  onChange={(event) => updateAmount(item.id, { amount: clampNumber(event.target.value, 0) }, item)}
                  style={{ textAlign: 'center' }}
                />
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--t2)', fontWeight: 500 }}>
                  {amountMode === 'g' ? t.gramsShort : unitLabel}
                </span>
              </div>
              <button onClick={() => updateAmount(item.id, { amount: nutrition.amount + step }, item)} className="btn btn-secondary" style={{ padding: '8px 14px' }}>+</button>
            </div>

            <div className="meal-macro-grid" style={{ marginBottom: 12 }}>
              {[
                [t.protein, `${nutrition.protein}${t.gramsShort}`],
                [t.carbs, `${nutrition.carbs}${t.gramsShort}`],
                [t.fat, `${nutrition.fat}${t.gramsShort}`],
                [t.amount, amountMode === 'g' ? `${nutrition.grams}${t.gramsShort}` : `${nutrition.amount} ${unitLabel}`],
              ].map(([label, value]) => (
                <div key={label} style={{ background: 'var(--card2)', border: '1px solid var(--b)', borderRadius: 10, padding: '9px 8px', textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: 12 }}>{value}</div>
                  <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', fontSize: 13, padding: 9 }}
              disabled={pendingMealKey === item.id}
              onClick={() => handleLogMeal({ name: title, calories: nutrition.calories, protein: nutrition.protein, carbs: nutrition.carbs, fat: nutrition.fat, type: mealType }, item.id)}
            >
              <IconPlus size={14} /> {pendingMealKey === item.id ? t.adding : successMealKey === item.id ? t.added : t.addToLog}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const traditionalCards = filteredTraditional.map((meal) => {
    const mapped = traditionalIndex.find((item) => item.id === meal.id)
    return renderFoodCard(mapped, 'var(--em)')
  })

  return (
    <div className="page-content page-fade">
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>{t.mealLibrary}</div>
        <div style={{ fontSize: 12, color: 'var(--t2)', marginTop: 3 }}>{t.mealOverview}</div>
      </div>

      <div>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 12, top: 0, bottom: 0, display: 'flex', alignItems: 'center', color: 'var(--t3)', pointerEvents: 'none' }}>
            <IconSearch size={15} />
          </div>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t.searchTraditionalMeals} style={{ paddingLeft: 36 }} />
        </div>
        <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 6 }}>{t.mealSearchHint}</div>
      </div>

      <FoodParserCard mealType={mealType} onComplete={() => setTab('today')} />

      <div style={{ display: 'flex', gap: 6 }}>
        {mealTypeOptions.map((item) => (
          <button key={item} onClick={() => setMealType(item)} style={{ flex: 1, padding: '8px 4px', borderRadius: 9, border: `1.5px solid ${mealType === item ? 'var(--em)' : 'var(--b)'}`, background: mealType === item ? 'rgba(0,223,160,.06)' : 'var(--card2)', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: mealType === item ? 'var(--em)' : 'var(--t3)' }}>{t[item]}</button>
        ))}
      </div>

      <div className="card" style={{ padding: 14, background: 'linear-gradient(135deg,rgba(0,223,160,.05),rgba(80,128,240,.04))', borderColor: 'rgba(0,223,160,.18)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
          <div>
            <div className="section-title" style={{ marginBottom: 6 }}>{t.todayMeals}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--em)' }}>{todayTotals.calories} {t.kcalShort}</div>
          </div>
          <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => setTab('today')}>
            {meals.length} {t.meals}
          </button>
        </div>
        <div className="meal-macro-grid">
          {[
            [t.protein, `${Math.round(todayTotals.protein)}${t.gramsShort}`],
            [t.carbs, `${Math.round(todayTotals.carbs)}${t.gramsShort}`],
            [t.fat, `${Math.round(todayTotals.fat)}${t.gramsShort}`],
            [t.amount, `${meals.length}`],
          ].map(([label, value]) => (
            <div key={label} style={{ background: 'var(--card2)', border: '1px solid var(--b)', borderRadius: 10, padding: '9px 8px', textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 12 }}>{value}</div>
              <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {search.trim() ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {searchMatches.length > 0 ? (
            <>
              <div className="section-title">{t.databaseResults}</div>
              {searchMatches.map((item) => renderFoodCard(item, 'var(--am)'))}
            </>
          ) : (
            <div className="card empty-state">
              <div style={{ fontWeight: 600, color: 'var(--t2)' }}>{t.noTraditionalMatches}</div>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="pill-tabs">
            {[
              ['traditional', t.traditionalMeals],
              ['today', t.todayMeals],
            ].map(([id, label]) => (
              <button key={id} className={`pill-tab${tab === id ? ' active' : ''}`} onClick={() => setTab(id)}>{label}</button>
            ))}
          </div>

          {tab === 'traditional' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
                {categories.map((item) => (
                  <button key={item} onClick={() => setCategory(item)} style={{ whiteSpace: 'nowrap', padding: '5px 12px', borderRadius: 7, cursor: 'pointer', background: category === item ? 'var(--em)' : 'var(--card2)', color: category === item ? '#040e18' : 'var(--t2)', fontSize: 12, fontWeight: 600, border: category === item ? 'none' : '1px solid var(--b)' }}>
                    {item === 'all' ? t.all : t[`category${item.charAt(0).toUpperCase() + item.slice(1)}`] || item}
                  </button>
                ))}
              </div>
              {traditionalCards.length > 0 ? traditionalCards : <div className="card empty-state"><div style={{ color: 'var(--t2)', fontWeight: 500 }}>{t.noTraditionalMatches}</div></div>}
            </div>
          ) : null}

          {tab === 'today' ? (
            meals.length === 0 ? (
              <div className="card empty-state">
                <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--t2)' }}>{t.noMeals}</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {mealsByType.map((section) => (
                  <div key={section.type} className="card" style={{ padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{t[section.type] || section.type}</div>
                      <div style={{ fontSize: 11, color: 'var(--t3)' }}>{section.calories} {t.kcalShort}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {section.items.map((meal) => (
                        <div key={meal.id} className="metric-row">
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 500, fontSize: 13 }}>{meal.name}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <button
                              onClick={() => handleRemoveMeal(meal.id)}
                              disabled={removingMealId === meal.id}
                              className="btn btn-secondary"
                              style={{ padding: '7px 10px', fontSize: 12 }}
                              aria-label={t.remove}
                            >
                              {removingMealId === meal.id ? <span className="spinner" /> : <IconTrash size={13} />}
                            </button>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--em)' }}>{meal.calories}</div>
                              <div style={{ fontSize: 10, color: 'var(--t3)' }}>{t.kcalShort}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : null}
        </>
      )}
    </div>
  )
}




