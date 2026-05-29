export const billingPeriods = {
  daily: { en: 'daily', fr: 'jour', ar: '\u064a\u0648\u0645' },
  monthly: { en: 'monthly', fr: 'mois', ar: '\u0634\u0647\u0631' },
  yearly: { en: 'yearly', fr: 'an', ar: '\u0633\u0646\u0629' },
}

export const tokenPacks = [
  {
    id: 'pack-20',
    name: { en: 'Starter Pack', fr: 'Pack debut', ar: '\u0628\u0627\u0642\u0629 \u0627\u0644\u0628\u062f\u0627\u064a\u0629' },
    description: {
      en: 'A small top-up for quick logging.',
      fr: 'Une petite recharge pour commencer.',
      ar: '\u0634\u062d\u0646\u0629 \u0635\u063a\u064a\u0631\u0629 \u0644\u0644\u0628\u062f\u0621 \u0633\u0631\u064a\u0639\u0627.',
    },
    tokens: 20,
    priceDzd: 300,
    priceUsd: 2.2,
    type: 'pack',
  },
  {
    id: 'pack-50',
    name: { en: 'Popular Pack', fr: 'Pack populaire', ar: '\u0627\u0644\u0628\u0627\u0642\u0629 \u0627\u0644\u0623\u0643\u062b\u0631 \u0637\u0644\u0628\u0627' },
    description: {
      en: 'More room for meals, AI, and workouts.',
      fr: 'Plus de marge pour les repas, l IA et les seances.',
      ar: '\u0631\u0635\u064a\u062f \u0623\u0643\u0628\u0631 \u0644\u0644\u0648\u062c\u0628\u0627\u062a \u0648\u0627\u0644\u0630\u0643\u0627\u0621 \u0648\u0627\u0644\u062d\u0635\u0635.',
    },
    tokens: 50,
    priceDzd: 650,
    priceUsd: 4.8,
    type: 'pack',
    featured: true,
  },
  {
    id: 'pack-100',
    name: { en: 'Power Pack', fr: 'Pack intensif', ar: '\u0628\u0627\u0642\u0629 \u0645\u0643\u062b\u0641\u0629' },
    description: {
      en: 'Best value for heavy daily use.',
      fr: 'Le meilleur choix pour une utilisation intensive.',
      ar: '\u0623\u0641\u0636\u0644 \u062e\u064a\u0627\u0631 \u0644\u0644\u0627\u0633\u062a\u062e\u062f\u0627\u0645 \u0627\u0644\u064a\u0648\u0645\u064a \u0627\u0644\u0645\u0643\u062b\u0641.',
    },
    tokens: 100,
    priceDzd: 1200,
    priceUsd: 8.9,
    type: 'pack',
  },
]

export const tokenPlans = [
  {
    id: 'plan-daily',
    name: { en: 'Daily Pass', fr: 'Pass journalier', ar: '\u0627\u0634\u062a\u0631\u0627\u0643 \u064a\u0648\u0645\u064a' },
    billingPeriod: 'daily',
    tokens: 0,
    priceDzd: 150,
    priceUsd: 1.1,
    description: {
      en: 'Unlimited access for one day.',
      fr: 'Acces illimite pendant une journee.',
      ar: '\u0648\u0635\u0648\u0644 \u063a\u064a\u0631 \u0645\u062d\u062f\u0648\u062f \u0644\u0645\u062f\u0629 \u064a\u0648\u0645 \u0648\u0627\u062d\u062f.',
    },
    type: 'plan',
  },
  {
    id: 'plan-monthly',
    name: { en: 'Monthly Pass', fr: 'Pass mensuel', ar: '\u0627\u0634\u062a\u0631\u0627\u0643 \u0634\u0647\u0631\u064a' },
    billingPeriod: 'monthly',
    tokens: 0,
    priceDzd: 2900,
    priceUsd: 21.5,
    description: {
      en: 'Unlimited access for one month.',
      fr: 'Acces illimite pendant un mois.',
      ar: '\u0648\u0635\u0648\u0644 \u063a\u064a\u0631 \u0645\u062d\u062f\u0648\u062f \u0644\u0645\u062f\u0629 \u0634\u0647\u0631 \u0648\u0627\u062d\u062f.',
    },
    type: 'plan',
    featured: true,
  },
  {
    id: 'plan-yearly',
    name: { en: 'Yearly Pass', fr: 'Pass annuel', ar: '\u0627\u0634\u062a\u0631\u0627\u0643 \u0633\u0646\u0648\u064a' },
    billingPeriod: 'yearly',
    tokens: 0,
    priceDzd: 24900,
    priceUsd: 184,
    description: {
      en: 'Unlimited access for one year.',
      fr: 'Acces illimite pendant un an.',
      ar: '\u0648\u0635\u0648\u0644 \u063a\u064a\u0631 \u0645\u062d\u062f\u0648\u062f \u0644\u0645\u062f\u0629 \u0633\u0646\u0629 \u0643\u0627\u0645\u0644\u0629.',
    },
    type: 'plan',
  },
]

export const paymentMethods = [
  {
    id: 'ccp',
    name: { en: 'CCP', fr: 'CCP', ar: 'CCP' },
    description: {
      en: 'Algerie Poste CCP transfer',
      fr: 'Virement CCP Algerie Poste',
      ar: '\u062a\u062d\u0648\u064a\u0644 CCP \u0639\u0628\u0631 \u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u062c\u0632\u0627\u0626\u0631\u064a',
    },
  },
  {
    id: 'baridimob',
    name: { en: 'BaridiMob', fr: 'BaridiMob', ar: '\u0628\u0631\u064a\u062f\u064a \u0645\u0648\u0628' },
    description: {
      en: 'Fast mobile payment for Algeria',
      fr: 'Paiement mobile rapide pour l Algerie',
      ar: '\u062f\u0641\u0639 \u0645\u0648\u0628\u0627\u064a\u0644 \u0633\u0631\u064a\u0639 \u062f\u0627\u062e\u0644 \u0627\u0644\u062c\u0632\u0627\u0626\u0631',
    },
  },
  {
    id: 'bank-card',
    name: { en: 'CIB / Visa / Mastercard', fr: 'CIB / Visa / Mastercard', ar: 'CIB / Visa / Mastercard' },
    description: {
      en: 'Bank card payment',
      fr: 'Paiement par carte bancaire',
      ar: '\u0627\u0644\u062f\u0641\u0639 \u0628\u0627\u0644\u0628\u0637\u0627\u0642\u0629 \u0627\u0644\u0628\u0646\u0643\u064a\u0629',
    },
  },
]
