# Trackily Next

## Run

```bash
npm install
npm run dev
```

## Environment

Create `.env` with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_COACH_MODEL=llama-3.3-70b-versatile
GROQ_MEAL_MODEL=llama-3.3-70b-versatile
```

`GROQ_API_KEY` is optional.
If it is set, the app uses Groq first.
If Groq fails or is not configured, the app falls back to the built-in coach and local meal estimation.

## Provider Order

1. `Groq`
2. built-in fallback

## Groq Setup

1. Create a Groq API key.
2. Add `GROQ_API_KEY` to `.env`.
3. Optionally change `GROQ_MODEL`, `GROQ_COACH_MODEL`, or `GROQ_MEAL_MODEL`.
4. Restart the Next.js dev server.

