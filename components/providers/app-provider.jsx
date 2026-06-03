'use client'


import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getTranslation } from '@/lib/translations'
import { paymentMethods, tokenPacks, tokenPlans } from '@/lib/token-plans'
import { calcGoal, pickLocalized, safeJsonParse, todayKey } from '@/lib/utils'
import { isSupabaseConfigured } from '@/lib/supabase/client'
import {
  addMeal,
  createProfile,
  createTokenPurchaseRequest,
  createTokenTransaction,
  deleteMeal,
  getMealCount,
  getMealsForDate,
  getProfile,
  getSession,
  getTokenTransactions,
  onAuthStateChange,
  signOut as dbSignOut,
  upsertWeightLog,
  updateProfile as dbUpdateProfile,
} from '@/lib/db'

const AppContext = createContext(null)
const DAILY_ALLOWANCE = 10
const NO_TOKENS_CODE = 'NO_TOKENS'

// Used to display the current payment method in a user-friendly way.
const paymentMethodLabel = (methodId, lang = 'en') => {
  const match = paymentMethods.find((item) => item.id === methodId)
  return pickLocalized(match?.name, lang) || methodId
}

const purchaseToast = (item, lang = 'en') => {
  const t = getTranslation(lang)
  const name = pickLocalized(item?.name, lang) || ''
  return item?.type === 'pack'
    ? t.purchasePackSuccess.replace('{tokens}', String(item.tokens || 0)).replace('{name}', name)
    : t.purchasePlanSuccess.replace('{name}', name)
}
const TOKEN_CACHE_PREFIX = 'trk_tokens_'
let tokenExtrasAvailable = true
let tokenSystemAvailable = true

const TOKEN_FIELD_PREFIXES = ['token_', 'active_plan_']

const isTokenField = (key = '') => TOKEN_FIELD_PREFIXES.some((prefix) => key.startsWith(prefix))

// Helps us skip unnecessary full-profile logic when only token fields changed.
const isTokenOnlyUpdate = (updates = {}) => {
  const keys = Object.keys(updates)
  return keys.length > 0 && keys.every((key) => isTokenField(key))
}

const isTokenInfraError = (error) => {
  if (!error) return false
  const message = [error.message, error.details, error.hint, error.code, error.status].filter(Boolean).join(' ').toLowerCase()
  return TOKEN_FIELD_PREFIXES.some((prefix) => message.includes(prefix))
    || message.includes('token_transactions')
    || message.includes('token_purchase_requests')
    || message.includes('profiles')
}

// If the extra token tables are missing, the app falls back gracefully instead of breaking.
const disableTokenInfrastructure = () => {
  tokenExtrasAvailable = false
  tokenSystemAvailable = false
}

const withTokenDefaults = (profile) => {
  if (!profile) return null
  return {
    ...profile,
    token_balance: profile.token_balance ?? DAILY_ALLOWANCE,
    token_daily_allowance: profile.token_daily_allowance ?? DAILY_ALLOWANCE,
    token_last_refresh: profile.token_last_refresh || new Date().toISOString().slice(0, 10),
    token_total_spent: profile.token_total_spent ?? 0,
  }
}

// Unlimited plans should not consume daily tokens while they are active.
const hasUnlimitedPlan = (profile) => {
  if (!profile?.active_plan_id || !profile?.active_plan_renews_at) return false
  return new Date(profile.active_plan_renews_at) > new Date()
}

const addPeriod = (dateString, period) => {
  const date = new Date(dateString)
  if (period === 'daily') date.setDate(date.getDate() + 1)
  if (period === 'monthly') date.setMonth(date.getMonth() + 1)
  if (period === 'yearly') date.setFullYear(date.getFullYear() + 1)
  return date.toISOString()
}

const getTokenCacheKey = (userId) => `${TOKEN_CACHE_PREFIX}${userId}`

// Small local cache keeps the app usable when auth refreshes or the network is slow.
const readTokenCache = (userId) => {
  if (typeof window === 'undefined') return null
  return safeJsonParse(window.localStorage.getItem(getTokenCacheKey(userId)), null)
}

const writeTokenCache = (userId, profile) => {
  if (typeof window === 'undefined' || !userId || !profile) return
  window.localStorage.setItem(getTokenCacheKey(userId), JSON.stringify({
    id: profile.id || userId,
    name: profile.name || null,
    email: profile.email || null,
    age: profile.age ?? null,
    weight: profile.weight ?? null,
    height: profile.height ?? null,
    gender: profile.gender || null,
    goal: profile.goal || null,
    daily_calorie_goal: profile.daily_calorie_goal ?? null,
    token_balance: profile.token_balance,
    token_daily_allowance: profile.token_daily_allowance,
    token_last_refresh: profile.token_last_refresh,
    token_total_spent: profile.token_total_spent,
    active_plan_id: profile.active_plan_id || null,
    active_plan_name: profile.active_plan_name || null,
    active_plan_period: profile.active_plan_period || null,
    active_plan_tokens: profile.active_plan_tokens || null,
    active_plan_renews_at: profile.active_plan_renews_at || null,
    active_plan_payment_method: profile.active_plan_payment_method || null,
  }))
}

const mergeProfileWithCache = (profile, cache) => {
  // The newest token refresh wins so the UI does not accidentally show an older balance.
  const normalized = withTokenDefaults(profile)
  if (!normalized) return cache ? withTokenDefaults(cache) : null
  if (!cache) return normalized

  const cachedRefresh = cache.token_last_refresh || normalized.token_last_refresh
  const profileRefresh = normalized.token_last_refresh || cachedRefresh
  const shouldUseCache = cachedRefresh >= profileRefresh

  return withTokenDefaults({
    ...normalized,
    ...(shouldUseCache ? cache : {}),
  })
}

export function AppProvider({ children }) {
  const [lang, setLang] = useState('en')
  const [dark, setDark] = useState(true)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [meals, setMeals] = useState([])
  const [mealCount, setMealCount] = useState(0)
  const [toast, setToast] = useState('')
  const [tokenTransactions, setTokenTransactions] = useState([])
  const [tokenModalOpen, setTokenModalOpen] = useState(false)

  useEffect(() => {
    // Restore saved appearance and language choices on first load.
    setLang(localStorage.getItem('trk_lang') || 'en')
    setDark(safeJsonParse(localStorage.getItem('trk_dark'), true))
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    localStorage.setItem('trk_dark', JSON.stringify(dark))
  }, [dark])

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    localStorage.setItem('trk_lang', lang)
  }, [lang])

  useEffect(() => {
    // Toasts disappear automatically so screens only need to set the message.
    if (!toast) return undefined
    const timeout = window.setTimeout(() => setToast(''), 2800)
    return () => window.clearTimeout(timeout)
  }, [toast])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return undefined
    }

    const boot = async () => {
      // Safety timeout prevents the whole app from getting stuck on loading forever.
      const timeout = window.setTimeout(() => setLoading(false), 5000)
      const { data } = await getSession()
      if (data?.session?.user) {
        await bootUser(data.session.user)
      } else {
        setLoading(false)
      }
      window.clearTimeout(timeout)
    }

    boot()

    const { data: { subscription } } = onAuthStateChange(async (event, nextSession) => {
      if (event === 'INITIAL_SESSION') return

      if (event === 'SIGNED_OUT') {
        setSession(null)
        setProfile(null)
        setMeals([])
        setMealCount(0)
        setTokenTransactions([])
        setLoading(false)
        return
      }

      if (nextSession?.user) {
        if (event === 'TOKEN_REFRESHED') {
          setSession(nextSession.user)
          if (!profile) {
            await bootUser(nextSession.user, { silent: true })
          }
          return
        }

        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          await bootUser(nextSession.user, { silent: true })
        }
      }
    })

    return () => subscription?.unsubscribe()
  }, [])

  const notify = (message) => setToast(message)
  const openTokenModal = () => setTokenModalOpen(true)
  const closeTokenModal = () => setTokenModalOpen(false)

  // Weight logs feed the progress view without forcing every profile update to know that detail.
  const saveWeightCheckIn = async (userId, weight) => {
    const numericWeight = Number(weight)
    if (!userId || !numericWeight) return
    await upsertWeightLog(userId, numericWeight)
  }

  const setProfileAndCache = (nextProfile, userId = session?.id) => {
    const normalized = withTokenDefaults(nextProfile)
    setProfile(normalized)
    if (normalized && userId) writeTokenCache(userId, normalized)
    return normalized
  }

  // Loads the recent token activity list shown in the modal and profile/dashboard cards.
  const syncTransactions = async (userId) => {
    if (!tokenExtrasAvailable) {
      setTokenTransactions([])
      return
    }

    const { data, error } = await getTokenTransactions(userId)
    if (error) {
      disableTokenInfrastructure()
      setTokenTransactions([])
      return
    }

    setTokenTransactions(data || [])
  }

  // Stores a token event after spending, refreshing, or purchasing.
  const recordTransaction = async (userId, transaction) => {
    if (!tokenExtrasAvailable) return

    const { data, error } = await createTokenTransaction(userId, transaction)
    if (error) {
      disableTokenInfrastructure()
      return
    }
    if (data) {
      setTokenTransactions((current) => [data, ...current].slice(0, 30))
    }
  }

  // Optimistic update keeps the UI feeling instant even before Supabase finishes writing.
  const syncProfileUpdate = async (userId, updates, fallbackReason) => {
    const current = profile ? { ...profile } : { id: userId }
    const optimistic = withTokenDefaults({ ...current, ...updates })
    const tokenOnly = isTokenOnlyUpdate(updates)
    setProfileAndCache(optimistic, userId)

    if (tokenOnly && !tokenSystemAvailable) {
      return { data: optimistic, error: null, skipped: true }
    }

    const { data, error } = await dbUpdateProfile(userId, updates)
    if (!error && data) {
      return { data: setProfileAndCache(data, userId), error: null }
    }

    if (tokenOnly && isTokenInfraError(error)) {
      disableTokenInfrastructure()
      return { data: optimistic, error: null, skipped: true }
    }

    if (fallbackReason) notify(fallbackReason)
    return { data: optimistic, error }
  }

  // Gives the user 10 free tokens per day and renews plans when needed.
  const refreshTokensIfNeeded = async (profileRow, userId) => {
    const today = todayKey()
    let normalized = mergeProfileWithCache(profileRow, readTokenCache(userId))
    if (!normalized) return null
    if (!tokenSystemAvailable) {
      writeTokenCache(userId, normalized)
      return normalized
    }

    if (normalized.token_last_refresh !== today) {
      normalized = { ...normalized, token_balance: normalized.token_daily_allowance || DAILY_ALLOWANCE, token_last_refresh: today }
      const { data, error } = await dbUpdateProfile(userId, {
        token_balance: normalized.token_balance,
        token_daily_allowance: normalized.token_daily_allowance || DAILY_ALLOWANCE,
        token_last_refresh: today,
      })
      if (error && isTokenInfraError(error)) {
        disableTokenInfrastructure()
        writeTokenCache(userId, normalized)
        return normalized
      }
      normalized = mergeProfileWithCache(data || normalized, normalized)
      await recordTransaction(userId, {
        change_amount: normalized.token_daily_allowance,
        balance_after: normalized.token_balance,
        reason: 'Daily token refresh',
        source_type: 'daily_refresh',
        source_label: 'Daily allowance',
      })
    }

    if (normalized.active_plan_id && normalized.active_plan_period && normalized.active_plan_renews_at) {
      let nextRenewAt = normalized.active_plan_renews_at
      let renewals = 0
      const now = new Date()

      while (new Date(nextRenewAt) <= now && renewals < 12) {
        renewals += 1
        nextRenewAt = addPeriod(nextRenewAt, normalized.active_plan_period)
      }

      if (renewals > 0) {
        normalized = { ...normalized, active_plan_renews_at: nextRenewAt }
        const { data, error } = await dbUpdateProfile(userId, {
          active_plan_renews_at: nextRenewAt,
        })
        if (error && isTokenInfraError(error)) {
          disableTokenInfrastructure()
          writeTokenCache(userId, normalized)
          return normalized
        }
        normalized = mergeProfileWithCache(data || normalized, normalized)
        await recordTransaction(userId, {
          change_amount: 0,
          balance_after: normalized.token_balance || 0,
          reason: (normalized.active_plan_name || 'Plan') + ' renewed',
          source_type: 'plan_renewal',
          source_label: normalized.active_plan_period,
        })
      }
    }

    writeTokenCache(userId, normalized)
    return normalized
  }

  // Main app boot for a signed-in user.
  const bootUser = async (user, { silent = false } = {}) => {
    if (!silent) setLoading(true)
    setSession(user)

    try {
      const [{ data: profileRow }, { count }, { data: mealRows }] = await Promise.all([
        getProfile(user.id),
        getMealCount(user.id),
        getMealsForDate(user.id),
      ])

      const nextProfile = await refreshTokensIfNeeded(profileRow || null, user.id)
      setProfileAndCache(nextProfile || null, user.id)
      setMealCount(count || 0)
      setMeals(mealRows || [])
      await syncTransactions(user.id)
    } catch {
      const cached = readTokenCache(user.id)
      setProfile(cached ? withTokenDefaults({
        id: user.id,
        name: cached.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Trackily User',
        email: cached.email || user.email,
        ...cached,
      }) : null)
      setMeals([])
      setMealCount(0)
      setTokenTransactions([])
    } finally {
      if (!silent) setLoading(false)
    }
  }

  // Called once after signup to create the user's real profile row.
  const completeOnboarding = async (payload) => {
    if (!session) return { error: true }
    const profilePayload = {
      name: payload.name || session.user_metadata?.full_name || session.email?.split('@')[0] || 'Trackily User',
      email: session.email,
      age: Number(payload.age),
      weight: Number(payload.weight),
      height: Number(payload.height),
      gender: payload.gender,
      goal: payload.goal,
      daily_calorie_goal: calcGoal(payload),
      token_balance: DAILY_ALLOWANCE,
      token_daily_allowance: DAILY_ALLOWANCE,
      token_last_refresh: new Date().toISOString().slice(0, 10),
      token_total_spent: 0,
    }

    const { data, error } = await createProfile(session.id, profilePayload)
    if (!error && data) {
      const normalized = setProfileAndCache(data, session.id)
      await saveWeightCheckIn(session.id, normalized.weight)
      notify(getTranslation(lang).profileSaved)
      await recordTransaction(session.id, {
        change_amount: DAILY_ALLOWANCE,
        balance_after: normalized.token_balance,
        reason: 'Welcome daily token allowance',
        source_type: 'daily_refresh',
        source_label: 'Onboarding',
      })
      return { data: normalized, error: null }
    }

    const normalized = setProfileAndCache(profilePayload, session.id)
    notify(error?.message || 'Unable to save your profile right now.')
    return { data: normalized, error }
  }

  // Normal profile editing path from the profile screen.
  const saveProfile = async (updates) => {
    if (!session) return { error: true }
    const withGoal = { ...updates, daily_calorie_goal: calcGoal(updates) }
    const { data, error } = await syncProfileUpdate(session.id, withGoal)
    if (!error && data) {
      await saveWeightCheckIn(session.id, data.weight)
      notify(getTranslation(lang).profileSaved)
    }
    return { data, error }
  }

  // Tokens are consumed by features like AI usage, meal logging, and workout saving.
  const spendToken = async (reason = 'usage') => {
    if (!session) return { error: true }
    if (!profile) return { data: null, error: null, skipped: true }
    if (!tokenSystemAvailable) return { data: profile, error: null, skipped: true }
    if (hasUnlimitedPlan(profile)) return { data: profile, error: null, skipped: true }

    const current = withTokenDefaults(profile)
    if ((current.token_balance || 0) <= 0) {
      openTokenModal()
      const strings = getTranslation(lang)
      notify(strings.noTokensLeft)
      return { error: { code: NO_TOKENS_CODE, message: strings.noTokensLeft } }
    }

    const updates = {
      token_balance: current.token_balance - 1,
      token_total_spent: (current.token_total_spent || 0) + 1,
      token_last_refresh: current.token_last_refresh,
    }
    const { data, error, skipped } = await syncProfileUpdate(session.id, updates)
    if (!skipped) {
      await recordTransaction(session.id, {
        change_amount: -1,
        balance_after: data?.token_balance ?? updates.token_balance,
        reason: `Token spent on ${reason}`,
        source_type: 'usage',
        source_label: reason,
      })
      if ((data?.token_balance ?? updates.token_balance) === 0) openTokenModal()
    }
    return { data, error }
  }

  // Handles both one-time token packs and recurring plans.
  const purchaseTokens = async (pack, paymentMethod, paymentDetails = {}) => {
    if (!session || !profile) return { error: true }
    const current = withTokenDefaults(profile)
    const updates = {
      token_balance: pack.type === 'pack' ? (current.token_balance || 0) + pack.tokens : current.token_balance || 0,
      token_last_refresh: current.token_last_refresh,
    }

    if (pack.type === 'plan') {
      updates.active_plan_id = pack.id
      updates.active_plan_name = typeof pack.name === 'object' ? pack.name.en : pack.name
      updates.active_plan_period = pack.billingPeriod
      updates.active_plan_tokens = pack.tokens
      updates.active_plan_payment_method = paymentMethod
      updates.active_plan_renews_at = addPeriod(new Date().toISOString(), pack.billingPeriod)
    }

    setProfileAndCache({ ...current, ...updates }, session.id)

    const { data: requestRow, error: requestError } = await createTokenPurchaseRequest(session.id, { ...pack, paymentMethod, paymentDetails })
    if (requestError) {
      disableTokenInfrastructure()
    }
    const { data: updatedProfile, error: profileError } = await dbUpdateProfile(session.id, updates)
    if (!profileError && updatedProfile) {
      setProfileAndCache(updatedProfile, session.id)
    }

    await recordTransaction(session.id, {
      change_amount: pack.type === 'pack' ? pack.tokens : 0,
      balance_after: updatedProfile?.token_balance ?? updates.token_balance,
      reason: pack.type === 'pack' ? ((typeof pack.name === 'object' ? pack.name.en : pack.name) + ' purchased') : ((typeof pack.name === 'object' ? pack.name.en : pack.name) + ' activated'),
      source_type: 'purchase',
      source_label: paymentMethodLabel(paymentMethod, 'en'),
    })
    notify(purchaseToast(pack, lang))
    closeTokenModal()
    return { data: requestRow || updatedProfile || null, error: requestError || profileError || null }
  }

  // Adds a meal optimistically so the user sees it instantly, then syncs with the database.
  const logMeal = async (meal) => {
    if (!session) return { error: true }
    const tokenResult = await spendToken('meal log')
    const shouldBlockLogging = tokenResult?.error?.code === NO_TOKENS_CODE
    if (shouldBlockLogging) return tokenResult

    const tempId = `temp-meal-${Date.now()}`
    const currentDay = todayKey()
    const optimisticMeal = {
      id: tempId,
      user_id: session.id,
      name: meal.name,
      calories: meal.calories,
      protein: meal.protein || 0,
      carbs: meal.carbs || 0,
      fat: meal.fat || 0,
      meal_type: meal.type || 'lunch',
      log_date: currentDay,
      created_at: new Date().toISOString(),
    }

    setMeals((current) => [...current, optimisticMeal])
    setMealCount((current) => current + 1)

    const { data, error } = await addMeal(session.id, meal)
    if (!error && data) {
      const [{ data: mealRows }, { count }] = await Promise.all([
        getMealsForDate(session.id, currentDay),
        getMealCount(session.id),
      ])

      if (mealRows) {
        setMeals(mealRows)
      } else {
        setMeals((current) => current.map((item) => item.id === tempId ? data : item))
      }

      if (typeof count === 'number') {
        setMealCount(count)
      }

      notify(getTranslation(lang).mealLogged)
      return { data, error: null }
    }

    setMeals((current) => current.filter((item) => item.id !== tempId))
    setMealCount((current) => Math.max(0, current - 1))
    notify(error?.message || getTranslation(lang).unableToLogMeal)
    return { data, error }
  }

  // Removes the meal from the UI first, then restores it if the delete fails.
  const removeMeal = async (mealId) => {
    if (!session || !mealId) return { error: true }

    const currentMeals = meals
    const targetMeal = currentMeals.find((item) => item.id === mealId)
    if (!targetMeal) return { data: null, error: null, skipped: true }

    setMeals((current) => current.filter((item) => item.id !== mealId))
    setMealCount((current) => Math.max(0, current - 1))

    const { error } = await deleteMeal(session.id, mealId)
    if (!error) {
      notify(getTranslation(lang).mealRemoved)
      return { data: targetMeal, error: null }
    }

    setMeals(currentMeals)
    setMealCount(currentMeals.length)
    notify(error?.message || getTranslation(lang).unableToRemoveMeal)
    return { data: null, error }
  }

  // Clears local app state after signing out.
  const logout = async () => {
    await dbSignOut()
    setSession(null)
    setProfile(null)
    setMeals([])
    setMealCount(0)
    setTokenTransactions([])
    setLoading(false)
  }

  const value = useMemo(() => ({
    lang,
    setLang,
    dark,
    setDark,
    t: getTranslation(lang),
    loading,
    session,
    profile,
    setProfile: setProfileAndCache,
    meals,
    mealCount,
    toast,
    notify,
    isSupabaseConfigured,
    tokenPacks,
    tokenPlans,
    tokenTransactions,
    tokenModalOpen,
    openTokenModal,
    closeTokenModal,
    completeOnboarding,
      saveProfile,
      spendToken,
      purchaseTokens,
      logMeal,
      removeMeal,
      logout,
  }), [lang, dark, loading, session, profile, meals, mealCount, toast, tokenModalOpen, tokenTransactions])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}







