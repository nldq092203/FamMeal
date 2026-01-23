import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { primaryNavItems } from '@/components/Navigation/navItems'
import { useFamily } from '@/context/FamilyContext'
import { useUnreadNotificationsCountQuery } from '@/query/hooks/useUnreadNotificationsCountQuery'

/**
 * Bottom tab navigation component
 */
export function TabNavigation() {
  const { familyId } = useFamily()
  const unreadCountQuery = useUnreadNotificationsCountQuery(familyId)
  const unreadCount = unreadCountQuery.data ?? 0

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
              <span className="relative">
                <Icon className={cn('h-5 w-5', isActive && 'stroke-[2.5]')} />
                {to === '/history' && unreadCount > 0 ? (
                  <span className="absolute -top-1 -right-2 min-w-4 h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] leading-none flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                ) : null}
              </span>
              <span className="nav-label">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
