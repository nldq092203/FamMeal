import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X, Plus, ArrowLeft, ArrowRight } from 'lucide-react'
import { useCreateProposalMutation } from '@/query/hooks/useCreateProposalMutation'
import { useToast } from '@/context/ToastContext'
import { getApiErrorMessage } from '@/api/error'
import { ProposalEditorFields } from './ProposalEditorFields'

interface AddProposalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mealId: string
  onSuccess: () => void
  isDiningOut?: boolean
}

export function AddProposalDialog({
  open,
  onOpenChange,
  mealId,
  onSuccess,
  isDiningOut,
}: AddProposalDialogProps) {
  const toast = useToast()
  const createProposal = useCreateProposalMutation()
  const [step, setStep] = useState<1 | 2>(1)
  const [dishName, setDishName] = useState('')
  const [ingredients, setIngredients] = useState<string[]>([])
  const [ingredientInput, setIngredientInput] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [restaurantName, setRestaurantName] = useState('')
  const [restaurantUrl, setRestaurantUrl] = useState('')
  const [notes, setNotes] = useState<string[]>([])
  const [noteInput, setNoteInput] = useState('')

  useEffect(() => {
    if (!open) return
    setStep(1)
    if (isDiningOut) {
      setIngredients([])
      setIngredientInput('')
    }
  }, [open, isDiningOut])

  const handleSubmit = async () => {
    if (!dishName.trim()) return
    const trimmedRestaurantName = restaurantName.trim()
    const trimmedRestaurantUrl = restaurantUrl.trim()

    if (isDiningOut && (trimmedRestaurantName || trimmedRestaurantUrl) && !trimmedRestaurantName) {
      toast.error('Restaurant name is required when adding restaurant info.')
      return
    }

    try {
      // Convert arrays to text format for API
      const ingredientsText = ingredients.length > 0 ? ingredients.join(', ') : undefined
      const notesText = notes.length > 0 ? notes.join('\n') : undefined

      const extra: {
        imageUrls?: string[]
        restaurant?: { name: string; addressUrl?: string }
      } = {}

      if (imageUrl.trim()) extra.imageUrls = [imageUrl.trim()]
      if (isDiningOut && trimmedRestaurantName) {
        extra.restaurant = {
          name: trimmedRestaurantName,
          addressUrl: trimmedRestaurantUrl ? trimmedRestaurantUrl : undefined,
        }
      }
      
      await createProposal.mutateAsync({
        mealId,
        dishName: dishName.trim(),
        ingredients: ingredientsText,
        notes: notesText,
        extra: Object.keys(extra).length > 0 ? extra : undefined,
      })

      onSuccess()
      onOpenChange(false)
      resetForm()
      toast.success('Proposal posted.')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to post proposal.'))
    }
  }

  const resetForm = () => {
    setStep(1)
    setDishName('')
    setIngredients([])
    setIngredientInput('')
    setImageUrl('')
    setRestaurantName('')
    setRestaurantUrl('')
    setNotes([])
    setNoteInput('')
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) resetForm()
    onOpenChange(open)
  }

  const canContinue = Boolean(dishName.trim())
  const isSubmitting = createProposal.isPending

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="overflow-hidden max-h-[85vh] flex flex-col family-create-dialog">
        <DialogHeader className="family-create-header">
          <div className="flex items-center justify-between gap-3">
            <DialogClose>
              <Button variant="ghost" size="icon" aria-label="Close">
                <X className="h-5 w-5" />
              </Button>
            </DialogClose>

            <div className="flex-1">
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary transition-[width] duration-300"
                  style={{ width: step === 1 ? '50%' : '100%' }}
                  aria-hidden="true"
                />
              </div>
            </div>

            {/* Spacer keeps the progress centered (matches close button width) */}
            <div className="h-10 w-10" aria-hidden="true" />
          </div>

          <div className="pt-2">
            <DialogTitle
              className="text-3xl font-bold tracking-tight text-primary"
              style={{ fontFamily: 'var(--font-family-display)' }}
            >
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {step === 1 ? 'Step 1 of 2: The Basics' : 'Step 2 of 2: Notes & Restaurant'}
            </p>
          </div>
        </DialogHeader>

        <ProposalEditorFields
          idPrefix="add-proposal"
          dishNameAutoFocus={step === 1}
          variant={step === 1 ? 'meal' : 'details'}
          dishName={dishName}
          setDishName={setDishName}
          imageUrl={imageUrl}
          setImageUrl={setImageUrl}
          showRestaurantFields={Boolean(isDiningOut)}
          isDiningOut={Boolean(isDiningOut)}
          restaurantName={restaurantName}
          setRestaurantName={setRestaurantName}
          restaurantUrl={restaurantUrl}
          setRestaurantUrl={setRestaurantUrl}
          ingredients={ingredients}
          setIngredients={setIngredients}
          ingredientInput={ingredientInput}
          setIngredientInput={setIngredientInput}
          notes={notes}
          setNotes={setNotes}
          noteInput={noteInput}
          setNoteInput={setNoteInput}
        />

        {/* Footer Actions */}
        <div className="border-t border-border p-5">
          <div className="flex gap-3">
            {step === 1 ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={isSubmitting}
                  className="flex-1 h-12"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => setStep(2)}
                  disabled={!canContinue || isSubmitting}
                  className="flex-1 h-12 bg-primary text-primary-foreground"
                >
                  Next <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  disabled={isSubmitting}
                  className="flex-1 h-12"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!dishName.trim() || isSubmitting}
                  className="flex-1 h-12 bg-primary text-primary-foreground"
                >
                  {isSubmitting ? 'Posting...' : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Post Proposal
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
