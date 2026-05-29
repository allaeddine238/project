'use client'

import { useEffect, useMemo, useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useApp } from '@/components/providers/app-provider'
import { getMealsForRange, getWeightLogsForRange } from '@/lib/db'
import { averageLoggedCalories, buildWeeklyMealSeries, buildWeeklyWeightSeries, countGoalHitDays, countRecentLoggingStreak } from '@/lib/progress-data'
import { ChartTooltip } from '@/components/ui/shared'
import { IconBarChart, IconFlame, IconTarget, IconTrophy } from '@/components/ui/icons'

export function ProgressScreen() {
  const { t, lang, meals, profile, session, isSupabaseConfigured } = useApp()
  const [historyMeals, setHistoryMeals] = useState([])
  const [weightLogs, setWeightLogs] = useState([])

  useEffect(() => {
    if (!session?.id || !isSupabaseConfigured) {
      setHistoryMeals([])
      setWeightLogs([])
      return undefined
    }

    const formatKey = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const mealEndDate = new Date()
    mealEndDate.setDate(mealEndDate.getDate() - 1)
    const mealStartDate = new Date()
    mealStartDate.setDate(mealStartDate.getDate() - 6)
    const weightEndDate = new Date()
    const weightStartDate = new Date()
    weightStartDate.setDate(weightStartDate.getDate() - 48)

    const loadHistory = async () => {
      const [{ data: mealData }, { data: weightData }] = await Promise.all([
        getMealsForRange(session.id, formatKey(mealStartDate), formatKey(mealEndDate)),
        getWeightLogsForRange(session.id, formatKey(weightStartDate), formatKey(weightEndDate)),
      ])
      setHistoryMeals(mealData || [])
      setWeightLogs(weightData || [])
    }

    loadHistory()
    return undefined
  }, [session?.id, isSupabaseConfigured])

  const locale = lang === 'fr' ? 'fr-FR' : lang === 'ar' ? 'ar-DZ' : 'en-US'
  const weeklyMeals = useMemo(() => [...historyMeals, ...meals], [historyMeals, meals])
  const weeklyChartData = useMemo(
    () => buildWeeklyMealSeries(weeklyMeals, { locale, goal: profile?.daily_calorie_goal, includeEmpty: true }),
    [weeklyMeals, locale, profile?.daily_calorie_goal],
  )
  const weightChartData = useMemo(() => buildWeeklyWeightSeries(weightLogs, { locale }), [weightLogs, locale])
  const hasWeightData = useMemo(() => weightChartData.some((item) => item.weight !== null), [weightChartData])
  const streakCount = useMemo(() => countRecentLoggingStreak(weeklyMeals), [weeklyMeals])
  const goalsHitCount = useMemo(() => countGoalHitDays(weeklyMeals, profile?.daily_calorie_goal), [weeklyMeals, profile?.daily_calorie_goal])
  const averageCalories = useMemo(() => averageLoggedCalories(weeklyMeals), [weeklyMeals])

  return (
    <div className="page-content page-fade">
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>{t.progress}</div>
        <div style={{ fontSize: 12, color: 'var(--t2)', marginTop: 3 }}>{t.healthJourney}</div>
      </div>

      <div className="grid-3">
        {[
          [IconFlame, String(streakCount), t.days, t.streak, 'var(--am)'],
          [IconTarget, profile?.daily_calorie_goal ? `${goalsHitCount}/7` : '--', '', t.goalsHit, 'var(--em)'],
          [IconBarChart, averageCalories ? String(averageCalories) : '--', averageCalories ? 'kcal' : '', t.avgCalories, 'var(--bl)'],
        ].map(([Icon, value, unit, label, color]) => (
          <div key={label} className="card" style={{ textAlign: 'center', padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}><Icon size={18} color={color} /></div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color }}>{value}</div>
            <div style={{ fontSize: 9, color: 'var(--t3)' }}>{unit}</div>
            <div style={{ fontSize: 10, color: 'var(--t2)', marginTop: 3, fontWeight: 500 }}>{label}</div>
          </div>
        ))}
      </div>

      <div className="card dashboard-chart-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{t.weightProgress}</div>
          {hasWeightData && profile?.weight ? <span className="badge badge-green">{profile.weight} kg</span> : null}
        </div>
        {hasWeightData ? (
          <div className="dashboard-chart-frame">
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={weightChartData} margin={{ top: 0, right: 0, bottom: 0, left: -34 }}>
                <defs>
                  <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00dfa0" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#00dfa0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: 'var(--t3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--t3)', fontSize: 9 }} axisLine={false} tickLine={false} domain={['dataMin-1', 'dataMax+1']} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="weight" stroke="var(--em)" strokeWidth={2} fill="url(#weightGradient)" dot={{ r: 3, fill: 'var(--em)', strokeWidth: 0 }} connectNulls={false} name="weight" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="empty-state" style={{ padding: 18 }}>
            <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--t2)' }}>{t.weightHistoryUnavailable}</div>
            <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 4 }}>{t.weightHistoryHint}</div>
          </div>
        )}
      </div>

      <div className="card dashboard-chart-card">
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 14 }}>{t.calorieHistory}</div>
        <div className="dashboard-chart-frame">
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={weeklyChartData} margin={{ top: 0, right: 0, bottom: 0, left: -24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.04)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: 'var(--t3)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--t3)', fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="calories" fill="var(--am)" radius={[4, 4, 0, 0]} opacity={0.9} name="calories" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}><IconTrophy size={15} color="var(--am)" /> {t.achievements}</div>
        {[
          [IconFlame, t.streakTitle, t.streakDesc, true],
          [IconTarget, t.proteinGoalTitle, t.proteinGoalDesc, true],
          [IconTrophy, t.goalCrusherTitle, t.goalCrusherDesc, false],
        ].map(([Icon, title, description, earned]) => (
          <div key={title} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', borderRadius: 10, background: 'var(--card2)', border: `1px solid ${earned ? 'rgba(255,173,53,.2)' : 'var(--b)'}`, marginBottom: 8, opacity: earned ? 1 : 0.42 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: earned ? 'rgba(255,173,53,.1)' : 'var(--card)', border: `1px solid ${earned ? 'rgba(255,173,53,.22)' : 'var(--b)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={16} color={earned ? 'var(--am)' : 'var(--t3)'} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{title}</div>
              <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{description}</div>
            </div>
            {earned ? <span className="badge badge-amber">{t.earned}</span> : null}
          </div>
        ))}
      </div>
    </div>
  )
}
