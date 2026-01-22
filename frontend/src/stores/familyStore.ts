import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type FamilyState = {
  familyId: string | null
  setFamilyId: (familyId: string | null) => void
}

export const useFamilyStore = create<FamilyState>()(
  persist(
    (set) => ({
      familyId: null,
      setFamilyId: (familyId) => set({ familyId }),
    }),
    {
      name: 'familyId',
      partialize: (s) => ({ familyId: s.familyId }),
    }
  )
)

