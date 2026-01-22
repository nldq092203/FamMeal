import { NavLink } from 'react-router-dom'
import { UtensilsCrossed, History, Users, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { to: '/meals', icon: UtensilsCrossed, label: 'Meals' },
  { to: '/history', icon: History, label: 'History' },
  { to: '/family', icon: Users, label: 'Family' },
  { to: '/settings', icon: Settings, label: 'Settings' },
] as const

/**
 * Bottom tab navigation component
 */
export function TabNavigation() {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      {tabs.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => cn('nav-item', isActive && 'active')}
        >
          {({ isActive }) => (
            <>
              <Icon className={cn('h-5 w-5', isActive && 'stroke-[2.5]')} />
              <span className="nav-label">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
