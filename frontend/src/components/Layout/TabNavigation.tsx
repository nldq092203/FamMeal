import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { primaryNavItems } from '@/components/Navigation/navItems'

/**
 * Bottom tab navigation component
 */
export function TabNavigation() {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      {primaryNavItems.map(({ to, icon: Icon, label }) => (
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
