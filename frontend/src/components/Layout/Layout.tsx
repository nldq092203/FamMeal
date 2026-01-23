import { Outlet } from 'react-router-dom'
import { TabNavigation } from './TabNavigation'
import SidebarNav from '@/components/Navigation/SidebarNav'

/**
 * Main layout component with bottom tab navigation
 */
export default function Layout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="app-layout">
        <SidebarNav />

        {/* Main content area */}
        <main className="app-main min-h-screen overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Bottom tab navigation (hidden on desktop via CSS) */}
      <TabNavigation />
    </div>
  )
}
