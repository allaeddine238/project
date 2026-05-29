const GROQ_BASE_URL = (process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1').replace(/\/$/, '')

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

export function hasGroqConfig() {
  return Boolean(cleanString(process.env.GROQ_API_KEY))
}

function groqHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
  }
}

export async function createGroqChatCompletion({ model, messages, maxTokens = 600, temperature = 0.3, timeoutMs = 20000 }) {
  if (!hasGroqConfig()) return { ok: false, error: 'GROQ_API_KEY is not configured.' }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: groqHeaders(),
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_completion_tokens: maxTokens,
        stream: false,
      }),
      signal: controller.signal,
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      return { ok: false, error: data?.error?.message || `Groq request failed with status ${response.status}.` }
    }

    const text = data?.choices?.[0]?.message?.content?.trim()
    if (!text) return { ok: false, error: 'Groq returned no message content.' }

    return { ok: true, text, data }
  } catch (error) {
    return { ok: false, error: error?.name === 'AbortError' ? 'Groq request timed out.' : error?.message || 'Groq request failed.' }
  } finally {
    clearTimeout(timeout)
  }
}
