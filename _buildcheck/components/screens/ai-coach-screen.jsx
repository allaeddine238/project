'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { addMessage, createConversation, deleteConversation, getConversations, getMessages, updateConversationTitle } from '@/lib/db'
import { formatDate } from '@/lib/utils'
import { useApp } from '@/components/providers/app-provider'
import { IconBot, IconMessageSq, IconPlus, IconSend, IconTrash } from '@/components/ui/icons'

function escapeHtml(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function formatAssistantMessage(content = '') {
  const escaped = escapeHtml(content)
  const withBold = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  const lines = withBold.split('\n').map((line) => {
    const trimmed = line.trim()
    if (!trimmed) return '<div style="height:8px"></div>'
    if (/^(\*|-|•)\s+/.test(trimmed)) return `<div>&bull; ${trimmed.replace(/^(\*|-|•)\s+/, '')}</div>`
    if (/^[0-9]+[.)]\s+/.test(trimmed)) return `<div>${trimmed.replace(/^([0-9]+)[.)]\s+/, '<strong>$1.</strong> ')}</div>`
    if (trimmed.endsWith(':')) return `<div><strong>${trimmed}</strong></div>`
    return `<div>${trimmed}</div>`
  })
  return lines.join('')
}

export function AICoachScreen() {
  const { t, profile, session, spendToken, openTokenModal } = useApp()
  const [conversations, setConversations] = useState([])
  const [activeConversationId, setActiveConversationId] = useState(null)
  const [messages, setMessages] = useState([])
  const [showList, setShowList] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [providerMode, setProviderMode] = useState('')
  const bottomRef = useRef(null)

  const activeConversation = useMemo(() => conversations.find((item) => item.id === activeConversationId), [activeConversationId, conversations])
  const suggestions = [t.coachSuggestion1, t.coachSuggestion2, t.coachSuggestion3, t.coachSuggestion4]

  const scrollToBottom = () => window.setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80)

  const createConversationWithWelcome = async () => {
    const welcome = profile?.name ? `Hi ${profile.name}. ${t.coachIntro}` : t.coachIntro
    const { data } = await createConversation(session.id, t.newChat)
    if (!data) return null
    await addMessage(data.id, 'assistant', welcome)
    setConversations((current) => [data, ...current])
    setActiveConversationId(data.id)
    setMessages([{ role: 'assistant', content: welcome }])
    return data.id
  }

  const ensureConversation = async () => activeConversationId || createConversationWithWelcome()

  useEffect(() => {
    if (!session) return
    const load = async () => {
      setLoadingConversations(true)
      try {
        const { data } = await getConversations(session.id)
        const nextConversations = data || []
        setConversations(nextConversations)
        if (nextConversations.length) {
          await loadConversation(nextConversations[0].id)
        } else {
          await createConversationWithWelcome()
        }
      } finally {
        setLoadingConversations(false)
      }
    }
    load()
  }, [session])

  const loadConversation = async (id) => {
    setActiveConversationId(id)
    const { data } = await getMessages(id)
    setMessages(data || [])
    setShowList(false)
    scrollToBottom()
  }

  const createNewConversation = async () => {
    await createConversationWithWelcome()
    setShowList(false)
  }

  const removeConversation = async (id, event) => {
    event.stopPropagation()
    await deleteConversation(id)
    const nextConversations = conversations.filter((item) => item.id !== id)
    setConversations(nextConversations)
    if (activeConversationId === id) {
      if (nextConversations.length) {
        await loadConversation(nextConversations[0].id)
      } else {
        setActiveConversationId(null)
        setMessages([])
        await createConversationWithWelcome()
      }
    }
  }

  const send = async (seed) => {
    const text = (seed || input).trim()
    if (!text || loading || loadingConversations) return
    if ((profile?.token_balance ?? 0) <= 0) {
      openTokenModal()
      return
    }

    const conversationId = await ensureConversation()
    if (!conversationId) return

    const userMessage = { role: 'user', content: text }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)
    scrollToBottom()

    await addMessage(conversationId, 'user', text)

    if (messages.filter((message) => message.role === 'user').length === 0) {
      const title = text.slice(0, 45)
      await updateConversationTitle(conversationId, title)
      setConversations((current) => current.map((conversation) => conversation.id === conversationId ? { ...conversation, title } : conversation))
    }

    try {
      const controller = new AbortController()
      const timeout = window.setTimeout(() => controller.abort(), 20000)
      const response = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: nextMessages.slice(-10), profile }),
        signal: controller.signal,
      })
      clearTimeout(timeout)
      const data = await response.json()
      const reply = data.reply || t.authConnectionError
      const assistantMessage = { role: 'assistant', content: reply }
      setProviderMode(data.mode || 'local')
      setMessages([...nextMessages, assistantMessage])
      await addMessage(conversationId, 'assistant', reply)
      await spendToken('AI coach')
    } catch {
      const fallbackText = t.localModelTimeout
      const fallback = { role: 'assistant', content: fallbackText }
      setMessages((current) => [...current, fallback])
      setProviderMode('local')
      await addMessage(conversationId, 'assistant', fallbackText)
      await spendToken('AI coach')
    } finally {
      setLoading(false)
      scrollToBottom()
    }
  }

  return (
    <div className="page-content page-fade" style={{ height: 'calc(100vh - 70px)', paddingBottom: 88 }}>
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>{t.aiCoach}</div>
        <div style={{ fontSize: 12, color: 'var(--t2)', marginTop: 3 }}>{t.aiCoachSubtitle}</div>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--b)', display: 'flex', gap: 8, alignItems: 'center', background: 'var(--bg2)' }}>
          <button className="btn btn-secondary" style={{ padding: '6px 11px', fontSize: 12 }} onClick={() => setShowList((current) => !current)}>
            <IconMessageSq size={13} /> {conversations.length}
          </button>
          <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: 'var(--t2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeConversation?.title || t.aiCoach}</div>
          <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={createNewConversation}>
            <IconPlus size={13} /> {t.newChat}
          </button>
        </div>

        {providerMode ? (
          <div style={{ padding: '8px 14px', background: providerMode === 'groq' ? 'rgba(80,128,240,.08)' : 'rgba(255,173,53,.08)', borderBottom: `1px solid ${providerMode === 'groq' ? 'rgba(80,128,240,.18)' : 'rgba(255,173,53,.18)'}`, fontSize: 12, color: providerMode === 'groq' ? 'var(--bl)' : 'var(--am)' }}>
            {providerMode === 'groq' ? 'Using Groq' : t.usingFallbackCoach}
          </div>
        ) : null}

        {showList ? (
          <div style={{ maxHeight: 220, overflowY: 'auto', background: 'var(--bg2)', borderBottom: '1px solid var(--b)' }}>
            {conversations.length === 0 ? <div style={{ padding: 20, textAlign: 'center', color: 'var(--t3)', fontSize: 13 }}>{t.noConversations}</div> : conversations.map((conversation) => (
              <div key={conversation.id} onClick={() => loadConversation(conversation.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', cursor: 'pointer', background: conversation.id === activeConversationId ? 'rgba(0,223,160,.05)' : 'transparent', borderBottom: '1px solid var(--b)' }}>
                <IconMessageSq size={14} color={conversation.id === activeConversationId ? 'var(--em)' : 'var(--t3)'} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: conversation.id === activeConversationId ? 'var(--em)' : 'var(--tx)' }}>{conversation.title}</div>
                  <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 1 }}>{formatDate(conversation.created_at)}</div>
                </div>
                <button onClick={(event) => removeConversation(conversation.id, event)} style={{ border: 'none', cursor: 'pointer', color: 'var(--t3)', padding: 4, display: 'flex', alignItems: 'center' }}>
                  <IconTrash size={13} />
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 8px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loadingConversations ? <div style={{ color: 'var(--t2)', fontSize: 13 }}>{t.loading}</div> : null}
          {!loadingConversations && messages.length === 0 ? <div style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.7 }}>{profile?.name ? `Hi ${profile.name}. ${t.coachIntro}` : t.coachIntro}</div> : null}
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} style={{ display: 'flex', justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start', gap: 8, alignItems: 'flex-end' }}>
              {message.role === 'assistant' ? <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--em)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconBot size={14} color="#040e18" /></div> : null}
              {message.role === 'user' ? (
                <div className="chat-user" style={{ whiteSpace: 'pre-line' }}>{message.content}</div>
              ) : (
                <div className="chat-assistant" dangerouslySetInnerHTML={{ __html: formatAssistantMessage(message.content) }} />
              )}
            </div>
          ))}
          {loading ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--em)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconBot size={14} color="#040e18" /></div>
              <div className="chat-assistant" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                {[0, 1, 2].map((index) => <div key={index} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--t2)', animation: 'pulseDots 1.2s infinite', animationDelay: `${index * 0.12}s` }} />)}
              </div>
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>

        {messages.length <= 1 ? (
          <div style={{ padding: '0 14px 8px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {suggestions.map((suggestion) => <button key={suggestion} onClick={() => send(suggestion)} style={{ background: 'var(--card2)', border: '1px solid var(--b)', borderRadius: 7, padding: '5px 11px', cursor: 'pointer', color: 'var(--t2)', fontSize: 12 }}>{suggestion}</button>)}
          </div>
        ) : null}

        <div style={{ padding: '8px 14px 12px', borderTop: '1px solid var(--b)', display: 'flex', gap: 8 }}>
          <input value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && !event.shiftKey && send()} placeholder={t.askCoach} style={{ flex: 1 }} />
          <button className="btn btn-primary" onClick={() => send()} disabled={!input.trim() || loading || loadingConversations} style={{ padding: '10px 14px' }}>
            {loading ? <span className="spinner" /> : <IconSend size={15} />}
          </button>
        </div>
      </div>
    </div>
  )
}
