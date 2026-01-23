import { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, ArrowRight, ArrowLeft, DollarSign, Clock } from 'lucide-react'
import { DietaryRestrictionsChips } from '@/components/DietaryRestrictionsChips'
import { CuisinePreferencesChips } from '@/components/CuisinePreferencesChips'
import { PreferenceSlider } from '@/pages/FamilySelect/components/PreferenceSlider'
import type { Meal, MealConstraints, MealType } from '@/types'
import { useToast } from '@/context/ToastContext'
import { getApiErrorMessage } from '@/api/error'
import { useUpdateMealMutation } from '@/query/hooks/useUpdateMealMutation'
import { MEAL_TYPES } from '@/pages/Meals/constants'

interface EditMealDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  meal: Meal
}

function toDateInputValue(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    // If backend already sends YYYY-MM-DD, keep it.
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
    return ''
  }
  return date.toISOString().slice(0, 10)
}

export function EditMealDialog({ open, onOpenChange, meal }: EditMealDialogProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const toast = useToast()
  const updateMealMutation = useUpdateMealMutation()

  const initialDate = useMemo(() => toDateInputValue(meal.scheduledFor ?? meal.date), [meal.date, meal.scheduledFor])
  const initialConstraints = useMemo<MealConstraints>(() => meal.constraints ?? {}, [meal.constraints])

  // Step 1: Basic Info
  const [scheduledDate, setScheduledDate] = useState(initialDate)
  const [mealType, setMealType] = useState<MealType>(meal.mealType)

  // Step 2: Constraints (optional)
  const [maxBudget, setMaxBudget] = useState(initialConstraints.maxBudget ?? 50)
  const [maxPrepTime, setMaxPrepTime] = useState(initialConstraints.maxPrepTime ?? 60)
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>(initialConstraints.dietaryRestrictions ?? [])
  const [cuisinePreferences, setCuisinePreferences] = useState<string[]>(initialConstraints.cuisinePreferences ?? [])
  const [servings, setServings] = useState(String(initialConstraints.servings ?? ''))

  useEffect(() => {
    if (!open) return
    setStep(1)
    setScheduledDate(initialDate)
    setMealType(meal.mealType)
    setMaxBudget(initialConstraints.maxBudget ?? 50)
    setMaxPrepTime(initialConstraints.maxPrepTime ?? 60)
    setDietaryRestrictions(initialConstraints.dietaryRestrictions ?? [])
    setCuisinePreferences(initialConstraints.cuisinePreferences ?? [])
    setServings(initialConstraints.servings ? String(initialConstraints.servings) : '')
  }, [open, initialConstraints, initialDate, meal.mealType])

  const handleSave = async () => {
    try {
      const constraints: MealConstraints = {
        maxBudget,
        maxPrepTime,
        dietaryRestrictions: dietaryRestrictions.length > 0 ? dietaryRestrictions : undefined,
        cuisinePreferences: cuisinePreferences.length > 0 ? cuisinePreferences : undefined,
        servings: servings ? Number(servings) : undefined,
      }

      await updateMealMutation.mutateAsync({
        mealId: meal.id,
        scheduledFor: scheduledDate || undefined,
        mealType,
        constraints,
      })

      onOpenChange(false)
      toast.success('Meal updated.')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update meal.'))
    }
  }

  const canProceedToStep2 = Boolean(scheduledDate && mealType)
  const isSaving = updateMealMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden max-h-[85vh] flex flex-col family-create-dialog">
        <DialogHeader className="family-create-header">
          <div className="family-create-header__left">
            {step === 2 ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setStep(1)}
                className="h-9 w-9 -ml-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            ) : null}
            <DialogTitle className="family-create-title" style={{ fontFamily: 'var(--font-family-display)' }}>
              {step === 1 ? 'Edit Meal' : 'Meal Constraints'}
            </DialogTitle>
          </div>
          <DialogClose>
            <Button variant="ghost" size="icon" aria-label="Close">
              <X className="h-5 w-5" />
            </Button>
          </DialogClose>
        </DialogHeader>

        {step === 1 ? (
          <>
            <div className="p-5 space-y-5 overflow-y-auto flex-1">
              <div className="space-y-3">
                <Label htmlFor="scheduled-date" className="text-sm font-semibold">
                  Scheduled Date
                </Label>
                <Input
                  id="scheduled-date"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">Status can’t be changed here.</p>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold">Meal Type</Label>
                <div className="grid grid-cols-3 gap-2">
                  {MEAL_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setMealType(type.value)}
                      className={`p-3 rounded-lg border-2 text-center transition-all duration-200 ${
                        mealType === type.value
                          ? 'border-primary bg-primary text-primary-foreground font-semibold shadow-md scale-105'
                          : 'border-border bg-background hover:border-primary/50 hover:shadow-sm hover:scale-102'
                      }`}
                    >
                      <div className="text-2xl mb-1">{type.emoji}</div>
                      <div className="text-xs">{type.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-border p-5">
              <Button
                className="w-full family-create-cta"
                size="lg"
                onClick={() => setStep(2)}
                disabled={!canProceedToStep2 || isSaving}
              >
                Continue <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="p-5 space-y-6 overflow-y-auto flex-1">
              <CuisinePreferencesChips selected={cuisinePreferences} onChange={setCuisinePreferences} />
              <DietaryRestrictionsChips selected={dietaryRestrictions} onChange={setDietaryRestrictions} />

              <div className="pref-divider" aria-hidden="true" />

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

              <div className="space-y-3">
                <Label htmlFor="servings" className="text-sm font-semibold">
                  Servings (Optional)
                </Label>
                <Input
                  id="servings"
                  type="number"
                  min="1"
                  max="20"
                  value={servings}
                  onChange={(e) => setServings(e.target.value)}
                  placeholder="4"
                />
              </div>
            </div>

            <div className="border-t border-border p-5">
              <Button className="w-full family-create-cta" size="lg" onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
