import { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, ArrowRight, ArrowLeft, DollarSign, Clock, Users, Plus } from 'lucide-react'
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
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
    return ''
  }
  return date.toISOString().slice(0, 10)
}

function toTimeInputValue(value?: string) {
  if (!value) return '18:00'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '18:00'
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

export function EditMealDialog({ open, onOpenChange, meal }: EditMealDialogProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const toast = useToast()
  const updateMealMutation = useUpdateMealMutation()

  const initialDate = useMemo(() => toDateInputValue(meal.scheduledFor ?? meal.date), [meal.date, meal.scheduledFor])
  const initialTime = useMemo(() => toTimeInputValue(meal.scheduledFor), [meal.scheduledFor])
  const initialConstraints = useMemo<MealConstraints>(() => meal.constraints ?? {}, [meal.constraints])

  // Step 1: Basic Info
  const [scheduledDate, setScheduledDate] = useState(initialDate)
  const [scheduledTime, setScheduledTime] = useState(initialTime)
  const [mealType, setMealType] = useState<MealType>(meal.mealType)

  // Step 2: Constraints (optional)
  const [isDiningOut, setIsDiningOut] = useState(Boolean(initialConstraints.isDiningOut))
  const [maxBudget, setMaxBudget] = useState(initialConstraints.maxBudget ?? 50)
  const [maxPrepTime, setMaxPrepTime] = useState(
    initialConstraints.maxPrepTimeMinutes ?? initialConstraints.maxPrepTime ?? 60
  )
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>(initialConstraints.dietaryRestrictions ?? [])
  const [cuisinePreferences, setCuisinePreferences] = useState<string[]>(initialConstraints.cuisinePreferences ?? [])
  const [servings, setServings] = useState(String(initialConstraints.servings ?? ''))

  useEffect(() => {
    if (!open) return
    setStep(1)
    setScheduledDate(initialDate)
    setScheduledTime(initialTime)
    setMealType(meal.mealType)
    setIsDiningOut(Boolean(initialConstraints.isDiningOut))
    setMaxBudget(initialConstraints.maxBudget ?? 50)
    setMaxPrepTime(initialConstraints.maxPrepTimeMinutes ?? initialConstraints.maxPrepTime ?? 60)
    setDietaryRestrictions(initialConstraints.dietaryRestrictions ?? [])
    setCuisinePreferences(initialConstraints.cuisinePreferences ?? [])
    setServings(initialConstraints.servings ? String(initialConstraints.servings) : '')
  }, [open, initialConstraints, initialDate, initialTime, meal.mealType])

  const handleSave = async () => {
    try {
      const constraints: MealConstraints = {
        isDiningOut,
        maxBudget,
        maxPrepTimeMinutes: isDiningOut ? undefined : maxPrepTime,
        dietaryRestrictions: dietaryRestrictions.length > 0 ? dietaryRestrictions : undefined,
        cuisinePreferences: cuisinePreferences.length > 0 ? cuisinePreferences : undefined,
        servings: servings ? Number(servings) : undefined,
      }

      await updateMealMutation.mutateAsync({
        mealId: meal.id,
          scheduledFor: new Date(`${scheduledDate}T${scheduledTime}`).toISOString(),
        mealType,
        constraints,
      })

      onOpenChange(false)
      toast.success('Meal updated.')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update meal.'))
    }
  }

  const canProceedToStep2 = Boolean(scheduledDate && scheduledTime && mealType)
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
                  Scheduled Date & Time
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="scheduled-date"
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-32"
                  />
                </div>
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
            {/* Step 2 Header with Dining Out Toggle - Overrides standard header title logic for step 2 */}
            <div className="px-5 pt-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold uppercase tracking-wider ${isDiningOut ? 'text-primary' : 'text-muted-foreground'}`}>
                  Dining Out
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isDiningOut}
                  onClick={() => setIsDiningOut(!isDiningOut)}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                    ${isDiningOut ? 'bg-primary' : 'bg-input'}
                  `}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${isDiningOut ? 'translate-x-6' : 'translate-x-1'}
                    `}
                  />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-5 overflow-y-auto flex-1 bg-muted/20">
              
              {/* Chips Section */}
              <div className="space-y-4">
                <CuisinePreferencesChips
                  selected={cuisinePreferences}
                  onChange={setCuisinePreferences}
                />
                <DietaryRestrictionsChips
                  selected={dietaryRestrictions}
                  onChange={setDietaryRestrictions}
                />
              </div>

              {/* Budget Card */}
              <div className="bg-card rounded-xl p-4 shadow-sm border border-border/50 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-foreground font-semibold">
                     <DollarSign className="h-4 w-4 text-muted-foreground" />
                     <span>Max Budget</span>
                  </div>
                  <span className="font-bold text-lg">
                    {isDiningOut ? '€' : '$'}{maxBudget}
                    <span className="text-xs font-normal text-muted-foreground ml-1">
                      /{isDiningOut ? 'person' : 'meal'}
                    </span>
                  </span>
                </div>
                <PreferenceSlider
                  label=""
                  icon={null} // Icon handled in header
                  value={maxBudget}
                  onChange={setMaxBudget}
                  min={10}
                  max={100}
                  step={5}
                  valueText="" // Handled in header
                  scaleLabels={
                    isDiningOut ? ['€10', '€50', '€100+'] : ['$10', '$50', '$100+']
                  }
                  hideHeader // We built our own header
                />
              </div>

              {/* Prep Time Card (Only if not dining out) */}
              {!isDiningOut && (
                <div className="bg-card rounded-xl p-4 shadow-sm border border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-foreground font-semibold">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Max Prep Time</span>
                  </div>
                  
                  <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-md hover:bg-white shadow-sm"
                      onClick={() => setMaxPrepTime(Math.max(15, maxPrepTime - 15))}
                      disabled={maxPrepTime <= 15}
                    >
                      <span className="text-lg font-medium leading-none mb-0.5">-</span>
                    </Button>
                    <span className="font-semibold w-16 text-center tabular-nums">
                      {maxPrepTime} min
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-md hover:bg-white shadow-sm"
                      onClick={() => setMaxPrepTime(Math.min(180, maxPrepTime + 15))}
                      disabled={maxPrepTime >= 180}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Servings / Family Size Card */}
              <div className="bg-card rounded-xl p-4 shadow-sm border border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-foreground font-semibold">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{isDiningOut ? 'Participants' : 'Family Size'}</span>
                </div>
                
                <div className="flex items-center gap-3 bg-muted/50 rounded-lg p-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-md hover:bg-white shadow-sm"
                    onClick={() => {
                      const current = parseInt(servings) || 4;
                      setServings(Math.max(1, current - 1).toString());
                    }}
                    disabled={(parseInt(servings) || 4) <= 1}
                  >
                    <span className="text-lg font-medium leading-none mb-0.5">-</span>
                  </Button>
                  <span className="font-semibold w-8 text-center tabular-nums">
                    {servings}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-md hover:bg-white shadow-sm"
                    onClick={() => {
                      const current = parseInt(servings) || 4;
                      setServings(Math.min(20, current + 1).toString());
                    }}
                    disabled={(parseInt(servings) || 4) >= 20}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

            </div>

            <div className="border-t border-border p-5 bg-background">
              <Button
                className="w-full family-create-cta h-12 text-base shadow-lg hover:shadow-xl transition-shadow"
                size="lg"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
