'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useApp } from '@/components/providers/app-provider'
import {
  IconCoin,
  IconDumbbell,
  IconHome,
  IconMeals,
  IconMessageSq,
  IconMoon,
  IconSun,
  IconTrendingUp,
  IconUser,
  IconZap,
} from '@/components/ui/icons'

const navItems = [
  { href: '/dashboard', key: 'dashboard', icon: IconHome },
  { href: '/meals', key: 'meals', icon: IconMeals },
  { href: '/workouts', key: 'workouts', icon: IconDumbbell },
  { href: '/progress', key: 'progress', icon: IconTrendingUp },
  { href: '/ai-coach', key: 'aiCoach', icon: IconMessageSq },
  { href: '/profile', key: 'profile', icon: IconUser },
]

export function TopBar({ pageKey }) {
  const { t, dark, setDark, lang, setLang, profile, openTokenModal } = useApp()

  return (
    <div className="sticky-topbar">
      <div className="topbar-brand" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Link href="/dashboard" style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--em)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconZap size={16} color="#040e18" strokeWidth={2.4} />
        </Link>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, letterSpacing: '-.02em' }}>Trackily</span>
      </div>
      <div className="topbar-page-key" style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, color: 'var(--t2)' }}>{t[pageKey] || t.appName}</div>
      <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button onClick={openTokenModal} style={{ background: 'rgba(255,173,53,.09)', border: '1px solid rgba(255,173,53,.22)', borderRadius: 999, padding: '6px 10px', cursor: 'pointer', color: 'var(--am)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700 }}>
          <IconCoin size={14} color="var(--am)" /> {profile?.token_balance ?? 0}
        </button>
        <button onClick={() => setDark((value) => !value)} style={{ background: 'var(--card2)', border: '1px solid var(--b)', borderRadius: 8, padding: 6, cursor: 'pointer', color: 'var(--t2)', display: 'flex', alignItems: 'center' }}>
          {dark ? <IconSun size={16} /> : <IconMoon size={16} />}
        </button>
        <select value={lang} onChange={(event) => setLang(event.target.value)} style={{ width: 'auto', padding: '6px 8px', borderRadius: 8, fontSize: 12 }}>
          <option value="en">EN</option>
          <option value="fr">FR</option>
          <option value="ar">AR</option>
        </select>
      </div>
    </div>
  )
}

export function BottomNav() {
  const pathname = usePathname()
  const { t } = useApp()

  return (
    <div className="bottom-nav">
      <div className="bottom-nav-inner">
        {navItems.map(({ href, key, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href} className={`nav-item${active ? ' active' : ''}`}>
              <Icon size={18} />
              <span>{t[key]}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

