'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/components/providers/app-provider'
import { LoadingScreen } from '@/components/layout/loading-screen'
import { SetupRequired } from '@/components/layout/setup-required'
import { safeJsonParse } from '@/lib/utils'

function hasStoredProfile(userId) {
  if (typeof window === 'undefined' || !userId) return false
  const cached = safeJsonParse(window.localStorage.getItem(`trk_tokens_${userId}`), null)
  return Boolean(cached?.goal && cached?.daily_calorie_goal)
}

export default function HomePage() {
  const router = useRouter()
  const { loading, session, profile, isSupabaseConfigured } = useApp()

  useEffect(() => {
    if (loading || !isSupabaseConfigured) return
    const storedProfile = hasStoredProfile(session?.id)

    if (!session) {
      router.replace('/auth')
      return
    }

    if (!profile && !storedProfile) {
      router.replace('/onboarding')
      return
    }

    router.replace('/dashboard')
  }, [loading, session, profile, isSupabaseConfigured, router])

  if (!isSupabaseConfigured) {
    return <SetupRequired />
  }

  return <LoadingScreen />
}
