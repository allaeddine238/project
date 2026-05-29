import { createGroqChatCompletion, hasGroqConfig } from '@/lib/ai-provider'
import { quickFoods } from '@/lib/meal-data'

const normalize = (text = '') => text.toLowerCase().trim()
const normalizeLang = (lang = '') => ['en', 'fr', 'ar'].includes(lang) ? lang : 'en'
const languageNames = { en: 'English', fr: 'French', ar: 'Arabic' }

const parserAliases = {
  egg: 'egg',
  eggs: 'egg',
  '\u0628\u064a\u0636': 'egg',
  banana: 'banana',
  bananas: 'banana',
  bannana: 'banana',
  bannanas: 'banana',
  banna: 'banana',
  bannas: 'banana',
  '\u0645\u0648\u0632': 'banana',
  peanut: 'peanuts',
  peanuts: 'peanuts',
  '\u0641\u0648\u0644 \u0633\u0648\u062f\u0627\u0646\u064a': 'peanuts',
  rice: 'rice',
  '\u0623\u0631\u0632': 'rice',
  chicken: 'chicken-breast',
  'chicken breast': 'chicken-breast',
  '\u062f\u062c\u0627\u062c': 'chicken-breast',
  almonds: 'almonds',
  almond: 'almonds',
  '\u0644\u0648\u0632': 'almonds',
  orange: 'orange',
  oranges: 'orange',
  '\u0628\u0631\u062a\u0642\u0627\u0644': 'orange',
}

const parserFoods = {
  ...Object.fromEntries(quickFoods.map((item) => [item.id, item])),
  peanuts: {
    id: 'peanuts',
    names: { en: 'Peanuts', fr: 'Cacahuetes', ar: '\u0641\u0648\u0644 \u0633\u0648\u062f\u0627\u0646\u064a' },
    nutritionPer100g: { calories: 567, protein: 25.8, carbs: 16.1, fat: 49.2 },
    gramsPerUnit: 28,
    unitLabels: { en: 'handful', fr: 'poignee', ar: '\u0642\u0628\u0636\u0629' },
  },
}

function localizedFoodName(food, lang = 'en') {
  return food?.names?.[lang] || food?.names?.en || ''
}

function createLoggedItem({ name, amount, grams, calories, protein, carbs, fat }) {
  return {
    id: `${normalize(name).replace(/[^a-z0-9\u0600-\u06ff]+/g, '-') || 'food'}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    amount: Number(amount) || 1,
    grams: Math.round(Number(grams) || 0),
    calories: Math.round(Number(calories) || 0),
    protein: Number((Number(protein) || 0).toFixed(1)),
    carbs: Number((Number(carbs) || 0).toFixed(1)),
    fat: Number((Number(fat) || 0).toFixed(1)),
  }
}

function tokenizeQuery(query = '') {
  return query
    .split(/\s*(?:,|\+|\/|&|\band\b|\bet\b|\by\b|\u0648)\s*/i)
    .map((part) => part.trim())
    .filter(Boolean)
}

function resolveFoodName(rawName = '') {
  const cleaned = normalize(rawName.replace(/^(of|de)\s+/i, ''))
  if (parserAliases[cleaned]) return parserAliases[cleaned]
  const aliasEntry = Object.keys(parserAliases).find((key) => cleaned.includes(key))
  return aliasEntry ? parserAliases[aliasEntry] : null
}

function localizeParsedItemName(name = '', lang = 'en') {
  const foodId = resolveFoodName(name)
  const food = foodId ? parserFoods[foodId] : null
  return food ? localizedFoodName(food, lang) : name
}

function parsePart(part = '', lang = 'en') {
  const match = part.match(/^(?<amount>\d+(?:\.\d+)?)\s*(?<unit>kg|g|gram|grams)?\s*(?<name>.+)$/i)
  const defaultMatch = part.match(/^(?<name>.+)$/i)
  const groups = match?.groups || defaultMatch?.groups || {}
  const rawName = (groups.name || part).trim()
  const foodId = resolveFoodName(rawName)
  const food = foodId ? parserFoods[foodId] : null
  if (!food) return null

  const amount = Number(groups.amount || 1)
  const unit = normalize(groups.unit || '')
  const grams = unit === 'kg'
    ? amount * 1000
    : unit.startsWith('g')
      ? amount
      : amount * (food.gramsPerUnit || 100)
  const scale = grams / 100

  return createLoggedItem({
    name: localizedFoodName(food, lang),
    amount,
    grams,
    calories: (food.nutritionPer100g?.calories || 0) * scale,
    protein: (food.nutritionPer100g?.protein || 0) * scale,
    carbs: (food.nutritionPer100g?.carbs || 0) * scale,
    fat: (food.nutritionPer100g?.fat || 0) * scale,
  })
}

function buildFallbackItems(query = '', lang = 'en') {
  return tokenizeQuery(query).map((part) => parsePart(part, lang)).filter(Boolean)
}

function extractJson(text = '') {
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) return null
  try {
    return JSON.parse(match[0])
  } catch {
    return null
  }
}

async function tryGroq(query, lang = 'en') {
  if (!hasGroqConfig()) return { ok: false, error: 'GROQ_API_KEY is not configured.' }

  const model = process.env.GROQ_MEAL_MODEL || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
  const result = await createGroqChatCompletion({
    model,
    messages: [
      {
        role: 'system',
        content: `You parse food logging text into separate items. Return strict JSON array only. Each item must contain name, amount, grams, calories, protein, carbs, fat. Split combined text into one item per food. Write item names in ${languageNames[lang] || 'English'}. No markdown or commentary.`,
      },
      {
        role: 'user',
        content: `Parse and estimate this food log: ${query}`,
      },
    ],
    maxTokens: 500,
    temperature: 0.2,
    timeoutMs: 18000,
  })

  if (!result.ok) return result
  const parsed = extractJson(result.text)
  if (!Array.isArray(parsed) || parsed.length === 0) {
    return { ok: false, error: 'Groq returned invalid JSON.' }
  }

  return {
    ok: true,
    items: parsed
      .map((item) => createLoggedItem({ ...item, name: localizeParsedItemName(item.name, lang) }))
      .filter((item) => item.name && item.grams > 0),
  }
}

export async function POST(request) {
  try {
    const { query, lang } = await request.json()
    const safeQuery = String(query || '').trim()
    const safeLang = normalizeLang(lang)
    if (!safeQuery) return Response.json({ error: 'Missing query.' }, { status: 400 })

    const groqResult = await tryGroq(safeQuery, safeLang)
    if (groqResult.ok) {
      return Response.json({ items: groqResult.items, provider: 'groq' })
    }

    const fallbackItems = buildFallbackItems(safeQuery, safeLang)
    if (fallbackItems.length > 0) {
      return Response.json({ items: fallbackItems, provider: 'local' })
    }

    return Response.json({ error: groqResult.error || 'Unable to parse foods.' }, { status: 422 })
  } catch {
    return Response.json({ error: 'Unable to parse foods.' }, { status: 500 })
  }
}
