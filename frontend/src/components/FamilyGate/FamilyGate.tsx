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

  // If we have a familyId and the family data is loaded, allow access
  if (familyId && family) return <Outlet />

  // If we have a familyId but family data is not loaded yet, show loading
  // This prevents unnecessary redirects during page reload
  if (familyId && !family) {
    return (
      <div className="container" style={{ paddingTop: '2rem', display: 'flex', justifyContent: 'center' }}>
        <span className="spinner" aria-label="Loading" />
      </div>
    )
  }

  // Only redirect if there's truly no familyId or no families available
  const hasFamilies = families.length > 0
  if (!familyId || !hasFamilies) {
    return <Navigate to="/family-select" replace state={{ from: location }} />
  }

  return <Outlet />
}
