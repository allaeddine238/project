import { ProtectedRoute } from '@/components/layout/protected-route'
import { ProfileScreen } from '@/components/screens/profile-screen'

export default function ProfilePage() {
  return <ProtectedRoute pageKey="profile"><ProfileScreen /></ProtectedRoute>
}
