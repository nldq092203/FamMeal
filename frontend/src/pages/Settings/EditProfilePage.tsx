import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import { userService } from '@/api/user.service'
import { getApiErrorMessage } from '@/api/error'
import type { AvatarId } from '@/assets/avatars'
import { getAvatarSrc } from '@/assets/avatars'
import { AvatarPickerCompact } from '@/components/AvatarPickerCompact'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'

export default function EditProfilePage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { user, refreshUser } = useAuth()

  const initialAvatarId = (user?.avatarId as AvatarId) || 'panda'
  const [avatarId, setAvatarId] = useState<AvatarId>(initialAvatarId)
  const [name, setName] = useState(user?.name ?? '')
  const [username, setUsername] = useState(user?.username ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [isSaving, setIsSaving] = useState(false)

  const isDirty = useMemo(() => {
    if (!user) return false
    return (
      (user.avatarId as string | null | undefined) !== avatarId ||
      (user.name ?? '') !== name ||
      (user.username ?? '') !== username ||
      (user.email ?? '') !== email
    )
  }, [avatarId, email, name, user, username])

  const canSave = Boolean(user?.id) && Boolean(name.trim()) && Boolean(username.trim()) && Boolean(email.trim()) && isDirty

  const handleSave = async () => {
    if (!user?.id) return
    setIsSaving(true)
    try {
      await userService.updateUser(user.id, {
        avatarId,
        name: name.trim(),
        username: username.trim(),
        email: email.trim(),
      })
      await refreshUser()
      toast.success('Profile updated.')
      navigate('/settings')
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to update profile.'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="app-frame min-h-screen flex flex-col">
        {/* Header */}
        <div className="py-6 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="flex-shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="t-page-title">Edit Profile</h1>
        </div>

        <div className="flex-1 overflow-y-auto pb-28 space-y-6">
          <Card>
            <CardContent className="p-5 space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full border-2 border-border overflow-hidden bg-muted">
                  <img src={getAvatarSrc(avatarId)} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold">Avatar</div>
                  <div className="text-sm text-muted-foreground">Pick one that feels like you.</div>
                </div>
              </div>

              <AvatarPickerCompact value={avatarId} onChange={setAvatarId} size="md" />

              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    autoCapitalize="none"
                    autoCorrect="off"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => navigate(-1)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!canSave || isSaving}>
              {isSaving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

