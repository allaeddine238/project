import { ProtectedRoute } from '@/components/layout/protected-route'
import { MealsScreen } from '@/components/screens/meals-screen'

export default function MealsPage() {
  return <ProtectedRoute pageKey="meals"><MealsScreen /></ProtectedRoute>
}
