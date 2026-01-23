import * as React from 'react'
import { createPortal } from 'react-dom'

import { cn } from '@/lib/utils'

type DialogContextValue = {
  open: boolean
  setOpen: (next: boolean) => void
}

const DialogContext = React.createContext<DialogContextValue | null>(null)

function useDialogContext() {
  const ctx = React.useContext(DialogContext)
  if (!ctx) throw new Error('Dialog components must be used within <Dialog>')
  return ctx
}

function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}) {
  const value = React.useMemo<DialogContextValue>(
    () => ({ open, setOpen: onOpenChange }),
    [open, onOpenChange]
  )
  return <DialogContext.Provider value={value}>{children}</DialogContext.Provider>
}

function DialogTrigger({ children }: { children: React.ReactElement }) {
  const { setOpen } = useDialogContext()
  const childProps = children.props as { onClick?: (e: React.MouseEvent) => void }
  return React.cloneElement(children, {
    onClick: (e: React.MouseEvent) => {
      childProps.onClick?.(e)
      setOpen(true)
    },
  } as unknown as Partial<typeof childProps>)
}

function DialogPortal({ children }: { children: React.ReactNode }) {
  return createPortal(children, document.body)
}

function DialogOverlay({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { setOpen } = useDialogContext()
  return (
    <div
      className={cn('fixed inset-0 z-[700] bg-black/65 backdrop-blur-[1px]', className)}
      onMouseDown={() => setOpen(false)}
      {...props}
    />
  )
}

function DialogContent({
  className,
  containerClassName,
  overlayClassName,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode
  containerClassName?: string
  overlayClassName?: string
}) {
  const { open, setOpen } = useDialogContext()

  React.useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, setOpen])

  React.useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  return (
    <DialogPortal>
      <DialogOverlay className={overlayClassName} />
      <div
        className={cn('fixed inset-0 z-[710] flex items-center justify-center p-4', containerClassName)}
        onMouseDown={() => setOpen(false)}
      >
        <div
          role="dialog"
          aria-modal="true"
          className={cn(
            'w-full max-w-md rounded-2xl border bg-card text-card-foreground shadow-2xl ring-1 ring-border',
            className
          )}
          style={{ backgroundColor: 'var(--card)' }}
          onMouseDown={(e) => e.stopPropagation()}
          {...props}
        >
          {children}
        </div>
      </div>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center justify-between p-5', className)} {...props} />
}

function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('text-xl font-bold tracking-tight', className)} {...props} />
}

function DialogClose({ children }: { children: React.ReactElement }) {
  const { setOpen } = useDialogContext()
  const childProps = children.props as { onClick?: (e: React.MouseEvent) => void }
  return React.cloneElement(children, {
    onClick: (e: React.MouseEvent) => {
      childProps.onClick?.(e)
      setOpen(false)
    },
  } as unknown as Partial<typeof childProps>)
}

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogClose }
