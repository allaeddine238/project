'use client'

// Public entry route.
// Guests see the intro page, while signed-in users are pushed into onboarding or the dashboard.
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/components/providers/app-provider'
import { LoadingScreen } from '@/components/layout/loading-screen'
import { SetupRequired } from '@/components/layout/setup-required'
import { PublicHomeScreen } from '@/components/screens/public-home-screen'
import { safeJsonParse } from '@/lib/utils'

function hasStoredProfile(userId) {
  if (typeof window === 'undefined' || !userId) return false
  const cached = safeJsonParse(window.localStorage.getItem(`trk_tokens_${userId}`), null)
  return Boolean(cached?.goal && cached?.daily_calorie_goal)
}

// HomePage mostly acts like a traffic controller for the three user states.
export default function HomePage() {
  const router = useRouter()
  const { loading, session, profile, isSupabaseConfigured } = useApp()

  useEffect(() => {
    if (loading || !isSupabaseConfigured) return
    // A small cached profile snapshot helps after refreshes and temporary connection issues.
    const storedProfile = hasStoredProfile(session?.id)

    if (!session) return

    if (!profile && !storedProfile) {
      router.replace('/onboarding')
      return
    }

    router.replace('/dashboard')
  }, [loading, session, profile, isSupabaseConfigured, router])

  if (!isSupabaseConfigured) {
    return <SetupRequired />
  }

  if (loading) {
    return <LoadingScreen />
  }

  if (!session) {
    return <PublicHomeScreen />
  }

  return <LoadingScreen />
}
