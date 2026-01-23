import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X, DollarSign, Clock } from 'lucide-react'
import { DietaryRestrictionsChips } from '@/components/DietaryRestrictionsChips'
import { CuisinePreferencesChips } from '@/components/CuisinePreferencesChips'
import { PreferenceSlider } from '@/pages/FamilySelect/components/PreferenceSlider'

interface FamilyPreferences {
  cuisines: string[]
  dietaryRestrictions: string[]
  maxBudget: number
  maxPrepTime: number
}

interface EditPreferencesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentPreferences: FamilyPreferences
  onSave: (preferences: FamilyPreferences) => Promise<void>
}

export function EditPreferencesDialog({
  open,
  onOpenChange,
  currentPreferences,
  onSave
}: EditPreferencesDialogProps) {
  const [cuisines, setCuisines] = useState<string[]>(currentPreferences.cuisines)
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>(currentPreferences.dietaryRestrictions)
  const [maxBudget, setMaxBudget] = useState(currentPreferences.maxBudget)
  const [maxPrepTime, setMaxPrepTime] = useState(currentPreferences.maxPrepTime)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave({
        cuisines,
        dietaryRestrictions,
        maxBudget,
        maxPrepTime
      })
      onOpenChange(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset to current values when closing
      setCuisines(currentPreferences.cuisines)
      setDietaryRestrictions(currentPreferences.dietaryRestrictions)
      setMaxBudget(currentPreferences.maxBudget)
      setMaxPrepTime(currentPreferences.maxPrepTime)
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="overflow-hidden max-h-[85vh] flex flex-col family-create-dialog">
        <DialogHeader className="family-create-header">
          <div className="family-create-header__left">
            <DialogTitle className="family-create-title" style={{ fontFamily: 'var(--font-family-display)' }}>
              Preferences
            </DialogTitle>
          </div>
          <DialogClose>
            <Button variant="ghost" size="icon" aria-label="Close">
              <X className="h-5 w-5" />
            </Button>
          </DialogClose>
        </DialogHeader>

        <div className="p-5 space-y-6 overflow-y-auto flex-1">
          {/* Cuisine Preferences */}
          <CuisinePreferencesChips selected={cuisines} onChange={setCuisines} />

          {/* Dietary Restrictions */}
          <DietaryRestrictionsChips selected={dietaryRestrictions} onChange={setDietaryRestrictions} />

          <div className="pref-divider" aria-hidden="true" />

          {/* Budget & Prep Time */}
          <div className="space-y-3">
            <div className="text-sm font-semibold text-foreground">Budget & Prep Time</div>
            <div className="pref-sliders">
              <PreferenceSlider
                label="Max Budget"
                icon={<DollarSign className="h-4 w-4" />}
                value={maxBudget}
                onChange={setMaxBudget}
                min={10}
                max={100}
                step={5}
                valueText={`$${maxBudget}/meal`}
                scaleLabels={['$10', '$50', '$100+']}
              />
              <PreferenceSlider
                label="Max Prep Time"
                icon={<Clock className="h-4 w-4" />}
                value={maxPrepTime}
                onChange={setMaxPrepTime}
                min={15}
                max={120}
                step={15}
                valueText={`${maxPrepTime} mins`}
                scaleLabels={['15m', '60m', '2h+']}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-border p-5">
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
