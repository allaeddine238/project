const getDateKey = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getRecentDateKeys = (days = 7) => {
  const today = new Date()
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (days - index - 1))
    return getDateKey(date)
  })
}

const labelForDateKey = (dateKey, locale = 'en-US') =>
  new Date(`${dateKey}T12:00:00`).toLocaleDateString(locale, { weekday: 'short' })

const buildDailyTotalsMap = (meals = []) => meals.reduce((accumulator, meal) => {
  const key = meal.log_date
  if (!key) return accumulator

  const current = accumulator[key] || { calories: 0, protein: 0, carbs: 0, fat: 0 }
  accumulator[key] = {
    calories: current.calories + Number(meal.calories || 0),
    protein: current.protein + Number(meal.protein || 0),
    carbs: current.carbs + Number(meal.carbs || 0),
    fat: current.fat + Number(meal.fat || 0),
  }
  return accumulator
}, {})

export const buildWeeklyMealSeries = (meals = [], { days = 7, locale = 'en-US', goal = 0, includeEmpty = false } = {}) => {
  const totalsByDay = buildDailyTotalsMap(meals)

  return getRecentDateKeys(days)
    .map((dateKey) => {
      const totals = totalsByDay[dateKey] || { calories: 0, protein: 0, carbs: 0, fat: 0 }
      return {
        dateKey,
        day: labelForDateKey(dateKey, locale),
        goal: Number(goal) || 0,
        ...totals,
      }
    })
    .filter((item) => includeEmpty || item.calories > 0)
}

export const countRecentLoggingStreak = (meals = [], days = 7) => {
  const series = buildWeeklyMealSeries(meals, { days, includeEmpty: true })
  let streak = 0

  for (let index = series.length - 1; index >= 0; index -= 1) {
    if (series[index].calories > 0) streak += 1
    else break
  }

  return streak
}

export const countGoalHitDays = (meals = [], goal, days = 7) => {
  const numericGoal = Number(goal || 0)
  if (!numericGoal) return 0

  const lowerBound = numericGoal * 0.9
  const upperBound = numericGoal * 1.1
  return buildWeeklyMealSeries(meals, { days, includeEmpty: true })
    .filter((item) => item.calories >= lowerBound && item.calories <= upperBound)
    .length
}

export const averageLoggedCalories = (meals = [], days = 7) => {
  const loggedDays = buildWeeklyMealSeries(meals, { days, includeEmpty: true })
    .filter((item) => item.calories > 0)

  if (loggedDays.length === 0) return 0

  const total = loggedDays.reduce((sum, item) => sum + item.calories, 0)
  return Math.round(total / loggedDays.length)
}

export const buildWeightSeries = (weightLogs = [], { days = 7, locale = 'en-US' } = {}) => {
  const logsByDay = weightLogs.reduce((accumulator, item) => {
    if (item?.log_date) accumulator[item.log_date] = Number(item.weight)
    return accumulator
  }, {})

  return getRecentDateKeys(days).map((dateKey) => ({
    dateKey,
    day: labelForDateKey(dateKey, locale),
    weight: Number.isFinite(logsByDay[dateKey]) ? logsByDay[dateKey] : null,
  }))
}

const getStartOfWeek = (date) => {
  const next = new Date(date)
  const day = next.getDay()
  const diff = day === 0 ? -6 : 1 - day
  next.setDate(next.getDate() + diff)
  next.setHours(0, 0, 0, 0)
  return next
}

const getRecentWeekKeys = (weeks = 7) => {
  const currentWeek = getStartOfWeek(new Date())
  return Array.from({ length: weeks }, (_, index) => {
    const date = new Date(currentWeek)
    date.setDate(currentWeek.getDate() - ((weeks - index - 1) * 7))
    return getDateKey(date)
  })
}

const labelForWeekKey = (dateKey, locale = 'en-US') =>
  new Date(`${dateKey}T12:00:00`).toLocaleDateString(locale, { month: 'short', day: 'numeric' })

export const buildWeeklyWeightSeries = (weightLogs = [], { weeks = 7, locale = 'en-US' } = {}) => {
  const latestWeightByWeek = weightLogs.reduce((accumulator, item) => {
    if (!item?.log_date) return accumulator

    const weekKey = getDateKey(getStartOfWeek(new Date(`${item.log_date}T12:00:00`)))
    const current = accumulator[weekKey]
    if (!current || item.log_date >= current.log_date) {
      accumulator[weekKey] = {
        log_date: item.log_date,
        weight: Number(item.weight),
      }
    }
    return accumulator
  }, {})

  return getRecentWeekKeys(weeks).map((weekKey) => ({
    weekKey,
    day: labelForWeekKey(weekKey, locale),
    weight: Number.isFinite(latestWeightByWeek[weekKey]?.weight) ? latestWeightByWeek[weekKey].weight : null,
  }))
}
