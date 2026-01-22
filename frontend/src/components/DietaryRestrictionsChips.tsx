import { useState } from 'react'
import { Check, Plus, Leaf, Wheat, Milk, Nut } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface DietaryRestrictionsChipsProps {
  selected: string[]
  onChange: (selected: string[]) => void
}

const COMMON_DIETARY = [
  { id: 'Vegetarian', label: 'Vegetarian', icon: <Leaf className="h-4 w-4" /> },
  { id: 'Gluten-free', label: 'Gluten-free', icon: <Wheat className="h-4 w-4" /> },
  { id: 'Vegan', label: 'Vegan', icon: <Leaf className="h-4 w-4" /> },
  { id: 'Nut-free', label: 'Nut-free', icon: <Nut className="h-4 w-4" /> },
  { id: 'Dairy-free', label: 'Dairy-free', icon: <Milk className="h-4 w-4" /> },
]

export function DietaryRestrictionsChips({ selected, onChange }: DietaryRestrictionsChipsProps) {
  const [showCustom, setShowCustom] = useState(false)
  const [customInput, setCustomInput] = useState('')

  const handleToggle = (id: string) => {
    onChange(
      selected.includes(id) 
        ? selected.filter(c => c !== id) 
        : [...selected, id]
    )
  }

  const handleAddCustom = () => {
    if (customInput.trim() && !selected.includes(customInput.trim())) {
      onChange([...selected, customInput.trim()])
      setCustomInput('')
    }
  }

  return (
    <section className="space-y-3">
      <div className="text-sm font-semibold text-foreground">Dietary Restrictions</div>
      <div className="flex flex-wrap gap-2 pref-chip-group">
        {COMMON_DIETARY.map(({ id, label, icon }) => {
          const isSelected = selected.includes(id)
          return (
            <button
              key={id}
              type="button"
              onClick={() => handleToggle(id)}
              className={`pref-chip ${isSelected ? 'pref-chip--selected' : ''}`}
            >
              <span className="pref-chip__icon" aria-hidden="true">
                {isSelected ? <Check className="h-4 w-4" /> : icon}
              </span>
              {label}
            </button>
          )
        })}
        <button 
          type="button" 
          className="pref-chip pref-chip--more" 
          onClick={() => setShowCustom(!showCustom)}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          More
        </button>
      </div>
      {showCustom && (
        <div className="flex gap-2">
          <Input
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Add restrictions (comma-separated)"
            className="text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddCustom()
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleAddCustom}
            disabled={!customInput.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )}
    </section>
  )
}
