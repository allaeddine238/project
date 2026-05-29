'use client'

// Shared shell for logged-in pages.
// It keeps navigation and global overlays consistent across the protected app.
import { BottomNav, TopBar } from '@/components/layout/navigation'
import { useApp } from '@/components/providers/app-provider'
import { TokenModal } from '@/components/ui/token-modal'

export function AppShell({ pageKey, children }) {
  const { toast } = useApp()

  return (
    <div className="app-shell">
      <TopBar pageKey={pageKey} />
      {children}
      <BottomNav />
      {toast ? <div className="toast">{toast}</div> : null}
      <TokenModal />
    </div>
  )
}
