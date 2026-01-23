import type { ReactNode } from 'react'
import { Leaf, Pizza, Soup, Utensils, UtensilsCrossed } from 'lucide-react'

export type CuisineOption = {
  id: string
  label: string
  icon: ReactNode
}

export const COMMON_CUISINES: CuisineOption[] = [
  { id: 'Italian', label: 'Italian', icon: <UtensilsCrossed className="h-4 w-4" /> },
  { id: 'Asian', label: 'Asian', icon: <Soup className="h-4 w-4" /> },
  { id: 'Mexican', label: 'Mexican', icon: <Pizza className="h-4 w-4" /> },
  { id: 'American', label: 'American', icon: <Utensils className="h-4 w-4" /> },
  { id: 'Mediterranean', label: 'Mediterranean', icon: <Leaf className="h-4 w-4" /> },
  { id: 'Indian', label: 'Indian', icon: <Soup className="h-4 w-4" /> },
]

