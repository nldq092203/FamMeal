import { useMutation, useQueryClient } from '@tanstack/react-query'
import { adminFamilyService, familyService } from '@/api/family.service'
import { queryKeys } from '@/query/queryKeys'
import type { CreateFamilyRequest, FamilyRole, FamilySettings } from '@/types'

export function useCreateFamilyMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateFamilyRequest) => familyService.createFamily(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.families.all })
    },
  })
}

export function useUpdateFamilyProfileMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { familyId: string; name?: string; avatarId?: string }) =>
      adminFamilyService.updateFamilyProfile(input.familyId, { name: input.name, avatarId: input.avatarId }),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.families.byId(variables.familyId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.families.list() }),
      ])
    },
  })
}

export function useUpdateFamilySettingsMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { familyId: string; settings: FamilySettings }) =>
      adminFamilyService.updateFamilySettings(input.familyId, input.settings),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.families.byId(variables.familyId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.families.list() }),
      ])
    },
  })
}

export function useAddFamilyMemberMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { familyId: string; email?: string; username?: string; role: FamilyRole }) =>
      adminFamilyService.addMember(input.familyId, { email: input.email, username: input.username, role: input.role }),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.families.byId(variables.familyId) })
    },
  })
}

export function useRemoveFamilyMemberMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { familyId: string; memberId: string }) =>
      adminFamilyService.removeMember(input.familyId, input.memberId),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.families.byId(variables.familyId) })
    },
  })
}

export function useDeleteFamilyMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (familyId: string) => adminFamilyService.deleteFamily(familyId),
    onSuccess: async (_, familyId) => {
      queryClient.removeQueries({ queryKey: queryKeys.families.byId(familyId) })
      await queryClient.invalidateQueries({ queryKey: queryKeys.families.all })
    },
  })
}
