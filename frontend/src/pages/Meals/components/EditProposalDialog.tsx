import { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X, Save } from 'lucide-react'
import type { Proposal } from '@/types'
import { useUpdateProposalMutation } from '@/query/hooks/useUpdateProposalMutation'
import { useToast } from '@/context/ToastContext'
import { getApiErrorMessage } from '@/api/error'
import { ProposalEditorFields } from './ProposalEditorFields'

function parseCommaList(value: string | undefined) {
  if (!value) return []
  return value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
}

function parseLineList(value: string | undefined) {
  if (!value) return []
  return value
    .split('\n')
    .map((v) => v.trim())
    .filter(Boolean)
}

interface EditProposalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mealId: string
  proposal: Proposal | null
  isDiningOut?: boolean
}

export function EditProposalDialog({ open, onOpenChange, mealId, proposal, isDiningOut }: EditProposalDialogProps) {
  const toast = useToast()
  const updateProposal = useUpdateProposalMutation()

  const initial = useMemo(() => {
    return {
      dishName: proposal?.dishName ?? '',
      ingredients: parseCommaList(proposal?.ingredients),
      notes: parseLineList(proposal?.notes),
      imageUrl: proposal?.extra?.imageUrls?.[0] ?? '',
      restaurantName: proposal?.extra?.restaurant?.name ?? '',
      restaurantUrl: proposal?.extra?.restaurant?.addressUrl ?? '',
    }
  }, [
    proposal?.dishName,
    proposal?.extra?.imageUrls,
    proposal?.extra?.restaurant?.name,
    proposal?.extra?.restaurant?.addressUrl,
    proposal?.ingredients,
    proposal?.notes,
  ])

  const [dishName, setDishName] = useState(initial.dishName)
  const [ingredients, setIngredients] = useState<string[]>(initial.ingredients)
  const [ingredientInput, setIngredientInput] = useState('')
  const [notes, setNotes] = useState<string[]>(initial.notes)
  const [noteInput, setNoteInput] = useState('')
  const [imageUrl, setImageUrl] = useState(initial.imageUrl)
  const [restaurantName, setRestaurantName] = useState(initial.restaurantName)
  const [restaurantUrl, setRestaurantUrl] = useState(initial.restaurantUrl)

  useEffect(() => {
    if (!open) return
    setDishName(initial.dishName)
    setIngredients(initial.ingredients)
    setIngredientInput('')
    setNotes(initial.notes)
    setNoteInput('')
    setImageUrl(initial.imageUrl)
    setRestaurantName(initial.restaurantName)
    setRestaurantUrl(initial.restaurantUrl)
  }, [initial.dishName, initial.imageUrl, initial.ingredients, initial.notes, initial.restaurantName, initial.restaurantUrl, open])

  const handleSubmit = async () => {
    if (!proposal) return
    if (!dishName.trim()) {
      toast.error('Dish name is required.')
      return
    }

    const trimmedRestaurantName = restaurantName.trim()
    const trimmedRestaurantUrl = restaurantUrl.trim()
    const shouldShowRestaurantFields = Boolean(isDiningOut) || Boolean(initial.restaurantName || initial.restaurantUrl)

    if (shouldShowRestaurantFields && (trimmedRestaurantName || trimmedRestaurantUrl) && !trimmedRestaurantName) {
      toast.error('Restaurant name is required when adding restaurant info.')
      return
    }

    try {
      const ingredientsText = ingredients.length > 0 ? ingredients.join(', ') : undefined
      const notesText = notes.length > 0 ? notes.join('\n') : undefined

      const extra: {
        imageUrls?: string[]
        restaurant?: { name: string; addressUrl?: string }
      } = {}

      if (imageUrl.trim()) extra.imageUrls = [imageUrl.trim()]
      if (shouldShowRestaurantFields && trimmedRestaurantName) {
        extra.restaurant = {
          name: trimmedRestaurantName,
          addressUrl: trimmedRestaurantUrl ? trimmedRestaurantUrl : undefined,
        }
      }

      await updateProposal.mutateAsync({
        proposalId: proposal.id,
        mealId,
        dishName: dishName.trim(),
        ingredients: ingredientsText,
        notes: notesText,
        extra: Object.keys(extra).length > 0 ? extra : undefined,
      })
      toast.success('Proposal updated.')
      onOpenChange(false)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to update proposal.'))
    }
  }

  const isSaving = updateProposal.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden max-h-[85vh] flex flex-col family-create-dialog">
        <DialogHeader className="family-create-header">
          <div className="family-create-header__left">
            <DialogTitle className="family-create-title" style={{ fontFamily: 'var(--font-family-display)' }}>
              Edit Proposal
            </DialogTitle>
          </div>
          <DialogClose>
            <Button variant="ghost" size="icon" aria-label="Close">
              <X className="h-5 w-5" />
            </Button>
          </DialogClose>
        </DialogHeader>

        <ProposalEditorFields
          idPrefix="edit-proposal"
          dishNameAutoFocus
          dishName={dishName}
          setDishName={setDishName}
          imageUrl={imageUrl}
          setImageUrl={setImageUrl}
          showRestaurantFields={Boolean(isDiningOut) || Boolean(initial.restaurantName || initial.restaurantUrl)}
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

        <div className="border-t border-border p-5">
          <Button className="w-full family-create-cta" size="lg" onClick={handleSubmit} disabled={isSaving || !proposal}>
            <Save className="h-5 w-5 mr-2" />
            {isSaving ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
