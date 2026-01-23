import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import './FamilySelectPage.css'

import { getApiErrorMessage } from '@/api/error'
import { getAvatarSrc, type AvatarId } from '@/assets/avatars'
import type { UserSuggestion } from '@/api/user.service'
import { useAuth } from '@/context/AuthContext'
import { useFamily } from '@/context/FamilyContext'
import { useToast } from '@/context/ToastContext'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useUserSuggestionsQuery } from '@/query/hooks/useUserSuggestionsQuery'
import { useAddFamilyMemberMutation, useCreateFamilyMutation } from '@/query/hooks/useFamilyMutations'

import { CreateFamilyDialog } from './components/CreateFamilyDialog'
import { FamilyGrid } from './components/FamilyGrid'
import { OnboardingCreateCard } from './components/OnboardingCreateCard'

export default function FamilySelectPage() {
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const { families, familyId, setActiveFamilyId, isLoading } = useFamily()
  const [selectedId, setSelectedId] = useState<string | null>(familyId)

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createStep, setCreateStep] = useState<1 | 2 | 3>(1)

  const [familyName, setFamilyName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const [familyAvatarId, setFamilyAvatarId] = useState<AvatarId>('panda')

  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([])
  const [customCuisine, setCustomCuisine] = useState('')
  const [showCustomCuisine, setShowCustomCuisine] = useState(false)

  const [selectedDietary, setSelectedDietary] = useState<string[]>([])

  const [maxBudget, setMaxBudget] = useState(30)
  const [maxPrepTime, setMaxPrepTime] = useState(45)

  const [invitedMembers, setInvitedMembers] = useState<Array<UserSuggestion & { role: 'MEMBER' }>>([])

  const [userQuery, setUserQuery] = useState('')
  const debouncedUserQuery = useDebouncedValue(userQuery, 350)
  const { data: suggestions = [], isFetching: isSearching } = useUserSuggestionsQuery(debouncedUserQuery, {
    minLength: 2,
  })

  const createFamilyMutation = useCreateFamilyMutation()
  const addFamilyMemberMutation = useAddFamilyMemberMutation()

  useEffect(() => {
    if (!selectedId && families.length === 1) setSelectedId(families[0]!.id)
  }, [families, selectedId])

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }, [])

  const isOnboarding = families.length === 0 && !isLoading

  const continueToApp = () => {
    if (!selectedId) return
    setActiveFamilyId(selectedId)
    const from = (location.state as { from?: Location })?.from
    navigate(from?.pathname ?? '/', { replace: true })
  }

  const resetCreateForm = () => {
    setCreateStep(1)
    setFamilyName('')
    setSelectedCuisines([])
    setCustomCuisine('')
    setShowCustomCuisine(false)
    setSelectedDietary([])
    setMaxBudget(30)
    setMaxPrepTime(45)
    setFamilyAvatarId('panda')
    setInvitedMembers([])
    setUserQuery('')
  }

  const handleInviteMember = (suggestion: UserSuggestion) => {
    if (invitedMembers.some((m) => m.id === suggestion.id)) {
      toast.error('This user is already invited.')
      return
    }
    setInvitedMembers((prev) => [...prev, { ...suggestion, role: 'MEMBER' }])
    setUserQuery('')
  }

  const removeMember = (userId: string) => {
    setInvitedMembers((prev) => prev.filter((m) => m.id !== userId))
  }

  const onCreate = async () => {
    if (!familyName.trim()) {
      toast.error('Please enter a family name.')
      return
    }

    try {
      const allCuisines = [...selectedCuisines]
      if (customCuisine.trim()) {
        allCuisines.push(...customCuisine.split(',').map((c) => c.trim()).filter(Boolean))
      }

      const allDietary = [...selectedDietary]

      const settings = {
        defaultCuisinePreferences: allCuisines.length > 0 ? allCuisines : undefined,
        defaultDietaryRestrictions: allDietary.length > 0 ? allDietary : undefined,
        defaultMaxBudget: maxBudget,
        defaultMaxPrepTime: maxPrepTime,
      }

      setIsCreating(true)
      const created = await createFamilyMutation.mutateAsync({
        name: familyName.trim(),
        avatarId: familyAvatarId,
        settings:
          settings.defaultCuisinePreferences ||
          settings.defaultDietaryRestrictions ||
          settings.defaultMaxBudget ||
          settings.defaultMaxPrepTime
            ? settings
            : undefined,
      })

      const emailInvites = invitedMembers.filter((m) => Boolean(m.email))
      if (emailInvites.length > 0) {
        await Promise.allSettled(
          emailInvites.map((m) =>
            addFamilyMemberMutation.mutateAsync({ familyId: created.id, email: m.email!, role: 'MEMBER' })
          )
        )
      }

      const missingEmailCount = invitedMembers.length - emailInvites.length
      if (missingEmailCount > 0) toast.info('Some invites were skipped (missing email).')

      setActiveFamilyId(created.id)
      setIsCreateOpen(false)
      resetCreateForm()
      toast.success('Family Group created.')
      navigate('/', { replace: true })
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to create family group.'))
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="w-full max-w-md px-6 py-12 flex flex-col min-h-screen">
        <header className="flex items-start justify-between gap-6 mb-8">
          <div className="min-w-0 flex-1">
            <div className="text-sm text-muted-foreground mb-3">{greeting}</div>
            {isOnboarding ? (
              <>
                <h1
                  className="text-5xl font-bold tracking-tight leading-[1.1]"
                  style={{ fontFamily: 'var(--font-family-display)' }}
                >
                  Create your
                  <br />
                  first family
                </h1>
                <p className="mt-6 text-base leading-relaxed text-muted-foreground">
                  A family is where meals and votes live. Start by creating a family group to organize your planning.
                </p>
              </>
            ) : (
              <>
                <h1
                  className="text-4xl font-bold tracking-tight mb-2"
                  style={{ fontFamily: 'var(--font-family-display)' }}
                >
                  Welcome{user?.name ? `, ${user.name}` : ''}
                </h1>
                <p className="text-base text-muted-foreground">Who are you planning meals for today?</p>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="h-16 w-16 rounded-full border-2 border-border overflow-hidden flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Open settings"
          >
            <img
              src={getAvatarSrc(user?.avatarId)}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </button>
        </header>

        {!isOnboarding ? (
          <FamilyGrid
            families={families}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onCreate={() => setIsCreateOpen(true)}
            onContinue={continueToApp}
          />
        ) : (
          <OnboardingCreateCard onCreate={() => setIsCreateOpen(true)} />
        )}
      </div>

      <CreateFamilyDialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open)
          if (open) setCreateStep(1)
          if (!open) resetCreateForm()
        }}
        step={createStep}
        setStep={setCreateStep}
        isCreating={isCreating}
        familyName={familyName}
        setFamilyName={setFamilyName}
        familyAvatarId={familyAvatarId}
        setFamilyAvatarId={setFamilyAvatarId}
        selectedCuisines={selectedCuisines}
        setSelectedCuisines={setSelectedCuisines}
        customCuisine={customCuisine}
        setCustomCuisine={setCustomCuisine}
        showCustomCuisine={showCustomCuisine}
        setShowCustomCuisine={setShowCustomCuisine}
        selectedDietary={selectedDietary}
        setSelectedDietary={setSelectedDietary}
        maxBudget={maxBudget}
        setMaxBudget={setMaxBudget}
        maxPrepTime={maxPrepTime}
        setMaxPrepTime={setMaxPrepTime}
        userQuery={userQuery}
        setUserQuery={setUserQuery}
        suggestions={suggestions}
        isSearching={isSearching}
        invitedMembers={invitedMembers}
        onInviteMember={handleInviteMember}
        onRemoveMember={removeMember}
        onCreate={onCreate}
      />
    </div>
  )
}
