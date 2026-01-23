import { UtensilsCrossed, History, Users, Settings } from 'lucide-react'

export const primaryNavItems = [
  { to: '/meals', icon: UtensilsCrossed, label: 'Meals' },
  { to: '/history', icon: History, label: 'History' },
  { to: '/family', icon: Users, label: 'Family' },
  { to: '/settings', icon: Settings, label: 'Settings' },
] as const

