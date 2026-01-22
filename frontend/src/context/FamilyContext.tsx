import React, { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useFamiliesQuery } from '@/query/hooks/useFamiliesQuery'
import { useFamilyQuery } from '@/query/hooks/useFamilyQuery'
import { queryKeys } from '@/query/queryKeys'
import { useFamilyStore } from '@/stores/familyStore'
import type { Family, FamilyListItem, FamilyRole } from '@/types';

const EMPTY_FAMILIES: FamilyListItem[] = []

type FamilyContextValue = {
  familyId: string | null;
  family: Family | null;
  families: FamilyListItem[];
  role: FamilyRole | null;
  isLoading: boolean;
  error: string | null;
  setActiveFamilyId: (familyId: string | null) => void;
  refreshFamilies: () => Promise<void>;
};

const FamilyContext = createContext<FamilyContextValue | null>(null);

export function FamilyProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const location = useLocation()
  const familyId = useFamilyStore((s) => s.familyId)
  const setFamilyId = useFamilyStore((s) => s.setFamilyId)

  const shouldFetchFamilies = !familyId || location.pathname === '/family-select' || location.pathname.startsWith('/family-select/')
  const familiesQuery = useFamiliesQuery(shouldFetchFamilies)
  const familyQuery = useFamilyQuery(familyId)

  const families = familiesQuery.data ?? EMPTY_FAMILIES
  const family = familyQuery.data ?? null
  const role: FamilyRole | null = family?.myRole ?? null

  useEffect(() => {
    if (!familyId) return
    if (familiesQuery.isLoading) return
    if (families.some((f) => f.id === familyId)) return
    setFamilyId(null)
  }, [families, familiesQuery.isLoading, familyId, setFamilyId])

  useEffect(() => {
    if (!familyId) return
    if (!familyQuery.error) return
    if (!axios.isAxiosError(familyQuery.error)) return
    const status = familyQuery.error.response?.status
    if (status !== 401 && status !== 403) return
    queryClient.removeQueries({ queryKey: queryKeys.families.byId(familyId) })
    setFamilyId(null)
  }, [familyId, familyQuery.error, queryClient, setFamilyId])

  const refreshFamilies = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.families.all })
  }, [queryClient])

  const value = useMemo<FamilyContextValue>(() => {
    const combinedError = familiesQuery.error || familyQuery.error
    const combinedLoading = familiesQuery.isLoading || familyQuery.isLoading
    const setActiveFamilyId: FamilyContextValue['setActiveFamilyId'] = (nextId) => setFamilyId(nextId)
    return {
      familyId,
      family,
      families,
      role,
      isLoading: combinedLoading,
      error: combinedError ? String(combinedError) : null,
      setActiveFamilyId,
      refreshFamilies,
    };
  }, [
    families,
    family,
    familyId,
    familiesQuery.error,
    familiesQuery.isLoading,
    familyQuery.error,
    familyQuery.isLoading,
    refreshFamilies,
    role,
    setFamilyId,
  ]);

  return <FamilyContext.Provider value={value}>{children}</FamilyContext.Provider>;
}

export function useFamily() {
  const ctx = useContext(FamilyContext);
  if (!ctx) throw new Error('useFamily must be used within FamilyProvider');
  return ctx;
}
