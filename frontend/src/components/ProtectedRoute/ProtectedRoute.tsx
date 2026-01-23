import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="container" style={{ paddingTop: '2rem', display: 'flex', justifyContent: 'center' }}>
        <span className="spinner" aria-label="Loading" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />

  return <>{children}</>
}
