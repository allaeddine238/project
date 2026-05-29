import { createGroqChatCompletion, hasGroqConfig } from '@/lib/ai-provider'
import { quickFoods, traditionalMeals } from '@/lib/meal-data'

const titleCase = (text = '') => text
  .split(/\s+/)
  .filter(Boolean)
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(' ')

const normalize = (text = '') => text.toLowerCase().trim()

const localFoodAliases = {
  oats: { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9, gramsPerUnit: 40, unitLabel: 'serving' },
  shawarma: { calories: 215, protein: 14, carbs: 18, fat: 10, gramsPerUnit: 180, unitLabel: 'wrap' },
  burger: { calories: 250, protein: 15, carbs: 20, fat: 12, gramsPerUnit: 180, unitLabel: 'burger' },
  pizza: { calories: 266, protein: 11, carbs: 33, fat: 10, gramsPerUnit: 125, unitLabel: 'slice' },
  tuna: { calories: 132, protein: 29, carbs: 0, fat: 1, gramsPerUnit: 100, unitLabel: 'can' },
  pasta: { calories: 157, protein: 5.8, carbs: 30, fat: 0.9, gramsPerUnit: 140, unitLabel: 'plate' },
  potatoes: { calories: 87, protein: 2, carbs: 20, fat: 0.1, gramsPerUnit: 180, unitLabel: 'portion' },
  salmon: { calories: 208, protein: 20, carbs: 0, fat: 13, gramsPerUnit: 140, unitLabel: 'fillet' },
}

function toDatabaseItem(item) {
  return {
    ...item,
    source: 'database',
  }
}

function databaseMatch(query) {
  const lower = normalize(query)
  const quick = quickFoods.find((item) => item.names.en.toLowerCase().includes(lower))
  if (quick) {
    return {
      matchType: 'database',
      item: toDatabaseItem(quick),
    }
  }

  const traditional = traditionalMeals.find((item) => item.names.en.toLowerCase().includes(lower) || item.names.fr.toLowerCase().includes(lower) || item.names.ar.includes(query))
  if (traditional) {
    return {
      matchType: 'database',
      item: {
        id: traditional.id,
        image: traditional.image,
        names: traditional.names,
        descriptions: traditional.descriptions,
        nutritionPer100g: traditional.per100g,
        gramsPerUnit: traditional.defaultGrams,
        unitLabels: { en: 'plate', fr: 'assiette', ar: '\u0637\u0628\u0642' },
        modes: ['g', 'unit'],
        defaultMode: 'g',
        defaultAmount: traditional.defaultGrams,
        amountStep: { g: 10, unit: 1 },
        source: 'database',
        kind: 'traditional',
      },
    }
  }

  return null
}

function estimateBase(query) {
  const lower = normalize(query)
  const alias = Object.entries(localFoodAliases).find(([key]) => lower.includes(key))
  const base = alias?.[1] || { calories: 180, protein: 10, carbs: 18, fat: 7, gramsPerUnit: 150, unitLabel: 'portion' }

  return {
    id: `ai-${lower.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'meal'}`,
    names: { en: titleCase(query), fr: titleCase(query), ar: query },
    descriptions: {
      en: 'Estimated from a local nutrition fallback so you can log the meal.',
      fr: 'Estimation issue du mode local pour vous permettre d enregistrer le repas.',
      ar: '\u062a\u0642\u062f\u064a\u0631 \u0645\u062d\u0644\u064a \u0644\u0644\u0642\u064a\u0645 \u0627\u0644\u063a\u0630\u0627\u0626\u064a\u0629 \u0644\u062a\u0645\u0643\u064a\u0646\u0643 \u0645\u0646 \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u0648\u062c\u0628\u0629.',
    },
    nutritionPer100g: {
      calories: base.calories,
      protein: base.protein,
      carbs: base.carbs,
      fat: base.fat,
    },
    gramsPerUnit: base.gramsPerUnit,
    unitLabels: { en: base.unitLabel, fr: 'portion', ar: '\u062d\u0635\u0629' },
    modes: ['g', 'unit'],
    defaultMode: 'g',
    defaultAmount: base.gramsPerUnit,
    amountStep: { g: 10, unit: 1 },
    source: 'ai',
  }
}

function splitMealQuery(query = '') {
  return query
    .split(/\s*(?:,|\+|\/|&|\band\b|\bet\b)\s*/i)
    .map((part) => part.trim())
    .filter(Boolean)
}

function estimateNutrition(item) {
  const mode = item.defaultMode || 'g'
  const amount = item.defaultAmount ?? (mode === 'unit' ? 1 : 100)
  const grams = mode === 'unit' ? amount * (item.gramsPerUnit || 1) : amount
  const scale = grams / 100

  return {
    name: item.names?.en || 'Meal',
    calories: Math.round((item.nutritionPer100g?.calories || 0) * scale),
    protein: Number(((item.nutritionPer100g?.protein || 0) * scale).toFixed(1)),
    carbs: Number(((item.nutritionPer100g?.carbs || 0) * scale).toFixed(1)),
    fat: Number(((item.nutritionPer100g?.fat || 0) * scale).toFixed(1)),
    grams,
    amount,
    unitLabel: item.unitLabels?.en || 'portion',
    source: item.source || 'ai',
  }
}

function buildAnalysis(query) {
  const parts = splitMealQuery(query)
  const items = (parts.length > 1 ? parts : [query]).map((part) => {
    const matched = databaseMatch(part)
    return matched?.item || estimateBase(part)
  })

  const components = items.map((item) => estimateNutrition(item))
  const totals = components.reduce((accumulator, component) => ({
    calories: accumulator.calories + component.calories,
    protein: Number((accumulator.protein + component.protein).toFixed(1)),
    carbs: Number((accumulator.carbs + component.carbs).toFixed(1)),
    fat: Number((accumulator.fat + component.fat).toFixed(1)),
    grams: accumulator.grams + component.grams,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0, grams: 0 })

  return {
    id: `ai-${normalize(query).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'meal'}`,
    names: { en: titleCase(query), fr: titleCase(query), ar: query },
    descriptions: {
      en: components.length > 1
        ? 'Analyzed into separate meal components so you can log the full plate.'
        : 'Estimated from a local nutrition fallback so you can log the meal.',
      fr: components.length > 1
        ? 'Analyse en composants distincts pour enregistrer l assiette complete.'
        : 'Estimation issue du mode local pour vous permettre d enregistrer le repas.',
      ar: components.length > 1
        ? 'Separated meal component estimate for logging the full plate.'
        : 'Local nutrition fallback estimate for logging this meal.',
    },
    nutritionPer100g: totals.grams > 0 ? {
      calories: Number(((totals.calories / totals.grams) * 100).toFixed(1)),
      protein: Number(((totals.protein / totals.grams) * 100).toFixed(1)),
      carbs: Number(((totals.carbs / totals.grams) * 100).toFixed(1)),
      fat: Number(((totals.fat / totals.grams) * 100).toFixed(1)),
    } : { calories: 0, protein: 0, carbs: 0, fat: 0 },
    gramsPerUnit: totals.grams || 150,
    unitLabels: { en: components.length > 1 ? 'meal' : 'portion', fr: components.length > 1 ? 'repas' : 'portion', ar: components.length > 1 ? '\u0648\u062c\u0628\u0629' : '\u062d\u0635\u0629' },
    modes: ['g', 'unit'],
    defaultMode: 'unit',
    defaultAmount: 1,
    amountStep: { g: 1, unit: 1 },
    source: 'ai',
    analysis: {
      components,
      totals,
    },
  }
}

function extractJsonBlock(text = '') {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    return JSON.parse(match[0])
  } catch {
    return null
  }
}

async function tryGroq(query) {
  if (!hasGroqConfig()) return { ok: false, error: 'GROQ_API_KEY is not configured.' }

  const model = process.env.GROQ_MEAL_MODEL || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'
  const result = await createGroqChatCompletion({
    model,
    messages: [
      {
        role: 'system',
        content: 'You estimate nutrition for meal logging. Return strict JSON only with keys calories, protein, carbs, fat, gramsPerUnit, unitLabel. Values must be numbers except unitLabel. Estimate per 100g nutrition. No markdown or commentary.',
      },
      {
        role: 'user',
        content: `Estimate the nutrition for ${query}. Return per 100g values and a useful serving size in grams.`,
      },
    ],
    maxTokens: 220,
    temperature: 0.2,
    timeoutMs: 15000,
  })

  if (!result.ok) return result

  const parsed = extractJsonBlock(result.text)
  if (!parsed) return { ok: false, error: 'Groq returned invalid JSON.' }

  return {
    ok: true,
    item: {
      id: `ai-${normalize(query).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'meal'}`,
      names: { en: titleCase(query), fr: titleCase(query), ar: query },
      descriptions: {
        en: 'Estimated with the hosted Groq model.',
        fr: 'Estimation produite par le modele Groq distant.',
        ar: '\u062a\u0645 \u0627\u0644\u062a\u0642\u062f\u064a\u0631 \u0628\u0627\u0633\u062a\u062e\u062f\u0627\u0645 \u0646\u0645\u0648\u0630\u062c Groq \u0627\u0644\u0633\u062d\u0627\u0628\u064a.',
      },
      nutritionPer100g: {
        calories: Number(parsed.calories) || 180,
        protein: Number(parsed.protein) || 10,
        carbs: Number(parsed.carbs) || 18,
        fat: Number(parsed.fat) || 7,
      },
      gramsPerUnit: Number(parsed.gramsPerUnit) || 150,
      unitLabels: { en: parsed.unitLabel || 'portion', fr: 'portion', ar: '\u062d\u0635\u0629' },
      modes: ['g', 'unit'],
      defaultMode: 'g',
      defaultAmount: Number(parsed.gramsPerUnit) || 150,
      amountStep: { g: 10, unit: 1 },
      source: 'ai',
    },
  }
}

export async function POST(request) {
  try {
    const { query } = await request.json()
    const safeQuery = String(query || '').trim()
    if (!safeQuery) return Response.json({ error: 'Missing query.' }, { status: 400 })

    const matched = databaseMatch(safeQuery)
    if (matched) return Response.json(matched)

    if (hasGroqConfig()) {
      const groqEstimate = await tryGroq(safeQuery)
      if (groqEstimate.ok) {
        return Response.json({ matchType: 'ai', item: groqEstimate.item, provider: 'groq' })
      }
    }

    return Response.json({ matchType: 'ai', item: buildAnalysis(safeQuery), provider: 'local' })
  } catch {
    return Response.json({ matchType: 'ai', item: buildAnalysis('Custom meal'), provider: 'local' })
  }
}

