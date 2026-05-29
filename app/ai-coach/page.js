// AI coach route for chat-based help with meals, training, and recovery.
import { ProtectedRoute } from '@/components/layout/protected-route'
import { AICoachScreen } from '@/components/screens/ai-coach-screen'

export default function AICoachPage() {
  return <ProtectedRoute pageKey="aiCoach"><AICoachScreen /></ProtectedRoute>
}
