import { Outlet } from 'react-router-dom'
import { TabNavigation } from './TabNavigation'

/**
 * Main layout component with bottom tab navigation
 */
export default function Layout() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Main content area */}
      <main
        className="flex-1 overflow-y-auto"
        style={{ paddingBottom: 'calc(var(--app-bottom-nav-space) + env(safe-area-inset-bottom))' }}
      >
        <Outlet />
      </main>
      
      {/* Bottom tab navigation */}
      <TabNavigation />
    </div>
  )
}
