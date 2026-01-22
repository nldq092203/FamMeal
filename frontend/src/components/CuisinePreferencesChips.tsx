import { useState } from 'react'
import { Utensils, Plus, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface CuisinePreferencesChipsProps {
  selected: string[]
  onChange: (selected: string[]) => void
}

const CUISINE_OPTIONS = [
  { value: 'Hot Dishes', label: 'Hot Dishes', icon: '🔥' },
  { value: 'Seafood', label: 'Seafood', icon: '🦐' },
  { value: 'Meat', label: 'Meat', icon: '🥩' },
]

export function CuisinePreferencesChips({ selected, onChange }: CuisinePreferencesChipsProps) {
  const [showCustom, setShowCustom] = useState(false)
  const [customInput, setCustomInput] = useState('')

  const toggleCuisine = (cuisine: string) => {
    if (selected.includes(cuisine)) {
      onChange(selected.filter((c) => c !== cuisine))
    } else {
      onChange([...selected, cuisine])
    }
  }

  const handleAddCustom = () => {
    const trimmed = customInput.trim()
    if (trimmed && !selected.includes(trimmed)) {
      onChange([...selected, trimmed])
      setCustomInput('')
      setShowCustom(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddCustom()
    } else if (e.key === 'Escape') {
      setShowCustom(false)
      setCustomInput('')
    }
  }

  // Custom cuisines are those not in the predefined list
  const customCuisines = selected.filter(
    (c) => !CUISINE_OPTIONS.some((p) => p.value === c)
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Utensils className="h-4 w-4" />
        <span>Cuisine Preferences</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {/* Predefined cuisines */}
        {CUISINE_OPTIONS.map((cuisine) => {
          const isSelected = selected.includes(cuisine.value)
          return (
            <button
              key={cuisine.value}
              type="button"
              onClick={() => toggleCuisine(cuisine.value)}
              className={`px-4 py-2 rounded-full text-sm transition-all ${
                isSelected
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <span className="mr-1.5">{cuisine.icon}</span>
              {cuisine.label}
            </button>
          )
        })}

        {/* Custom cuisines */}
        {customCuisines.map((cuisine) => (
          <button
            key={cuisine}
            type="button"
            onClick={() => toggleCuisine(cuisine)}
            className="px-4 py-2 rounded-full text-sm bg-primary text-primary-foreground font-medium transition-all"
          >
            {cuisine}
          </button>
        ))}

        {/* Add custom cuisine button */}
        {!showCustom && (
          <button
            type="button"
            onClick={() => setShowCustom(true)}
            className="px-4 py-2 rounded-full text-sm bg-background text-muted-foreground hover:bg-muted/50 transition-all border-2 border-dashed border-border hover:border-primary/50"
          >
            <Plus className="h-3.5 w-3.5 inline mr-1.5" />
            Other
          </button>
        )}
      </div>

      {/* Custom input field */}
      {showCustom && (
        <div className="flex items-center gap-2">
          <Input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter cuisine type..."
            className="flex-1 text-sm"
            autoFocus
          />
          <Button
            type="button"
            size="sm"
            onClick={handleAddCustom}
            disabled={!customInput.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setShowCustom(false)
              setCustomInput('')
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
