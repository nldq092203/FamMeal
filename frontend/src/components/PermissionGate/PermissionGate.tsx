import type { ReactNode } from 'react'
import { useFamily } from '@/context/FamilyContext'
import { canUserPerformAction, type PermissionAction } from '@/utils/permissions'

interface PermissionGateProps {
  children: ReactNode
  requiredAction: PermissionAction
  fallback?: ReactNode
}

/**
 * Gate component that shows children only if user has permission
 * Shows fallback if provided, otherwise shows nothing
 */
export function PermissionGate({ children, requiredAction, fallback = null }: PermissionGateProps) {
  const { role } = useFamily()
  
  if (canUserPerformAction(role, requiredAction)) {
    return <>{children}</>
  }
  
  return <>{fallback}</>
}

interface AdminOnlyProps {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Shorthand component for admin-only content
 */
export function AdminOnly({ children, fallback = null }: AdminOnlyProps) {
  const { role } = useFamily()
  
  if (role === 'ADMIN') {
    return <>{children}</>
  }
  
  return <>{fallback}</>
}

interface MemberViewProps {
  children: ReactNode
}

/**
 * Component for member-only content (excludes admins)
 */
export function MemberView({ children }: MemberViewProps) {
  const { role } = useFamily()
  
  if (role === 'MEMBER') {
    return <>{children}</>
  }
  
  return null
}

/**
 * Hook to check permissions programmatically
 */
export function usePermission(action: PermissionAction): boolean {
  const { role } = useFamily()
  return canUserPerformAction(role, action)
}

/**
 * Hook to check if current user is admin
 */
export function useIsAdmin(): boolean {
  const { role } = useFamily()
  return role === 'ADMIN'
}
