// Guest-only auth route.
import { ProtectedRoute } from '@/components/layout/protected-route'
import { AuthScreen } from '@/components/screens/auth-screen'

export default function AuthPage() {
  return (
    <ProtectedRoute pageKey="dashboard" guestOnly>
      <AuthScreen />
    </ProtectedRoute>
  )
}
