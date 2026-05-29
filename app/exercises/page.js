// This route currently redirects because exercises are surfaced through the main app flow instead.
import { redirect } from 'next/navigation'

export default function ExercisesPage() {
  redirect('/dashboard')
}
