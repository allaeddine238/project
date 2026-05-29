'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useApp } from '@/components/providers/app-provider'
import { ChartTooltip, MacroPill, Ring } from '@/components/ui/shared'
import { getMealsForRange } from '@/lib/db'
import { buildWeeklyMealSeries } from '@/lib/progress-data'
import { billingPeriods, tokenPlans } from '@/lib/token-plans'
import { greetingKey, pickLocalized } from '@/lib/utils'
import { IconCoin, IconDumbbell, IconFlame, IconWheat, IconOil, IconTrash } from '@/components/ui/icons'

const mealTypeOptions = ['breakfast', 'lunch', 'dinner', 'snack']

const formatPlanRate = (profile, lang, t) => {
  if (!profile?.active_plan_period) return t.noActivePlan
  return `\u221E / ${pickLocalized(billingPeriods[profile.active_plan_period], lang) || profile.active_plan_period}`
}

const getActivePlanName = (profile, lang) => {
  const plan = tokenPlans.find((item) => item.id === profile?.active_plan_id)
  return plan ? pickLocalized(plan.name, lang) : (profile?.active_plan_name || '')
}

export function DashboardScreen() {
  const { t, lang, profile, meals, session, isSupabaseConfigured, openTokenModal, removeMeal } = useApp()
  const [historyMeals, setHistoryMeals] = useState([])
  const [removingMealId, setRemovingMealId] = useState('')

  useEffect(() => {
    if (!session?.id || !isSupabaseConfigured) {
      setHistoryMeals([])
      return undefined
    }

    const formatKey = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const endDate = new Date()
    endDate.setDate(endDate.getDate() - 1)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 6)

    const loadHistory = async () => {
      const { data } = await getMealsForRange(session.id, formatKey(startDate), formatKey(endDate))
      setHistoryMeals(data || [])
    }

    loadHistory()
    return undefined
  }, [session?.id, isSupabaseConfigured])

  const totals = meals.reduce((accumulator, meal) => ({
    calories: accumulator.calories + Number(meal.calories || 0),
    protein: accumulator.protein + Number(meal.protein || 0),
    carbs: accumulator.carbs + Number(meal.carbs || 0),
    fat: accumulator.fat + Number(meal.fat || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 })

  const remaining = Math.max((profile?.daily_calorie_goal || 0) - totals.calories, 0)
  const percent = Math.min((totals.calories / (profile?.daily_calorie_goal || 1)) * 100, 100)
  const macroGoals = {
    protein: Math.round(Number(profile?.weight || 0) * 1.6),
    carbs: Math.round((Number(profile?.daily_calorie_goal || 0) * 0.45) / 4),
    fat: Math.round((Number(profile?.daily_calorie_goal || 0) * 0.25) / 9),
  }
  const mealsByType = mealTypeOptions
    .map((type) => {
      const items = meals.filter((meal) => (meal.meal_type || 'lunch') === type)
      const calories = items.reduce((total, meal) => total + Number(meal.calories || 0), 0)
      return { type, items, calories }
    })
    .filter((section) => section.items.length > 0)
  const locale = lang === 'fr' ? 'fr-FR' : lang === 'ar' ? 'ar-DZ' : 'en-US'
  const weeklyChartData = useMemo(
    () => buildWeeklyMealSeries([...historyMeals, ...meals], { locale, goal: profile?.daily_calorie_goal, includeEmpty: true }),
    [historyMeals, meals, locale, profile?.daily_calorie_goal],
  )

  const handleRemoveMeal = async (mealId) => {
    setRemovingMealId(mealId)
    await removeMeal(mealId)
    setRemovingMealId('')
  }

  return (
    <div className="page-content page-fade">
      <div className="dashboard-hero" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14 }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--t2)', fontWeight: 500 }}>{t[greetingKey()]}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, letterSpacing: '-.02em', marginTop: 2 }}>{profile?.name}</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 4 }}>{t.dashboardSubtitle}</div>
        </div>
        <div className="badge badge-amber"><IconFlame size={12} /> {t.dayStreak}</div>
      </div>

      <div className="grid-2">
        <button onClick={openTokenModal} className="card" style={{ textAlign: 'left', padding: 14, background: 'rgba(255,173,53,.06)', borderColor: 'rgba(255,173,53,.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--t2)', fontWeight: 600 }}>{t.tokenBalance}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'var(--am)', marginTop: 3 }}>{profile?.token_balance ?? 0}</div>
            </div>
            <IconCoin size={18} color="var(--am)" />
          </div>
          <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 8 }}>{t.dailyAllowance}: {profile?.token_daily_allowance ?? 10}</div>
        </button>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--t2)', fontWeight: 600 }}>{t.activePlan}</div>
          <div style={{ fontWeight: 700, fontSize: 15, marginTop: 4 }}>{getActivePlanName(profile, lang) || t.noActivePlan}</div>
          <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 8 }}>{profile?.active_plan_id ? formatPlanRate(profile, lang, t) : t.buyTokens}</div>
          <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4 }}>{profile?.active_plan_renews_at ? `${t.renewsOn}: ${new Date(profile.active_plan_renews_at).toLocaleDateString()}` : null}</div>
        </div>
      </div>

      <div className="card" style={{ background: 'linear-gradient(135deg,rgba(0,223,160,.04),rgba(0,223,160,.01))', border: '1px solid rgba(0,223,160,.18)' }}>
        <div className="dashboard-goal-card" style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <Ring value={totals.calories} max={profile.daily_calorie_goal} size={120} stroke={9} color={totals.calories > profile.daily_calorie_goal ? 'var(--ro)' : percent > 85 ? 'var(--am)' : 'var(--em)'}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 21, fontWeight: 800 }}>{totals.calories}</div>
              <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 1 }}>kcal</div>
            </div>
          </Ring>
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--t2)', fontWeight: 500 }}>{t.dailyGoal}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--em)' }}>{profile.daily_calorie_goal} kcal</div>
            </div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--t3)' }}>{t.consumed}</div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{totals.calories}</div>
              </div>
              <div style={{ width: 1, background: 'var(--b)' }} />
              <div>
                <div style={{ fontSize: 10, color: 'var(--t3)' }}>{t.remaining}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: remaining > 0 ? 'var(--em)' : 'var(--ro)' }}>{remaining}</div>
              </div>
            </div>
            <div className="progress-track" style={{ height: 4 }}>
              <div className="progress-fill" style={{ width: `${percent}%`, background: 'var(--em)' }} />
            </div>
            <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 4 }}>{t.percentOfGoal.replace('{value}', Math.round(percent))}</div>
          </div>
        </div>
      </div>

      <div>
        <div className="section-title" style={{ marginBottom: 8 }}>{t.macros}</div>
        <div className="macro-pill-row" style={{ display: 'flex', gap: 8 }}>
          <MacroPill label={t.protein} value={Math.round(totals.protein)} goal={macroGoals.protein} color="var(--bl)" icon={<IconDumbbell size={12} color="var(--bl)" />} />
          <MacroPill label={t.carbs} value={Math.round(totals.carbs)} goal={macroGoals.carbs} color="var(--am)" icon={<IconWheat size={12} color="var(--am)" />} />
          <MacroPill label={t.fat} value={Math.round(totals.fat)} goal={macroGoals.fat} color="var(--ro)" icon={<IconOil size={12} color="var(--ro)" />} />
        </div>
      </div>

      <div className="grid-2">
        {[
          ['/meals', t.addMeal, 'var(--em)'],
          ['/workouts', t.workoutBuilder, 'var(--am)'],
          ['/ai-coach', t.aiCoach, 'var(--ro)'],
        ].map(([href, label, color]) => (
          <Link key={href} href={href} className="card" style={{ padding: 14, borderColor: `${color}35`, background: `${color}08` }}>
            <div style={{ fontWeight: 600, fontSize: 13, color }}>{label}</div>
          </Link>
        ))}
      </div>

      <div className="card dashboard-chart-card">
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
          <IconFlame size={15} color="var(--am)" /> {t.thisWeek}
        </div>
        <div className="dashboard-chart-frame">
          <ResponsiveContainer width="100%" height={110}>
            <BarChart data={weeklyChartData} margin={{ top: 0, right: 0, bottom: 0, left: -24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: 'var(--t3)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--t3)', fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="calories" fill="var(--em)" radius={[4, 4, 0, 0]} opacity={0.85} name="calories" />
              <Bar dataKey="goal" fill="rgba(255,173,53,.15)" radius={[4, 4, 0, 0]} name="goal" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div className="section-title">{t.todayMeals}</div>
          <Link href="/meals" className="btn btn-primary" style={{ padding: '7px 13px', fontSize: 12 }}>{t.addMeal}</Link>
        </div>
        {meals.length === 0 ? (
          <div className="card empty-state">
            <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--t2)' }}>{t.noMeals}</div>
            <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 4 }}>{t.browseMeals}</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {mealsByType.map((section) => (
              <div key={section.type} className="card" style={{ padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{t[section.type] || section.type}</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)' }}>{section.calories} kcal</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {section.items.map((meal) => (
                    <div key={meal.id} className="metric-row fade-up">
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{meal.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{`P:${Math.round(meal.protein || 0)}g · C:${Math.round(meal.carbs || 0)}g · F:${Math.round(meal.fat || 0)}g`}</div>
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
                          <div style={{ fontSize: 10, color: 'var(--t3)' }}>kcal</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}



