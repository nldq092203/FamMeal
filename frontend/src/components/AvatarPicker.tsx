import { avatars, type AvatarId } from '@/assets/avatars'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export function AvatarPicker({
  value,
  onChange,
}: {
  value: AvatarId
  onChange: (next: AvatarId) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {avatars.map((a) => (
        <Button
          key={a.id}
          type="button"
          variant="outline"
          onClick={() => onChange(a.id)}
          className={cn(
            'h-auto w-full justify-start gap-3 rounded-lg bg-card p-3 text-left transition-colors hover:bg-accent',
            value === a.id ? 'border-ring ring-2 ring-ring' : 'border-border'
          )}
        >
          <img
            src={a.src}
            alt={a.label}
            className="h-11 w-11 sm:h-12 sm:w-12 rounded-full border border-border object-cover"
          />
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">{a.label}</span>
            <span className="text-xs text-muted-foreground">{a.id}</span>
          </div>
        </Button>
      ))}
    </div>
  )
}
