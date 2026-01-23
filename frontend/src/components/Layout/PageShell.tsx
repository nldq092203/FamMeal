import type { PropsWithChildren } from 'react'
import { cn } from '@/lib/utils'

type PageShellProps = PropsWithChildren<{
  className?: string
  density?: 'default' | 'tight'
}>

export function PageShell({ children, className, density = 'default' }: PageShellProps) {
  return (
    <div className={cn('app-frame', density === 'tight' ? 'app-content-tight' : 'app-content', className)}>
      {children}
    </div>
  )
}

