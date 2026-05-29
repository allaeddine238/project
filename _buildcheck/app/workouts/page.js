import { ProtectedRoute } from '@/components/layout/protected-route'
import { WorkoutsScreen } from '@/components/screens/workouts-screen'

export default function WorkoutsPage() {
  return <ProtectedRoute pageKey="workouts"><WorkoutsScreen /></ProtectedRoute>
}
