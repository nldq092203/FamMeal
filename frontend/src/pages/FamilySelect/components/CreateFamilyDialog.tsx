import {
  ArrowRight,
  X,
} from 'lucide-react'

import { getAvatarSrc, type AvatarId } from '@/assets/avatars'
import type { UserSuggestion } from '@/api/user.service'
import { Autocomplete } from '@/components/ui/autocomplete'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { AvatarPickerCompact } from '@/components/AvatarPickerCompact'


type CreateFamilyDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  step: 1 | 2 | 3
  setStep: (step: 1 | 2 | 3) => void
  isCreating: boolean
  familyName: string
  setFamilyName: (name: string) => void
  familyAvatarId: AvatarId
  setFamilyAvatarId: (id: AvatarId) => void

  userQuery: string
  setUserQuery: (value: string) => void
  suggestions: UserSuggestion[]
  isSearching: boolean
  invitedMembers: Array<UserSuggestion & { role: 'MEMBER' }>
  onInviteMember: (suggestion: UserSuggestion) => void
  onRemoveMember: (userId: string) => void
  onCreate: () => void
}

export function CreateFamilyDialog({
  open,
  onOpenChange,
  step,
  setStep,
  isCreating,
  familyName,
  setFamilyName,
  familyAvatarId,
  setFamilyAvatarId,

  userQuery,
  setUserQuery,
  suggestions,
  isSearching,
  invitedMembers,
  onInviteMember,
  onRemoveMember,
  onCreate,
}: CreateFamilyDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden max-h-[85vh] flex flex-col family-create-dialog">
        <DialogHeader className="family-create-header">
          <div className="family-create-header__left">
            <DialogTitle className="family-create-title" style={{ fontFamily: 'var(--font-family-display)' }}>
              {step === 1 ? 'Create Family' : step === 2 ? 'Preferences' : 'Invite Members'}
            </DialogTitle>
            <div className="family-create-subtitle">Step {step} of 2</div>
          </div>
          <DialogClose>
            <Button variant="ghost" size="icon" aria-label="Close">
              <X className="h-5 w-5" />
            </Button>
          </DialogClose>
        </DialogHeader>

        {step === 1 ? (
          <>
            <div className="p-5 space-y-6 overflow-y-auto flex-1">
              <AvatarPickerCompact 
                value={familyAvatarId} 
                onChange={setFamilyAvatarId} 
                size="lg"
                title="Choose an Avatar"
                subtitle="Pick a mascot for your family kitchen."
              />

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="createFamilyName">
                  Family name
                </label>
                <Input
                  id="createFamilyName"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="e.g. Nguyen Family"
                  autoFocus
                />
              </div>
            </div>

            <div className="border-t border-border p-5">
              <Button className="w-full family-create-cta" size="lg" onClick={() => setStep(2)} disabled={!familyName.trim()}>
                Continue <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </>

	        ) : (
	          <>
	            <div className="p-5 space-y-4 overflow-y-auto flex-1 bg-muted/20">
	              <div className="text-center space-y-2 mb-4">
	                <h3 className="text-base font-semibold">Invite Family Members</h3>
	              </div>

	              <section className="space-y-3 rounded-2xl border border-border bg-card/60 p-4 shadow-sm">
	                <Autocomplete
	                  value={userQuery}
	                  onChange={setUserQuery}
	                  onSelect={(opt) => {
                    const s = suggestions.find((u) => u.id === opt.id)
                    if (s) onInviteMember(s)
                  }}
                  options={suggestions
                    .filter((s) => !invitedMembers.some((m) => m.id === s.id))
                    .map((s) => ({
                      id: s.id,
                      label: s.displayName,
                      subtitle: s.email ?? `@${s.username}`,
                      icon: (
                        <img
                          src={getAvatarSrc(s.avatarId)}
                          alt=""
                          className="h-8 w-8 rounded-full border border-border object-cover"
                          loading="lazy"
                        />
                      ),
                    }))}
                  isLoading={isSearching}
                  placeholder="Search by username or email…"
                  emptyMessage={userQuery.length >= 2 ? 'No users found' : 'Type at least 2 characters'}
                />

	                {invitedMembers.length > 0 ? (
	                  <div className="space-y-2 mt-4">
	                    <div className="text-sm font-medium text-muted-foreground ml-1">
	                      {invitedMembers.length} {invitedMembers.length === 1 ? 'member' : 'members'} invited
	                    </div>
                    {invitedMembers.map((m) => (
                      <div key={m.id} className="invite-row bg-muted/40 border-muted rounded-xl p-2 transition-colors hover:bg-muted/60">
                        <div className="invite-row__left flex items-center gap-3">
                          <img
                            src={getAvatarSrc(m.avatarId)}
                            alt=""
                            className="h-10 w-10 rounded-full border border-border object-cover bg-background"
                            loading="lazy"
                          />
                          <div className="min-w-0">
                            <div className="text-sm font-semibold truncate">{m.displayName}</div>
                            <div className="text-xs text-muted-foreground truncate">{m.email ?? `@${m.username}`}</div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-muted-foreground hover:text-destructive"
                          onClick={() => onRemoveMember(m.id)}
                          aria-label={`Remove ${m.displayName}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
	                    <div className="text-xs text-muted-foreground pt-2 text-center">
	                      Invites will be sent by email when available.
	                    </div>
	                  </div>
	                ) : (
	                  <div className="text-center rounded-xl border border-border bg-muted/30 py-8 px-6 text-sm text-muted-foreground">
	                    No members invited yet. You can skip this step and invite members later.
	                  </div>
	                )}
	              </section>
            </div>

            <div className="border-t border-border p-5 space-y-2">
              <Button className="w-full family-create-cta" size="lg" onClick={onCreate} disabled={isCreating}>
                {isCreating ? 'Creating…' : 'Create Family'}
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep(1)}
                className="w-full text-muted-foreground"
                disabled={isCreating}
              >
                Back
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
