import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type PageHeaderProps = {
  title: ReactNode
  subtitle?: ReactNode
  align?: 'left' | 'center'
  left?: ReactNode
  right?: ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, align = 'left', left, right, className }: PageHeaderProps) {
  const isCentered = align === 'center'
  const hasSides = Boolean(left) || Boolean(right)

  return (
    <header className={cn('page-header', className)}>
      <div className={cn(hasSides ? 'grid grid-cols-[auto_1fr_auto] items-start gap-4' : 'block')}>
        {hasSides ? <div className="shrink-0">{left}</div> : null}

        <div className={cn('min-w-0', isCentered ? 'text-center' : '')}>
          <h1 className="t-page-title">{title}</h1>
          {subtitle ? (
            <div className={cn('t-body-sm text-muted-foreground mt-1', isCentered ? 'text-center' : '')}>
              {subtitle}
            </div>
          ) : null}
        </div>

        {hasSides ? <div className="shrink-0">{right}</div> : null}
      </div>
    </header>
  )
}
