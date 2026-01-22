import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Camera, Plus, X } from 'lucide-react'

const QUICK_ADD_SUGGESTIONS = ['Asparagus', 'Dill', 'Olive Oil', 'Garlic', 'Lemon', 'Salt', 'Pepper', 'Butter']

function addUnique(next: string, current: string[], setCurrent: (next: string[]) => void, setInput?: (v: string) => void) {
  const trimmed = next.trim()
  if (!trimmed) return
  if (current.includes(trimmed)) return
  setCurrent([...current, trimmed])
  setInput?.('')
}

function removeValue(value: string, current: string[], setCurrent: (next: string[]) => void) {
  setCurrent(current.filter((v) => v !== value))
}

export function ProposalEditorFields(props: {
  idPrefix?: string
  dishNameAutoFocus?: boolean
  dishName: string
  setDishName: (v: string) => void
  imageUrl: string
  setImageUrl: (v: string) => void
  ingredients: string[]
  setIngredients: (next: string[]) => void
  ingredientInput: string
  setIngredientInput: (v: string) => void
  notes: string[]
  setNotes: (next: string[]) => void
  noteInput: string
  setNoteInput: (v: string) => void
}) {
  const {
    idPrefix = 'proposal',
    dishNameAutoFocus,
    dishName,
    setDishName,
    imageUrl,
    setImageUrl,
    ingredients,
    setIngredients,
    ingredientInput,
    setIngredientInput,
    notes,
    setNotes,
    noteInput,
    setNoteInput,
  } = props

  return (
    <div className="p-5 space-y-4 overflow-y-auto flex-1">
      <div className="space-y-2">
        <Label
          htmlFor={`${idPrefix}-dish-name`}
          className="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
        >
          Dish Name
        </Label>
        <Input
          id={`${idPrefix}-dish-name`}
          value={dishName}
          onChange={(e) => setDishName(e.target.value)}
          placeholder="e.g. Lemon Herb Salmon"
          maxLength={100}
          className="text-lg"
          autoFocus={dishNameAutoFocus}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Photo</Label>
        <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Camera className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Add a photo</p>
              <p className="text-xs text-muted-foreground">or paste image URL</p>
            </div>
          </div>
          <Input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="mt-3"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Ingredients</Label>
          <button
            type="button"
            className="text-xs text-primary font-medium"
            onClick={() => document.getElementById(`${idPrefix}-ingredient-input`)?.focus()}
          >
            Tap to add
          </button>
        </div>

        {ingredients.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {ingredients.map((ingredient) => (
              <Badge key={ingredient} variant="secondary" className="bg-primary text-primary-foreground px-3 py-1.5 text-sm">
                {ingredient}
                <button
                  type="button"
                  onClick={() => removeValue(ingredient, ingredients, setIngredients)}
                  className="ml-2 hover:text-primary-foreground/70"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Input
            id={`${idPrefix}-ingredient-input`}
            value={ingredientInput}
            onChange={(e) => setIngredientInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addUnique(ingredientInput, ingredients, setIngredients, setIngredientInput)
              }
            }}
            placeholder="Type an ingredient and press Enter"
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => addUnique(ingredientInput, ingredients, setIngredients, setIngredientInput)}
            disabled={!ingredientInput.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Quick Add Suggestions:</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_ADD_SUGGESTIONS.filter((s) => !ingredients.includes(s)).map((suggestion) => (
              <Button
                key={suggestion}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addUnique(suggestion, ingredients, setIngredients)}
                className="text-xs h-8"
              >
                + {suggestion}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Notes (Optional)</Label>

        {notes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {notes.map((note) => (
              <Badge key={note} variant="outline" className="px-3 py-1.5 text-sm">
                {note}
                <button type="button" onClick={() => removeValue(note, notes, setNotes)} className="ml-2 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Input
            id={`${idPrefix}-note-input`}
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addUnique(noteInput, notes, setNotes, setNoteInput)
              }
            }}
            placeholder="Add a note and press Enter"
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => addUnique(noteInput, notes, setNotes, setNoteInput)}
            disabled={!noteInput.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
