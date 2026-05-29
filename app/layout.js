// Root layout for the whole app.
// This is where global fonts, global CSS, and the shared app state get attached once.
import { Inter, DM_Sans } from 'next/font/google'
import './globals.css'
import { AppProvider } from '@/components/providers/app-provider'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata = {
  title: 'Trackily',
  description: 'Fitness, meals, workouts, and coaching in a clean Next.js app.',
}

// Every route renders inside this layout, so AppProvider becomes available everywhere.
export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${dmSans.variable}`} suppressHydrationWarning>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  )
}

