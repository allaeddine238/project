import { createGroqChatCompletion, hasGroqConfig } from '@/lib/ai-provider'

const ARABIC_REGEX = /[\u0600-\u06FF]/

const FOOD_DB = {
  egg: {
    label: 'egg',
    aliases: ['egg', 'eggs', 'بيض', 'بيضة'],
    servingLabel: '1 large egg',
    servingCalories: 78,
    servingProtein: 6.3,
    notes: 'Eggs are convenient and filling, but they include more fat than very lean meat.',
  },
  chicken: {
    label: 'chicken breast',
    aliases: ['chicken', 'chicken breast', 'دجاج', 'صدر دجاج'],
    servingLabel: '100g cooked chicken breast',
    servingCalories: 165,
    servingProtein: 31,
    notes: 'Chicken breast is one of the easiest high-protein lower-fat foods for meals.',
  },
  rice: {
    label: 'cooked rice',
    aliases: ['rice', 'رز', 'أرز'],
    servingLabel: '100g cooked rice',
    servingCalories: 130,
    servingProtein: 2.7,
    notes: 'Rice is an easy carb source around training.',
  },
  greek_yogurt: {
    label: 'greek yogurt',
    aliases: ['greek yogurt', 'yogurt', 'yoghurt', 'زبادي', 'يوغورت'],
    servingLabel: '100g Greek yogurt',
    servingCalories: 59,
    servingProtein: 10,
    notes: 'Greek yogurt is a useful snack protein source.',
  },
}

function normalize(text = '') {
  return text.toLowerCase().trim()
}

function list(items) {
  return items.join('\n')
}

function isArabicText(text = '') {
  return ARABIC_REGEX.test(text)
}

function detectReplyLanguage(message = '', history = []) {
  if (isArabicText(message)) return 'ar'
  return history.some((item) => item?.role === 'user' && isArabicText(item?.content || '')) ? 'ar' : 'en'
}

function introName(profile, lang = 'en') {
  if (!profile?.name) return ''
  return lang === 'ar' ? `مرحبا ${profile.name}. ` : `Hi ${profile.name}. `
}

function extractRecentUserMessages(history = []) {
  return history
    .filter((item) => item?.role === 'user')
    .map((item) => normalize(item.content))
    .slice(-4)
}

function extractRecentUserContext(history = []) {
  return extractRecentUserMessages(history).join(' | ')
}

function inferGoal(text, profileGoal) {
  if (text.includes('muscle gain') || text.includes('build muscle') || text.includes('gain muscle') || text.includes('bulk')) return 'muscle gain'
  if (text.includes('fat loss') || text.includes('lose weight') || text.includes('weight loss') || text.includes('cut')) return 'fat loss'
  if (profileGoal === 'gain') return 'muscle gain'
  if (profileGoal === 'lose') return 'fat loss'
  return 'maintenance'
}

function detectDays(text) {
  const patterns = [
    ['1-day', 1], ['2-day', 2], ['3-day', 3], ['4-day', 4], ['5-day', 5], ['6-day', 6],
    ['1 day', 1], ['2 day', 2], ['3 day', 3], ['4 day', 4], ['5 day', 5], ['6 day', 6],
    ['one day', 1], ['two day', 2], ['three day', 3], ['four day', 4], ['five day', 5], ['six day', 6],
  ]

  for (const [pattern, value] of patterns) {
    if (text.includes(pattern)) return value
  }

  return null
}

function hasAny(text, terms) {
  return terms.some((term) => text.includes(term))
}

function isVagueFollowUp(text) {
  return ['what', 'what?', 'what else', 'anything else', 'else?', 'more', 'more?', 'and?', 'and', 'ok what else', 'ماذا ايضا', 'ايش كمان', 'زيد'].includes(text)
}

function isMealIntent(text) {
  return hasAny(text, ['meal', 'eat', 'protein', 'egg', 'eggs', 'chicken', 'food', 'calories', 'carbs', 'fat', 'diet', 'nutrition', 'breakfast', 'lunch', 'dinner', 'snack', 'post workout', 'after workout', 'after training', 'أكل', 'اكل', 'وجبة', 'بروتين', 'بيض', 'دجاج', 'سعرات'])
}

function isWorkoutIntent(text) {
  return hasAny(text, ['workout', 'split', 'train', 'training', 'chest', 'tricep', 'triceps', 'back', 'legs', 'lower body', 'shoulder', 'shoulders', 'biceps', 'push', 'pull', 'gym', 'home workout', 'تمرين', 'تمارين', 'صدر', 'ظهر', 'أرجل', 'ارجل', 'اكتاف', 'أكتاف', 'نادي', 'منزل'])
}

function isRecoveryIntent(text) {
  return hasAny(text, ['recovery', 'sore', 'rest day', 'sleep', 'deload', 'استشفاء', 'راحة', 'نوم'])
}

function recentIntent(history = []) {
  const recent = extractRecentUserMessages(history).reverse()
  for (const text of recent) {
    if (isMealIntent(text)) return 'meal'
    if (isWorkoutIntent(text)) return 'workout'
    if (isRecoveryIntent(text)) return 'recovery'
  }
  return null
}

function findFoodInText(text) {
  const normalizedText = normalize(text)
  for (const [key, food] of Object.entries(FOOD_DB)) {
    if (food.aliases.some((alias) => normalizedText.includes(alias))) {
      return key
    }
  }
  return null
}

function resolveFoodSubject(message, history = []) {
  const direct = findFoodInText(message)
  if (direct) return direct

  const lower = normalize(message)
  if (!hasAny(lower, ['it', 'them', 'that', 'this', 'one', 'هذا', 'هذي']) && !isVagueFollowUp(lower)) return null

  const recent = extractRecentUserMessages(history).reverse()
  for (const entry of recent) {
    const match = findFoodInText(entry)
    if (match) return match
  }

  return null
}

function foodNutritionReply(foodKey, askType = 'general') {
  const food = FOOD_DB[foodKey]
  if (!food) return null

  if (askType === 'protein') {
    return list([
      `${food.label.charAt(0).toUpperCase() + food.label.slice(1)} protein content:`,
      `${food.servingLabel} has about ${food.servingProtein}g of protein.`,
      foodKey === 'egg' ? '2 eggs give roughly 12 to 14g of protein.' : '150g gives roughly 45 to 46g of protein.',
      food.notes,
    ])
  }

  if (askType === 'calories') {
    return list([
      `${food.label.charAt(0).toUpperCase() + food.label.slice(1)} calorie content:`,
      `${food.servingLabel} has about ${food.servingCalories} kcal.`,
      foodKey === 'chicken' ? '150g cooked chicken breast is roughly 248 kcal.' : foodKey === 'egg' ? '2 eggs are roughly 156 kcal.' : food.notes,
      food.notes,
    ])
  }

  return list([
    `${food.label.charAt(0).toUpperCase() + food.label.slice(1)} nutrition:`,
    `${food.servingLabel} has about ${food.servingCalories} kcal and ${food.servingProtein}g of protein.`,
    food.notes,
  ])
}

function buildWorkoutPlan({ splitName, days }) {
  if (days === 4) {
    return list([
      `${splitName}:`,
      'Day 1: Chest and triceps',
      'Bench press 4 x 6-8',
      'Incline dumbbell press 3 x 8-10',
      'Cable fly 3 x 12-15',
      'Tricep pushdown 3 x 10-12',
      'Overhead tricep extension 3 x 12-15',
      '',
      'Day 2: Back and biceps',
      'Lat pulldown or pull-up 4 x 6-10',
      'Chest-supported row 3 x 8-10',
      'Seated cable row 3 x 10-12',
      'Dumbbell curls 3 x 10-12',
      'Hammer curls 2 x 12-15',
      '',
      'Day 3: Legs',
      'Back squat 4 x 5-8',
      'Romanian deadlift 3 x 8-10',
      'Leg press 3 x 10-12',
      'Leg curl 3 x 10-12',
      'Standing calf raise 3 x 12-15',
      '',
      'Day 4: Shoulders and arms',
      'Shoulder press 4 x 6-8',
      'Lateral raises 3 x 12-15',
      'Rear delt fly 3 x 12-15',
      'EZ-bar curl 3 x 10-12',
      'Cable pushdown 3 x 10-12',
      '',
      'Rest 1 to 2 minutes on compounds and 45 to 75 seconds on isolation work. Progress by adding reps before weight.',
    ])
  }

  return list([
    `${splitName}:`,
    'Train 3 to 5 days per week, start with compound lifts, and finish with 1 to 3 isolation exercises.',
    'Tell me how many days you want to train and I will turn it into a full plan.',
  ])
}

function workoutReply(message, profile, historyText) {
  const text = `${historyText} | ${message}`
  const goal = inferGoal(text, profile?.goal)
  const home = text.includes('home')
  const gym = text.includes('gym') || !home
  const days = detectDays(text)
  const chest = text.includes('chest') || text.includes('pec')
  const triceps = text.includes('tricep') || text.includes('triceps')

  if (days === 4 && gym) return buildWorkoutPlan({ splitName: `4-day gym split for ${goal}`, days: 4 })

  if (chest && triceps) {
    return list([
      `Chest and triceps session for ${goal}:`,
      `1. ${home ? 'Push-ups' : 'Bench press'} - 4 sets of 6-10 reps`,
      `2. ${home ? 'Incline push-ups' : 'Incline dumbbell press'} - 3 sets of 8-12 reps`,
      `3. ${home ? 'Chair dips' : 'Cable fly or chest dips'} - 3 sets of 10-15 reps`,
      `4. ${home ? 'Diamond push-ups' : 'Tricep pushdowns'} - 3 sets of 10-15 reps`,
      `5. ${home ? 'Bench dips' : 'Overhead tricep extensions'} - 2 to 3 sets of 12-15 reps`,
      'Rest 60 to 90 seconds between sets and keep 1 to 2 reps in reserve on most sets.',
    ])
  }

  if (text.includes('legs') || text.includes('lower body')) {
    return list([
      `Lower body session for ${goal}:`,
      `1. ${home ? 'Bodyweight squats' : 'Back squats'} - 4 x 6-10`,
      `2. ${home ? 'Reverse lunges' : 'Romanian deadlifts'} - 3 x 8-10`,
      `3. ${home ? 'Glute bridges' : 'Leg press'} - 3 x 10-12`,
      `4. ${home ? 'Calf raises' : 'Hamstring curls'} - 3 x 12-15`,
      'Keep the session around 45 to 60 minutes and progress by adding reps before weight.',
    ])
  }

  return list([
    `Practical training advice for ${goal}:`,
    'Train 3 to 5 days per week and start each session with compound movements.',
    'Tell me the muscle group, whether you are training at home or in the gym, and how many days you want to train.',
    'I will turn that into a practical plan with sets and reps.',
  ])
}

function mealReply(message, profile, history) {
  const historyText = extractRecentUserContext(history)
  const text = `${historyText} | ${message}`
  const goal = inferGoal(text, profile?.goal)
  const lower = normalize(message)
  const subject = resolveFoodSubject(lower, history)

  if (isVagueFollowUp(lower) && recentIntent(history) === 'meal') {
    return list([
      `More post-workout meal ideas for ${goal}:`,
      'Chicken with rice and vegetables.',
      'Greek yogurt with oats and banana.',
      'Eggs with toast and fruit.',
      'Tuna with potatoes and salad.',
    ])
  }

  if (hasAny(lower, ['calories in it', 'calories in that', 'how many calories', 'calories?']) && subject) return foodNutritionReply(subject, 'calories')
  if (hasAny(lower, ['protein content', 'protein in', 'protein?']) && subject) return foodNutritionReply(subject, 'protein')
  if (subject === 'egg' && hasAny(lower, ['protein', 'egg', 'eggs'])) return foodNutritionReply('egg', 'protein')
  if (subject === 'chicken' && hasAny(lower, ['protein', 'chicken'])) return foodNutritionReply('chicken', 'protein')

  if ((lower.includes('eggs') && lower.includes('chicken')) || lower.includes('eggs better or chicken') || lower.includes('egg or chicken') || lower.includes('better eggs or chicken')) {
    return list([
      `Both eggs and chicken can work for ${goal}.`,
      'Chicken is leaner and usually gives more protein for fewer calories.',
      'Eggs are still great, but they come with more fat per serving and work well for breakfast or lighter meals.',
      'Choose chicken for protein efficiency and eggs for convenience and satiety.',
    ])
  }

  if (lower.includes('can i eat chicken')) {
    return list([
      `Yes, chicken is a strong choice for ${goal}.`,
      'It is high in protein, easy to portion, and works well in lower-fat meals.',
      'A simple serving is 120g to 180g cooked chicken with rice or potatoes and vegetables.',
    ])
  }

  if (hasAny(lower, ['what should i eat after', 'after workout', 'after training', 'post workout'])) {
    return list([
      `After a workout, aim for 25 to 40g of protein plus an easy carb source for ${goal}.`,
      'Good options: chicken with rice, eggs with bread and fruit, Greek yogurt with oats, or tuna with potatoes.',
      'After a lower body workout, a bigger carb portion is usually useful because leg sessions burn more energy.',
      'A simple post-leg-day meal is chicken, rice, and vegetables or eggs with toast, fruit, and yogurt.',
    ])
  }

  if (subject) return foodNutritionReply(subject, 'general')

  return list([
    `For ${goal}, build meals around lean protein, vegetables, and a carb portion that matches your activity.`,
    'Easy options: chicken and rice, eggs with toast and fruit, Greek yogurt with oats, or tuna with potatoes.',
    'If you tell me your preferred foods, I can make it more specific.',
  ])
}

function recoveryReply(profile, lang = 'en') {
  if (lang === 'ar') {
    return list([
      `${introName(profile, lang)}أساسيات الاستشفاء:`,
      'نم من 7 إلى 9 ساعات، وحافظ على البروتين، واشرب ماء كفاية، واستخدم المشي الخفيف أو الحركة في أيام الراحة.',
      'إذا كان الألم عاليا، خفف حجم التمرين في حصة واحدة بدل إجبار نفسك على حصة قوية أخرى.',
      'ارجع للتمرين الشديد فقط عندما ترجع الطاقة والأداء إلى وضعهما الطبيعي.',
    ])
  }

  return list([
    `${introName(profile, lang)}Recovery basics:`,
    'Sleep 7 to 9 hours, keep protein intake consistent, hydrate well, and use light walking or mobility on rest days.',
    'If soreness is high, reduce volume for one session instead of forcing another hard workout.',
    'Return to hard training only when energy and performance feel normal again.',
  ])
}

function localCoachReply(message, profile, history = [], lang = 'en') {
  const lower = normalize(message)
  const historyText = extractRecentUserContext(history)
  const mealIntent = isMealIntent(lower)
  const workoutIntent = isWorkoutIntent(lower)
  const recoveryIntent = isRecoveryIntent(lower)
  const lastIntent = recentIntent(history)

  if (mealIntent) return mealReply(lower, profile, history)
  if (workoutIntent) return workoutReply(lower, profile, historyText)
  if (recoveryIntent) return recoveryReply(profile, lang)

  if (lang === 'ar') {
    return list([
      `${introName(profile, lang)}أقدر أساعدك في الوجبات والتمارين والاستشفاء والتخطيط الأسبوعي.`,
      'اكتب سؤالك بالعربية وسأجيبك بالعربية بشكل مباشر وعملي.',
    ])
  }

  if (isVagueFollowUp(lower)) {
    if (lastIntent === 'meal') return mealReply(lower, profile, history)
    if (lastIntent === 'workout') return workoutReply(lower, profile, historyText)
    if (lastIntent === 'recovery') return recoveryReply(profile, lang)
  }

  if (resolveFoodSubject(lower, history)) return mealReply(lower, profile, history)

  return list([
    `${introName(profile)}I can help with meals, workouts, recovery, and weekly planning.`,
    'Ask me something specific like what should I eat after a lower body workout, build me a 4-day gym split for muscle gain, chicken protein, or calories in it.',
  ])
}

function buildConversationInput(message, history = []) {
  const safeMessage = normalize(message)
  const trimmedHistory = Array.isArray(history) ? history.slice(-10) : []
  const normalizedHistory = trimmedHistory
    .filter((item) => item && (item.role === 'user' || item.role === 'assistant') && typeof item.content === 'string' && item.content.trim())
    .map((item) => ({ role: item.role, content: item.content.trim() }))

  const lastItem = normalizedHistory[normalizedHistory.length - 1]
  if (lastItem?.role === 'user' && normalize(lastItem.content) === safeMessage) return normalizedHistory

  return [...normalizedHistory, { role: 'user', content: message.trim() }]
}

async function tryGroq({ message, history, systemPrompt }) {
  const model = process.env.GROQ_COACH_MODEL || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
  const input = buildConversationInput(message, history)

  return createGroqChatCompletion({
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      ...input,
    ],
    maxTokens: 700,
    temperature: 0.3,
    timeoutMs: 20000,
  })
}

export async function POST(request) {
  try {
    const { message, history = [], profile } = await request.json()
    const replyLanguage = detectReplyLanguage(message, history)
    const languageInstruction = replyLanguage === 'ar'
      ? 'Reply only in Arabic. If the user writes in Arabic, do not answer in English.'
      : 'Reply in English unless the user explicitly asks for another language.'
    const systemPrompt = `You are Trackily AI Coach. You are an expert in meals, nutrition, workout programming, home training, gym training, recovery, and practical weekly planning. Answer the exact question directly. Do not use markdown symbols such as **, *, #, or bullet syntax. Use plain readable lines only. If the user asks what to eat after training, answer with actual food guidance, not workout guidance. If they ask about a food, give the number first. For vague follow-ups like what else, continue the same topic. Keep answers practical, concise, and supportive. Avoid hype and do not mention internal tooling. ${languageInstruction}`
    const normalizedHistory = buildConversationInput(message, history)
    const providerErrors = []

    if (hasGroqConfig()) {
      const groqResult = await tryGroq({ message, history: normalizedHistory, systemPrompt })
      if (groqResult.ok) {
        return Response.json({ reply: groqResult.text, mode: 'groq', providerLabel: 'Groq', fallbackActive: false })
      }
      providerErrors.push(groqResult.error)
    }

    return Response.json({
      reply: localCoachReply(message, profile, normalizedHistory, replyLanguage),
      mode: 'local',
      providerLabel: 'Built-in coach',
      providerError: providerErrors.join(' | ') || (hasGroqConfig() ? undefined : 'GROQ_API_KEY is not configured. Set it to enable the hosted AI provider.'),
      fallbackActive: true,
    })
  } catch (error) {
    return Response.json({
      reply: 'تعذر تنفيذ الطلب الآن. حاول مرة أخرى مع هدفك ومكان التمرين والوقت المتاح.',
      mode: 'local',
      providerLabel: 'Built-in coach',
      providerError: error?.message || 'Unknown server error.',
      fallbackActive: true,
    }, { status: 200 })
  }
}
