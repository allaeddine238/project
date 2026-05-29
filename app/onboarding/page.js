// First-time setup route for users who have an account but no finished profile yet.
import { ProtectedRoute } from '@/components/layout/protected-route'
import { OnboardingScreen } from '@/components/screens/onboarding-screen'

export default function OnboardingPage() {
  return (
    <ProtectedRoute pageKey="dashboard" allowWithoutProfile>
      <OnboardingScreen />
    </ProtectedRoute>
  )
}
