'use client'

// Route guard for the app.
// It decides whether a page is public, guest-only, or requires a finished profile.
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/components/providers/app-provider'
import { AppShell } from '@/components/layout/app-shell'
import { LoadingScreen } from '@/components/layout/loading-screen'
import { SetupRequired } from '@/components/layout/setup-required'
import { safeJsonParse } from '@/lib/utils'

function hasStoredProfile(userId) {
  if (typeof window === 'undefined' || !userId) return false
  const cached = safeJsonParse(window.localStorage.getItem(`trk_tokens_${userId}`), null)
  return Boolean(cached?.goal && cached?.daily_calorie_goal)
}

export function ProtectedRoute({ pageKey, allowWithoutProfile = false, guestOnly = false, children }) {
  // Keeping the redirect logic here avoids repeating auth checks in every page file.
  const router = useRouter()
  const { loading, session, profile, isSupabaseConfigured } = useApp()

  useEffect(() => {
    if (loading || !isSupabaseConfigured) return
    const storedProfile = hasStoredProfile(session?.id)

    if (guestOnly && session) {
      router.replace(profile || storedProfile ? '/dashboard' : '/onboarding')
      return
    }

    if (!guestOnly && !session) {
      router.replace('/')
      return
    }

    if (!guestOnly && !allowWithoutProfile && session && !profile && !storedProfile) {
      router.replace('/onboarding')
    }
  }, [allowWithoutProfile, guestOnly, isSupabaseConfigured, loading, profile, router, session])

  if (!isSupabaseConfigured) return <SetupRequired />
  if (loading) return <LoadingScreen />
  if (guestOnly && session) return <LoadingScreen />
  if (!guestOnly && !session) return <LoadingScreen />
  if (!guestOnly && !allowWithoutProfile && !profile && !hasStoredProfile(session?.id)) return <LoadingScreen />

  if (guestOnly) return children
  return <AppShell pageKey={pageKey}>{children}</AppShell>
}
