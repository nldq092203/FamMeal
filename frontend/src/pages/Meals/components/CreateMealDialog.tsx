import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, ArrowRight, ArrowLeft, DollarSign, Clock } from 'lucide-react'
import { DietaryRestrictionsChips } from '@/components/DietaryRestrictionsChips'
import { CuisinePreferencesChips } from '@/components/CuisinePreferencesChips'
import { PreferenceSlider } from '@/pages/FamilySelect/components/PreferenceSlider'
import type { MealType, MealConstraints } from '@/types'
import { useToast } from '@/context/ToastContext'
import { getApiErrorMessage } from '@/api/error'
import { useCreateMealMutation } from '@/query/hooks/useCreateMealMutation'

interface CreateMealDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  familyId: string
}

const MEAL_TYPES: { value: MealType; label: string; emoji: string }[] = [
  { value: 'BREAKFAST', label: 'Breakfast', emoji: '🍳' },
  { value: 'BRUNCH', label: 'Brunch', emoji: '🥐' },
  { value: 'LUNCH', label: 'Lunch', emoji: '🥗' },
  { value: 'DINNER', label: 'Dinner', emoji: '🍝' },
  { value: 'SNACK', label: 'Snack', emoji: '🍿' },
  { value: 'OTHER', label: 'Other', emoji: '🍽️' },
]

export function CreateMealDialog({ open, onOpenChange, familyId }: CreateMealDialogProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const toast = useToast()
  const createMealMutation = useCreateMealMutation()

  // Step 1: Basic Info
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('12:00')
  const [mealType, setMealType] = useState<MealType>('DINNER')

  // Step 2: Constraints (optional)
  const [maxBudget, setMaxBudget] = useState(50)
  const [maxPrepTime, setMaxPrepTime] = useState(60)
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([])
  const [cuisinePreferences, setCuisinePreferences] = useState<string[]>([])
  const [servings, setServings] = useState('4')

  const handleCreate = async () => {
    try {
      const scheduledFor = scheduledDate
      
      const constraints: MealConstraints = {
        maxBudget,
        maxPrepTime,
        dietaryRestrictions: dietaryRestrictions.length > 0 ? dietaryRestrictions : undefined,
        cuisinePreferences: cuisinePreferences.length > 0 ? cuisinePreferences : undefined,
        servings: servings ? parseInt(servings) : undefined,
      }

      await createMealMutation.mutateAsync({
        familyId,
        scheduledFor,
        mealType,
        constraints,
      })

      onOpenChange(false)
      resetForm()
      toast.success('Meal created.')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to create meal.'))
    }
  }

  const resetForm = () => {
    setStep(1)
    setScheduledDate('')
    setScheduledTime('12:00')
    setMealType('DINNER')
    setMaxBudget(50)
    setMaxPrepTime(60)
    setDietaryRestrictions([])
    setCuisinePreferences([])
    setServings('4')
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) resetForm()
    onOpenChange(open)
  }

  const canProceedToStep2 = scheduledDate && mealType
  const today = new Date().toISOString().split('T')[0]
  const isCreating = createMealMutation.isPending

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="overflow-hidden max-h-[85vh] flex flex-col family-create-dialog">
        <DialogHeader className="family-create-header">
          <div className="family-create-header__left">
            {step === 2 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setStep(1)}
                className="h-9 w-9 -ml-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <DialogTitle className="family-create-title" style={{ fontFamily: 'var(--font-family-display)' }}>
              {step === 1 ? 'Create Meal' : 'Meal Constraints'}
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
              {/* Date & Time */}
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
                    min={today}
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

              {/* Meal Type */}
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
                disabled={!canProceedToStep2 || isCreating}
              >
                Continue <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="p-5 space-y-6 overflow-y-auto flex-1">
              {/* Cuisine Preferences */}
              <CuisinePreferencesChips
                selected={cuisinePreferences}
                onChange={setCuisinePreferences}
              />

              {/* Dietary Restrictions */}
              <DietaryRestrictionsChips
                selected={dietaryRestrictions}
                onChange={setDietaryRestrictions}
              />

              <div className="pref-divider" aria-hidden="true" />

              {/* Budget & Prep Time Sliders */}
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

              {/* Servings */}
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
              <Button
                className="w-full family-create-cta"
                size="lg"
                onClick={handleCreate}
                disabled={isCreating}
              >
                {isCreating ? 'Creating…' : 'Create Meal'}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
