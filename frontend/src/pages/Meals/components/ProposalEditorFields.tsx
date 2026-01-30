import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Camera, Plus, X, Utensils, Map as MapIcon, Link as LinkIcon, ArrowRight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

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
  variant?: 'all' | 'meal' | 'details'
  dishName: string
  setDishName: (v: string) => void
  imageUrl: string
  setImageUrl: (v: string) => void
  showRestaurantFields?: boolean
  restaurantName?: string
  setRestaurantName?: (v: string) => void
  restaurantUrl?: string
  setRestaurantUrl?: (v: string) => void
  ingredients: string[]
  setIngredients: (next: string[]) => void
  ingredientInput: string
  setIngredientInput: (v: string) => void
  notes: string[]
  setNotes: (next: string[]) => void
  noteInput: string
  setNoteInput: (v: string) => void

  isDiningOut?: boolean
}) {
  const {
    idPrefix = 'proposal',
    dishNameAutoFocus,
    variant = 'all',
    dishName,
    setDishName,
    imageUrl,
    setImageUrl,
    showRestaurantFields,
    restaurantName,
    setRestaurantName,
    restaurantUrl,
    setRestaurantUrl,
    ingredients,
    setIngredients,
    ingredientInput,
    setIngredientInput,
    notes,
    setNotes,
    noteInput,
    setNoteInput,

    isDiningOut,
  } = props

  const showMeal = variant === 'all' || variant === 'meal'
  const showDetails = variant === 'all' || variant === 'details'

  const [copied, setCopied] = useState(false)
  const restaurantUrlValid = useMemo(() => {
    if (!restaurantUrl?.trim()) return false
    try {
      void new URL(restaurantUrl.trim())
      return true
    } catch {
      return false
    }
  }, [restaurantUrl])

  useEffect(() => {
    if (!copied) return
    const t = window.setTimeout(() => setCopied(false), 1200)
    return () => window.clearTimeout(t)
  }, [copied])

  return (
    <div className="p-5 space-y-4 overflow-y-auto flex-1">
      {showMeal ? (
        <>
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
            <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
              {imageUrl ? (
                <div className="mb-4 relative rounded-lg overflow-hidden border bg-muted aspect-video group shadow-sm">
                  <img
                    src={imageUrl}
                    alt="Dish preview"
                    className="w-full h-full object-cover transition-opacity duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.opacity = '0';
                      target.parentElement?.querySelector('.error-message')?.classList.remove('hidden');
                    }}
                    onLoad={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.opacity = '1';
                      target.parentElement?.querySelector('.error-message')?.classList.add('hidden');
                    }}
                  />
                  <div className="error-message hidden absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-muted/50 p-4 text-center">
                    <Camera className="h-8 w-8 mb-2 opacity-20" />
                    <span className="text-xs">Image not found or invalid URL</span>
                  </div>
                  <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-lg pointer-events-none" />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 mb-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Camera className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Add a photo</p>
                    <p className="text-xs text-muted-foreground">or paste image URL</p>
                  </div>
                </div>
              )}

              <Input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className={imageUrl ? '' : 'mt-2'}
              />
            </div>
          </div>



	          {!isDiningOut && (
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
          )}
        </>
      ) : null}

      {showDetails ? (
        <>
          {showRestaurantFields ? (
            <div className="pt-6 relative">
              {/* Decorative background for the section */}
              <div className="absolute inset-0 bg-gradient-to-b from-muted/20 to-transparent -mx-6 -mt-6 rounded-t-[2rem] pointer-events-none" />
              
              <div className="space-y-4 relative">
                {/* Restaurant Name Input - Filled Style */}
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary">
                    <Utensils className="h-4 w-4" />
                  </div>
                  <Input
                    value={restaurantName ?? ''}
                    onChange={(e) => setRestaurantName?.(e.target.value)}
                    placeholder="Restaurant Name"
                    className="pl-10 h-12 bg-muted/50 border-2 border-transparent focus:bg-background focus:border-primary/20 rounded-2xl transition-all font-medium text-base shadow-sm"
                  />
                </div>

                {/* Find on Maps - Stylized Banner Button */}
                <button
                  type="button"
                  className="w-full group relative overflow-hidden rounded-2xl border border-border/50 bg-background hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-md text-left"
                  onClick={() => {
                     const query = restaurantName?.trim()
                     const url = query
                       ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
                       : 'https://www.google.com/maps'
                     window.open(url, '_blank', 'noopener,noreferrer')
                  }}
                >
                  {/* Subtle Map Pattern Background */}
                  <div 
                    className="absolute inset-0 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity" 
                    style={{
                      backgroundImage: `radial-gradient(#000 1px, transparent 1px)`,
                      backgroundSize: '12px 12px'
                    }} 
                  />
                  <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-primary/10 to-transparent" />
                  
                  <div className="relative p-4 flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                        Open Google Maps <ArrowRight className="h-3 w-3 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                      </span>
                      <span className="text-xs text-muted-foreground">Find place & copy link</span>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <MapIcon className="h-5 w-5" />
                    </div>
                  </div>
                </button>

                {/* Link Input - Filled Style */}
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary">
                    <LinkIcon className="h-4 w-4" />
                  </div>
                  <Input
                    value={restaurantUrl ?? ''}
                    onChange={(e) => setRestaurantUrl?.(e.target.value)}
                    placeholder="Paste Google Maps Link"
                    className="pl-10 h-12 bg-muted/50 border-2 border-transparent focus:bg-background focus:border-primary/20 rounded-2xl transition-all text-sm shadow-sm"
                  />
                </div>

                {/* Map Preview Card */}
                {restaurantUrlValid && restaurantUrl && (
                  <div className="relative rounded-2xl overflow-hidden aspect-[2.5/1] bg-muted group border border-border/50 shadow-sm">
                    <div 
                      className="absolute inset-0 opacity-40 dark:opacity-20" 
                      style={{
                        backgroundColor: '#e5e7eb',
                        backgroundImage: `
                          radial-gradient(#9ca3af 1px, transparent 1px), 
                          radial-gradient(#9ca3af 1px, transparent 1px)
                        `,
                        backgroundSize: '20px 20px',
                        backgroundPosition: '0 0, 10px 10px'
                      }} 
                    />
                     <div className="absolute top-1/2 left-1/4 -translate-y-1/2 -translate-x-1/2 text-red-500/20 transform scale-[3] blur-sm">
                        <MapIcon />
                     </div>

                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/5 to-transparent">
                      <Button
                          type="button"
                          variant="secondary"
                          className="bg-background/90 hover:bg-background shadow-sm text-sm font-semibold text-foreground backdrop-blur-sm transition-all rounded-full px-6"
                          onClick={() => window.open(restaurantUrl.trim(), '_blank', 'noopener,noreferrer')}
                      >
                          <MapIcon className="mr-2 h-4 w-4 text-emerald-600" />
                          View on Maps
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
            </div>
          ) : null}
          
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
        </>
      ) : null}
    </div>
  )
}
