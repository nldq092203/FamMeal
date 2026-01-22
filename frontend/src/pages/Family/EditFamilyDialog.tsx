import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AvatarPickerCompact } from '@/components/AvatarPickerCompact'
import type { AvatarId } from '@/assets/avatars'

interface EditFamilyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  familyId: string
  currentName: string
  currentAvatarId?: string
  onSave: (data: { name: string; avatarId: string }) => Promise<void>
}

export function EditFamilyDialog({
  open,
  onOpenChange,
  currentName,
  currentAvatarId,
  onSave
}: EditFamilyDialogProps) {
  const [name, setName] = useState(currentName)
  const [avatarId, setAvatarId] = useState<AvatarId>((currentAvatarId as AvatarId) || 'panda')
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) return
    
    setIsSaving(true)
    try {
      await onSave({ name: name.trim(), avatarId })
      onOpenChange(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset to current values when closing
      setName(currentName)
      setAvatarId((currentAvatarId as AvatarId) || 'panda')
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="overflow-hidden max-h-[85vh] flex flex-col w-[92vw] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Edit Family</DialogTitle>
        </DialogHeader>

        <div className="p-5 space-y-6 overflow-y-auto flex-1">
          {/* Avatar Selection */}
          <AvatarPickerCompact value={avatarId} onChange={setAvatarId} size="md" />

          {/* Family Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="familyName">
              Family name
            </label>
            <Input
              id="familyName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Nguyen Family"
            />
          </div>
        </div>

        <div className="border-t border-border p-5">
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!name.trim() || isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
