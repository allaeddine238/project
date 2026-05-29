// Main dashboard route after login and onboarding.
import { ProtectedRoute } from '@/components/layout/protected-route'
import { DashboardScreen } from '@/components/screens/dashboard-screen'

export default function DashboardPage() {
  return <ProtectedRoute pageKey="dashboard"><DashboardScreen /></ProtectedRoute>
}
