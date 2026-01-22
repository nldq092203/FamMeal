import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useFamily } from '@/context/FamilyContext'

export function FamilyGate() {
  const { familyId, family, families, isLoading } = useFamily()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="container" style={{ paddingTop: '2rem', display: 'flex', justifyContent: 'center' }}>
        <span className="spinner" aria-label="Loading" />
      </div>
    )
  }

  const isSelectorRoute = location.pathname === '/family-select' || location.pathname.startsWith('/family-select/')
  const isSettingsRoute = location.pathname === '/settings' || location.pathname.startsWith('/settings/')
  if (isSelectorRoute || isSettingsRoute) return <Outlet />

  if (familyId && family) return <Outlet />

  const hasFamilies = families.length > 0
  if (!familyId || !hasFamilies) {
    return <Navigate to="/family-select" replace state={{ from: location }} />
  }

  return <Outlet />
}
