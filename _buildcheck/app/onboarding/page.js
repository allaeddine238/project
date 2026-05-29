import { ProtectedRoute } from '@/components/layout/protected-route'
import { OnboardingScreen } from '@/components/screens/onboarding-screen'

export default function OnboardingPage() {
  return (
    <ProtectedRoute pageKey="dashboard" allowWithoutProfile>
      <OnboardingScreen />
    </ProtectedRoute>
  )
}
