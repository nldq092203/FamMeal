import { useState, type FormEvent } from 'react'
import { MapPin, UserPlus, Users as UsersIcon, Pencil, MoreVertical, Plus } from 'lucide-react'
import { getApiErrorMessage } from '@/api/error'
import { useFamily } from '@/context/FamilyContext'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { AdminOnly } from '@/components/PermissionGate'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getAvatarSrc } from '@/assets/avatars'
import { EditFamilyDialog } from './EditFamilyDialog'
import { EditPreferencesDialog } from './EditPreferencesDialog'
import { PageHeader, PageShell } from '@/components/Layout'
import { useAddFamilyMemberMutation, useUpdateFamilyProfileMutation, useUpdateFamilySettingsMutation } from '@/query/hooks/useFamilyMutations'

/**
 * Family page - Family & Circle Management
 * Shows family info, members, and dietary constraints
 */
export default function FamilyPage() {
  const { family, role } = useFamily()
  const { user } = useAuth()
  const toast = useToast()
  
  const [showEditFamily, setShowEditFamily] = useState(false)
  const [showEditPreferences, setShowEditPreferences] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [inviteTarget, setInviteTarget] = useState('')

  const updateProfileMutation = useUpdateFamilyProfileMutation()
  const updateSettingsMutation = useUpdateFamilySettingsMutation()
  const addMemberMutation = useAddFamilyMemberMutation()

  const members =
    family?.members?.map((m) => ({
      id: m.userId,
      userId: m.userId,
      role: m.role,
      name: m.name,
      username: m.username,
      avatarId: m.avatarId,
    })) ?? []
  const dietaryConstraints = family?.settings?.defaultDietaryRestrictions || []
  const activeMembers = members.length

  const handleSaveFamily = async (data: { name: string; avatarId: string }) => {
    if (!family?.id) return
    
    try {
      await updateProfileMutation.mutateAsync({ familyId: family.id, name: data.name, avatarId: data.avatarId })
      toast.success('Family updated successfully')
    } catch (error) {
      toast.error('Failed to update family')
      throw error
    }
  }

  const handleSavePreferences = async (preferences: {
    cuisines: string[]
    dietaryRestrictions: string[]
    maxBudget: number
    maxPrepTime: number
  }) => {
    if (!family?.id) return
    
    try {
      await updateSettingsMutation.mutateAsync({
        familyId: family.id,
        settings: {
          ...family.settings,
        defaultCuisinePreferences: preferences.cuisines,
        defaultDietaryRestrictions: preferences.dietaryRestrictions,
        defaultMaxBudget: preferences.maxBudget,
        defaultMaxPrepTime: preferences.maxPrepTime,
        },
      })
      toast.success('Preferences updated')
    } catch (error) {
      toast.error('Failed to update preferences')
      throw error
    }
  }

  const resetInviteForm = () => {
    setInviteTarget('')
  }

  const handleInviteMember = async (e: FormEvent) => {
    e.preventDefault()
    if (!family?.id) return
    if (role !== 'ADMIN') {
      toast.error('Only admins can invite members.')
      setShowInviteDialog(false)
      return
    }

    const target = inviteTarget.trim()
    if (!target) {
      toast.error('Enter a username or email.')
      return
    }

    const isEmail = target.includes('@')

    try {
      await addMemberMutation.mutateAsync({
        familyId: family.id,
        email: isEmail ? target : undefined,
        username: isEmail ? undefined : target,
        role: 'MEMBER',
      })
      toast.success('Invite sent.')
      resetInviteForm()
      setShowInviteDialog(false)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to invite member.'))
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <PageShell density="tight" className="space-y-4">
        <PageHeader title="Family Management" align="center" />

        {/* Hero Card - Family */}
        <Card className="overflow-hidden">
          <div className="relative h-32 bg-gradient-to-br from-primary/20 via-primary/10 to-background flex items-center justify-center">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-24 w-24 rounded-full border-4 border-background overflow-hidden shadow-lg">
                <img
                  src={getAvatarSrc(family?.avatarId)}
                  alt="Family avatar"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
            
            <AdminOnly>
              <button
                onClick={() => setShowEditFamily(true)}
                className="absolute top-2 right-2 h-7 w-7 rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-background transition-colors"
              >
                <Pencil className="h-3 w-3" />
              </button>
            </AdminOnly>
          </div>
          
          <CardContent className="pt-4 pb-3 text-center">
            <h2 className="text-lg font-bold mb-1">{family?.name || 'Your Family'}</h2>
            {family?.settings?.defaultCuisinePreferences && family.settings.defaultCuisinePreferences.length > 0 && (
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{family.settings.defaultCuisinePreferences.slice(0, 2).join(', ')}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Household Members */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold">Household Members</h3>
            <span className="text-xs font-semibold text-primary">
              {activeMembers} Active
            </span>
          </div>

          <div className="space-y-1.5">
            {members.map((member) => {
              const isCurrentUser = user && member.userId === user.id
              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="relative h-10 w-10 rounded-full border-2 border-border overflow-hidden flex-shrink-0">
                      <img
                        src={getAvatarSrc(isCurrentUser && user ? user.avatarId : member.avatarId)}
                        alt={isCurrentUser && user ? user.name || 'You' : member.name || member.username || 'Member'}
                        className="h-full w-full object-cover"
                      />
                      {member.role === 'ADMIN' && (
                        <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-primary border-2 border-background" />
                      )}
                    </div>
                    
                    <div>
                      <p className="text-sm font-semibold">
                        {isCurrentUser && user ? (user.name || 'You') : (member.name || member.username || 'Member')}
                        {isCurrentUser && <span className="text-muted-foreground ml-1">(You)</span>}
                      </p>
                      <p className="text-xs text-primary capitalize">
                        {member.role === 'ADMIN' ? 'Admin' : 'Member'}
                      </p>
                    </div>
                  </div>

                  <AdminOnly>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </AdminOnly>
                </div>
              )
            })}
          </div>

          <AdminOnly>
            <Button
              onClick={() => setShowInviteDialog(true)}
              variant="outline"
              className="w-full gap-2 h-10 text-sm border-dashed border-2"
            >
              <UserPlus className="h-4 w-4" />
              Add Family Member
            </Button>
          </AdminOnly>
        </div>

        {/* Family Constraints */}
        <Card>
          <CardContent className="p-3 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <UsersIcon className="h-3.5 w-3.5 text-primary" />
                  <h3 className="text-sm font-bold">Family Constraints</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  These dietary rules apply to all generated meal plans for your circle.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {dietaryConstraints.length > 0 ? (
                <>
                  {dietaryConstraints.map((constraint) => (
                    <Badge
                      key={constraint}
                      variant="secondary"
                      className="px-2.5 py-0.5 text-xs font-medium"
                    >
                      {constraint}
                    </Badge>
                  ))}
                  <AdminOnly>
                    <button
                      onClick={() => setShowEditPreferences(true)}
                      className="h-6 w-6 rounded-md border-2 border-dashed border-muted-foreground/50 flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </AdminOnly>
                </>
              ) : (
                <AdminOnly fallback={<p className="text-xs text-muted-foreground">No dietary constraints set</p>}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEditPreferences(true)}
                    className="gap-1.5 h-8 text-xs border-dashed border-2"
                  >
                    <Plus className="h-3 w-3" />
                    Add Constraints
                  </Button>
                </AdminOnly>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Edit Dialogs */}
        {family && (
          <>
            <EditFamilyDialog
              open={showEditFamily}
              onOpenChange={setShowEditFamily}
              familyId={family.id}
              currentName={family.name}
              currentAvatarId={family.avatarId}
              onSave={handleSaveFamily}
            />

            <EditPreferencesDialog
              open={showEditPreferences}
              onOpenChange={setShowEditPreferences}
              currentPreferences={{
                cuisines: family?.settings?.defaultCuisinePreferences || [],
                dietaryRestrictions: dietaryConstraints,
                maxBudget: family?.settings?.defaultMaxBudget || 50,
                maxPrepTime: family?.settings?.defaultMaxPrepTime || 60
              }}
              onSave={handleSavePreferences}
            />
          </>
        )}

        <Dialog
          open={showInviteDialog}
          onOpenChange={(open) => {
            setShowInviteDialog(open)
            if (!open) resetInviteForm()
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Member</DialogTitle>
              <DialogClose>
                <Button variant="ghost" size="icon" aria-label="Close invite dialog">
                  ✕
                </Button>
              </DialogClose>
            </DialogHeader>

            <div className="px-5 pb-5">
              <form className="space-y-4" onSubmit={handleInviteMember}>
                <div className="space-y-2">
                  <Label htmlFor="invite-target">Username or Email</Label>
                  <Input
                    id="invite-target"
                    value={inviteTarget}
                    onChange={(e) => setInviteTarget(e.target.value)}
                    placeholder="username or name@example.com"
                    disabled={addMemberMutation.isPending}
                  />
                  <p className="text-xs text-muted-foreground">We’ll match either a username or an email.</p>
                </div>

                <Button className="w-full" type="submit" disabled={addMemberMutation.isPending}>
                  {addMemberMutation.isPending ? 'Sending…' : 'Send invite'}
                </Button>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      </PageShell>
    </div>
  )
}
