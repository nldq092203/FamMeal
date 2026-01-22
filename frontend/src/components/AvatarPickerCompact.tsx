import { Check } from 'lucide-react'
import { useState } from 'react'
import { getAvatarSrc, avatars, type AvatarId } from '@/assets/avatars'

interface AvatarPickerCompactProps {
  value: AvatarId
  onChange: (avatarId: AvatarId) => void
  size?: 'sm' | 'md' | 'lg'
  title?: string
  subtitle?: string
}

export function AvatarPickerCompact({ 
  value, 
  onChange, 
  size = 'md',
  title = 'Family Avatar',
  subtitle = 'Choose a mascot for your family'
}: AvatarPickerCompactProps) {
  const [showAll, setShowAll] = useState(false)

  const sizes = {
    sm: { main: 'h-16 w-16', badge: 'h-5 w-5', grid: 'h-10 w-10', row: 'h-12 w-12' },
    md: { main: 'h-20 w-20', badge: 'h-6 w-6', grid: 'h-10 w-10', row: 'h-12 w-12' },
    lg: { main: 'h-24 w-24', badge: 'h-7 w-7', grid: 'h-12 w-12', row: 'h-14 w-14' },
  }

  const currentSize = sizes[size]

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className={size === 'lg' ? 'text-base font-semibold mb-1' : 'text-sm font-semibold mb-1'}>{title}</h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>

      {/* Large Selected Avatar */}
      <div className="flex justify-center">
        <div className="relative">
          <div className={`${currentSize.main} rounded-full border-4 border-border overflow-hidden bg-background`}>
            <img src={getAvatarSrc(value)} alt="Selected avatar" className="h-full w-full object-cover" />
          </div>
          <div className={`absolute bottom-0 right-0 ${currentSize.badge} rounded-full bg-primary text-primary-foreground flex items-center justify-center border-2 border-background`}>
            <Check className="h-3 w-3" />
          </div>
        </div>
      </div>

      {/* Avatar Selection Grid */}
      <div className="space-y-3">
        <div className={size === 'lg' ? 'flex justify-center gap-3' : 'flex justify-center gap-2'}>
          {avatars.slice(0, 4).map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => onChange(a.id)}
              className={`relative ${size === 'lg' ? 'flex flex-col items-center gap-1 p-2' : 'p-1.5'} rounded-lg transition-all ${
                value === a.id ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
              }`}
            >
              <div className={`${currentSize.row} rounded-full border-2 border-border overflow-hidden ${size === 'lg' ? 'bg-background' : ''}`}>
                <img src={a.src} alt={a.label} className="h-full w-full object-cover" />
              </div>
              {size === 'lg' && <span className="text-xs font-medium text-muted-foreground">{a.label}</span>}
            </button>
          ))}
        </div>

        {showAll && (
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-border">
            {avatars.slice(4).map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => onChange(a.id)}
                className={`relative ${size === 'lg' ? 'flex flex-col items-center gap-1 p-2' : 'p-1.5'} rounded-lg transition-all ${
                  value === a.id ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                }`}
              >
                <div className={`${currentSize.grid} rounded-full border-2 border-border overflow-hidden`}>
                  <img src={a.src} alt={a.label} className="h-full w-full object-cover" />
                </div>
                {size === 'lg' && <span className="text-[10px] font-medium text-muted-foreground truncate max-w-full">{a.label}</span>}
              </button>
            ))}
          </div>
        )}

        {avatars.length > 4 && (
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className={`w-full text-sm text-primary hover:text-primary/80 font-medium ${size === 'lg' ? 'py-2' : 'py-1'} transition-colors`}
          >
            {showAll ? 'Show Less' : `+ More (${avatars.length - 4})`}
          </button>
        )}
      </div>
    </div>
  )
}
