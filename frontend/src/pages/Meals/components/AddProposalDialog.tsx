import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X, Plus } from 'lucide-react'
import { useCreateProposalMutation } from '@/query/hooks/useCreateProposalMutation'
import { ProposalEditorFields } from './ProposalEditorFields'

interface AddProposalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mealId: string
  onSuccess: () => void
}

export function AddProposalDialog({
  open,
  onOpenChange,
  mealId,
  onSuccess
}: AddProposalDialogProps) {
  const createProposal = useCreateProposalMutation()
  const [dishName, setDishName] = useState('')
  const [ingredients, setIngredients] = useState<string[]>([])
  const [ingredientInput, setIngredientInput] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [notes, setNotes] = useState<string[]>([])
  const [noteInput, setNoteInput] = useState('')

  const handleSubmit = async () => {
    if (!dishName.trim()) return

    try {
      // Convert arrays to text format for API
      const ingredientsText = ingredients.length > 0 ? ingredients.join(', ') : undefined
      const notesText = notes.length > 0 ? notes.join('\n') : undefined
      
      await createProposal.mutateAsync({
        mealId,
        dishName: dishName.trim(),
        ingredients: ingredientsText,
        notes: notesText,
        extra: imageUrl.trim() ? { imageUrls: [imageUrl.trim()] } : undefined,
      })

      onSuccess()
      onOpenChange(false)
      resetForm()
    } catch (error) {
      console.error('Failed to create proposal:', error)
      // TODO: Show error toast
    }
  }

  const resetForm = () => {
    setDishName('')
    setIngredients([])
    setIngredientInput('')
    setImageUrl('')
    setNotes([])
    setNoteInput('')
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) resetForm()
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="overflow-hidden max-h-[85vh] flex flex-col family-create-dialog">
        <DialogHeader className="family-create-header">
          <div className="family-create-header__left">
            <DialogTitle className="family-create-title" style={{ fontFamily: 'var(--font-family-display)' }}>
              Suggest a Meal
            </DialogTitle>
          </div>
          <DialogClose>
            <Button variant="ghost" size="icon" aria-label="Close">
              <X className="h-5 w-5" />
            </Button>
          </DialogClose>
        </DialogHeader>

        <ProposalEditorFields
          idPrefix="add-proposal"
          dishNameAutoFocus
          dishName={dishName}
          setDishName={setDishName}
          imageUrl={imageUrl}
          setImageUrl={setImageUrl}
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
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={createProposal.isPending}
              className="flex-1 h-12"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!dishName.trim() || createProposal.isPending}
              className="flex-1 h-12 bg-primary text-primary-foreground"
            >
              {createProposal.isPending ? 'Posting...' : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Post Proposal
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
