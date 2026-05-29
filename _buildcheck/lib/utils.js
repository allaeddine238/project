export const calcBMR = (profile) =>
  profile.gender === 'male'
    ? 10 * Number(profile.weight) + 6.25 * Number(profile.height) - 5 * Number(profile.age) + 5
    : 10 * Number(profile.weight) + 6.25 * Number(profile.height) - 5 * Number(profile.age) - 161

export const calcGoal = (profile) => {
  const maintenance = calcBMR(profile) * 1.55
  if (profile.goal === 'lose') return Math.round(maintenance - 500)
  if (profile.goal === 'gain') return Math.round(maintenance + 300)
  return Math.round(maintenance)
}

export const todayKey = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const formatDate = (value, locale = 'en-US') =>
  new Date(value).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })

export const greetingKey = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'goodMorning'
  if (hour < 18) return 'goodAfternoon'
  return 'goodEvening'
}

export const safeJsonParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

export const pickLocalized = (value, lang = 'en') => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value
  return value[lang] || value.en || Object.values(value)[0] || ''
}

export const clampNumber = (value, min = 0) => {
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return min
  return Math.max(min, numeric)
}

export const cn = (...items) => items.filter(Boolean).join(' ')
