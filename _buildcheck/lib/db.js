import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import { todayKey } from '@/lib/utils'

const safe = async (fn, fallback = { data: null, error: { message: 'Supabase not configured' } }) => {
  if (!isSupabaseConfigured || !supabase) return fallback
  try {
    return await fn()
  } catch (error) {
    return { data: null, error }
  }
}

export const getSession = async () => {
  if (!isSupabaseConfigured || !supabase) return { data: { session: null } }
  try {
    return await supabase.auth.getSession()
  } catch {
    return { data: { session: null } }
  }
}

export const onAuthStateChange = (callback) => {
  if (!isSupabaseConfigured || !supabase) {
    return { data: { subscription: { unsubscribe: () => {} } } }
  }
  return supabase.auth.onAuthStateChange(callback)
}

export const signUp = (email, password, name) =>
  safe(() => supabase.auth.signUp({ email, password, options: { data: { full_name: name || '' } } }))

export const signIn = (email, password) => safe(() => supabase.auth.signInWithPassword({ email, password }))
export const signOut = () => safe(() => supabase.auth.signOut())
export const sendPasswordReset = (email, redirectTo) => safe(() => supabase.auth.resetPasswordForEmail(email, { redirectTo }))
export const updateUserPassword = (password) => safe(() => supabase.auth.updateUser({ password }))

export const getProfile = (userId) => safe(() => supabase.from('profiles').select('*').eq('id', userId).maybeSingle())
export const createProfile = (userId, profile) => safe(() => supabase.from('profiles').upsert({ id: userId, ...profile }, { onConflict: 'id' }).select().single())
export const updateProfile = (userId, updates) => safe(() => supabase.from('profiles').update(updates).eq('id', userId).select().single())

export const getMealsForDate = (userId, date = todayKey()) => safe(() => supabase.from('meals').select('*').eq('user_id', userId).eq('log_date', date).order('created_at', { ascending: true }))
export const getMealsForRange = (userId, startDate, endDate) => safe(() => supabase.from('meals').select('*').eq('user_id', userId).gte('log_date', startDate).lte('log_date', endDate).order('log_date', { ascending: true }).order('created_at', { ascending: true }))
export const addMeal = (userId, meal) => safe(() => supabase.from('meals').insert({ user_id: userId, name: meal.name, calories: meal.calories, protein: meal.protein || 0, carbs: meal.carbs || 0, fat: meal.fat || 0, meal_type: meal.type || 'lunch', log_date: todayKey() }).select().single())
export const deleteMeal = (userId, mealId) => safe(() => supabase.from('meals').delete().eq('user_id', userId).eq('id', mealId))
export const getMealCount = (userId) => safe(() => supabase.from('meals').select('*', { count: 'exact', head: true }).eq('user_id', userId))
export const getWeightLogsForRange = (userId, startDate, endDate) => safe(() => supabase.from('weight_logs').select('*').eq('user_id', userId).gte('log_date', startDate).lte('log_date', endDate).order('log_date', { ascending: true }))
export const upsertWeightLog = (userId, weight, date = todayKey()) => safe(() => supabase.from('weight_logs').upsert({ user_id: userId, weight, log_date: date }, { onConflict: 'user_id,log_date' }).select().single())

export const getConversations = (userId) => safe(() => supabase.from('conversations').select('*').eq('user_id', userId).order('created_at', { ascending: false }))
export const createConversation = (userId, title = 'New Chat') => safe(() => supabase.from('conversations').insert({ user_id: userId, title }).select().single())
export const updateConversationTitle = (conversationId, title) => safe(() => supabase.from('conversations').update({ title }).eq('id', conversationId))
export const deleteConversation = (conversationId) => safe(() => supabase.from('conversations').delete().eq('id', conversationId))
export const getMessages = (conversationId) => safe(() => supabase.from('messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true }))
export const addMessage = (conversationId, role, content) => safe(() => supabase.from('messages').insert({ conversation_id: conversationId, role, content }).select().single())

export const getUserWorkouts = (userId) => safe(() => supabase.from('user_workouts').select('*').eq('user_id', userId).order('created_at', { ascending: false }))
export const createUserWorkout = (userId, workout) => safe(() => supabase.from('user_workouts').insert({ user_id: userId, name: workout.name, muscle_group: workout.muscleGroup, location: workout.location, notes: workout.notes || '', items: workout.items }).select().single())
export const updateUserWorkout = (workoutId, workout) => safe(() => supabase.from('user_workouts').update({ name: workout.name, muscle_group: workout.muscleGroup, location: workout.location, notes: workout.notes || '', items: workout.items }).eq('id', workoutId).select().single())
export const deleteUserWorkout = (workoutId) => safe(() => supabase.from('user_workouts').delete().eq('id', workoutId))

export const getTokenTransactions = (userId) => safe(() => supabase.from('token_transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(30))
export const createTokenTransaction = (userId, transaction) => safe(() => supabase.from('token_transactions').insert({ user_id: userId, ...transaction }).select().single())

export const createTokenPurchaseRequest = (userId, request) => safe(() => supabase.from('token_purchase_requests').insert({
  user_id: userId,
  purchase_type: request.type,
  package_id: request.id,
  package_name: request.name,
  billing_period: request.billingPeriod || null,
  tokens: request.tokens,
  price_dzd: request.priceDzd,
  price_usd: request.priceUsd,
  payment_method: request.paymentMethod,
  status: 'approved',
}).select().single())

