import { ProtectedRoute } from '@/components/layout/protected-route'
import { ProgressScreen } from '@/components/screens/progress-screen'

export default function ProgressPage() {
  return <ProtectedRoute pageKey="progress"><ProgressScreen /></ProtectedRoute>
}
