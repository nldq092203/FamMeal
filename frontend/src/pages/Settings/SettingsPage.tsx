import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, LogOut, Pencil, Lock, Bell, UtensilsCrossed, ArrowLeft, Eye, EyeOff } from 'lucide-react'

import { getAvatarSrc } from '@/assets/avatars'
import type { AvatarId } from '@/assets/avatars'
import { AvatarPickerCompact } from '@/components/AvatarPickerCompact'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/AuthContext'
import { useFamily } from '@/context/FamilyContext'
import { useToast } from '@/context/ToastContext'
import { userService } from '@/api/user.service'
import { getApiErrorMessage } from '@/api/error'
import { useUnreadNotificationsCountQuery } from '@/query/hooks/useUnreadNotificationsCountQuery'

type EditSection = null | 'profile' | 'password'

const SettingsPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, logout, refreshUser } = useAuth()
  const { family, role, families, familyId } = useFamily()
  const toast = useToast()
  const unreadCountQuery = useUnreadNotificationsCountQuery(familyId)
  const unreadCount = unreadCountQuery.data ?? 0
  
  const [editSection, setEditSection] = useState<EditSection>(null)
  
  // Profile editing state
  const initialAvatarId = (user?.avatarId as AvatarId) || 'panda'
  const [avatarId, setAvatarId] = useState<AvatarId>(initialAvatarId)
  const [name, setName] = useState(user?.name ?? '')
  const [username, setUsername] = useState(user?.username ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  
  // Password editing state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  const handleLogout = () => {
    logout()
    toast.info('Logged out.')
    navigate('/login', { replace: true })
  }

  const memberCount = families.find(f => f.id === family?.id)?.memberCount
  
  // Profile form validation
  const isProfileDirty = useMemo(() => {
    if (!user) return false
    return (
      (user.avatarId as string | null | undefined) !== avatarId ||
      (user.name ?? '') !== name ||
      (user.username ?? '') !== username ||
      (user.email ?? '') !== email
    )
  }, [avatarId, email, name, user, username])

  const canSaveProfile = Boolean(user?.id) && Boolean(name.trim()) && Boolean(username.trim()) && Boolean(email.trim()) && isProfileDirty

  const handleSaveProfile = async () => {
    if (!user?.id) return
    setIsSavingProfile(true)
    try {
      await userService.updateUser(user.id, {
        avatarId,
        name: name.trim(),
        username: username.trim(),
        email: email.trim(),
      })
      await refreshUser()
      toast.success('Profile updated.')
      setEditSection(null)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to update profile.'))
    } finally {
      setIsSavingProfile(false)
    }
  }
  
  // Password form validation
  const passwordValidationMessage = useMemo(() => {
    if (!newPassword || !confirmPassword) return null
    if (newPassword !== confirmPassword) return 'Passwords do not match.'
    if (newPassword.length < 8) return 'Password must be at least 8 characters.'
    if (currentPassword && newPassword === currentPassword) return 'New password must be different.'
    return null
  }, [confirmPassword, currentPassword, newPassword])

  const canSavePassword = Boolean(user?.id) && Boolean(newPassword) && Boolean(confirmPassword) && !passwordValidationMessage

  const handleSavePassword = async () => {
    if (!user?.id) return
    if (!canSavePassword) return

    setIsSavingPassword(true)
    try {
      await userService.updateUser(user.id, { password: newPassword })
      await refreshUser()
      toast.success('Password updated.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setEditSection(null)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to change password.'))
    } finally {
      setIsSavingPassword(false)
    }
  }
  
  const handleCancelEdit = () => {
    setEditSection(null)
    // Reset to current user values
    setAvatarId(initialAvatarId)
    setName(user?.name ?? '')
    setUsername(user?.username ?? '')
    setEmail(user?.email ?? '')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="app-frame min-h-screen flex flex-col">
        {/* Header */}
        <div className="py-6 flex items-center gap-4">
          {editSection && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancelEdit}
              className="flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <h1 className="t-page-title">
            {editSection === 'profile' ? 'Edit Profile' : editSection === 'password' ? 'Change Password' : 'Profile'}
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto pb-28 space-y-8">
          {!editSection ? (
            <>
              {/* Two-column layout on tablet+ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* LEFT COLUMN: Profile & Family Info */}
                <div className="space-y-6">
                  {/* Profile Section */}
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="relative">
                      <img
                        src={getAvatarSrc(user?.avatarId)}
                        alt={user?.name || 'Profile'}
                        className="h-24 w-24 rounded-full border-2 border-border object-cover"
                      />
                      <button
                        onClick={() => {
                          setEditSection('profile')
                          setAvatarId((user?.avatarId as AvatarId) || 'panda')
                          setName(user?.name ?? '')
                          setUsername(user?.username ?? '')
                          setEmail(user?.email ?? '')
                        }}
                        className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center border-2 border-background"
                        aria-label="Edit avatar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{user?.name || user?.username || 'User'}</h2>
                      <p className="text-sm text-muted-foreground">{user?.email || ''}</p>
                    </div>
                  </div>

                  {/* Family Group Section */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                      Family Group
                    </h3>
                    <Card>
                      <CardContent className="p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center border border-border flex-shrink-0">
                            <img
                              src={getAvatarSrc(user?.avatarId)}
                              alt=""
                              className="h-full w-full rounded-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold truncate">{family?.name || 'No family'}</div>
                            <div className="text-xs text-muted-foreground">
                              {memberCount ? `${memberCount} members` : ''} {role ? `• ${role === 'ADMIN' ? 'Admin' : 'Member'}` : ''}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate('/family-select')}
                          className="text-primary hover:text-primary flex-shrink-0"
                        >
                          Switch
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                  
                </div>

                {/* RIGHT COLUMN: Account & Preferences */}
                <div className="space-y-6">
                  {/* Account Section */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                      Account
                    </h3>
                    <Card>
                      <CardContent className="p-0">
                        <button
                          onClick={() => {
                            setEditSection('profile')
                            setAvatarId((user?.avatarId as AvatarId) || 'panda')
                            setName(user?.name ?? '')
                            setUsername(user?.username ?? '')
                            setEmail(user?.email ?? '')
                          }}
                          className="w-full p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors first:rounded-t-lg"
                        >
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Pencil className="h-5 w-5 text-primary" />
                          </div>
                          <span className="flex-1 text-left font-medium">Edit Profile</span>
                          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        </button>
                        <div className="h-px bg-border mx-4" />
                        <button
                          onClick={() => {
                            setEditSection('password')
                            setCurrentPassword('')
                            setNewPassword('')
                            setConfirmPassword('')
                          }}
                          className="w-full p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors last:rounded-b-lg"
                        >
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Lock className="h-5 w-5 text-primary" />
                          </div>
                          <span className="flex-1 text-left font-medium">Change Password</span>
                          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        </button>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Preferences Section */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                      Preferences
                    </h3>
                    <Card>
                      <CardContent className="p-0">
                        <button
                          onClick={() => navigate('/settings/notifications')}
                          className="w-full p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors first:rounded-t-lg"
                        >
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Bell className="h-5 w-5 text-primary" />
                          </div>
                          <span className="flex-1 text-left font-medium">Notifications</span>
                          {unreadCount > 0 ? (
                            <Badge variant="destructive">{unreadCount > 99 ? '99+' : unreadCount}</Badge>
                          ) : null}
                          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        </button>
                        <div className="h-px bg-border mx-4" />
                        <button
                          onClick={() => navigate('/settings/dietary-preferences')}
                          className="w-full p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors last:rounded-b-lg"
                        >
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <UtensilsCrossed className="h-5 w-5 text-primary" />
                          </div>
                          <span className="flex-1 text-left font-medium">Dietary Preferences</span>
                          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        </button>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Logout Button */}
                  <div>
                    <Button
                      variant="ghost"
                      onClick={handleLogout}
                      className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <LogOut className="h-5 w-5 mr-2" />
                      Logout
                    </Button>
                  </div>
                </div>
              </div>

            </>
          ) : editSection === 'profile' ? (
            <>
              {/* Edit Profile Section */}
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
                <Button variant="outline" onClick={handleCancelEdit} disabled={isSavingProfile}>
                  Cancel
                </Button>
                <Button onClick={handleSaveProfile} disabled={!canSaveProfile || isSavingProfile}>
                  {isSavingProfile ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </>
          ) : editSection === 'password' ? (
            <>
              {/* Change Password Section */}
              <Card>
                <CardContent className="p-5 space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current password (optional)</Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showCurrent ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowCurrent((v) => !v)}
                        aria-label={showCurrent ? 'Hide password' : 'Show password'}
                      >
                        {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password">New password</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showNew ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowNew((v) => !v)}
                        aria-label={showNew ? 'Hide password' : 'Show password'}
                      >
                        {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm new password</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowConfirm((v) => !v)}
                        aria-label={showConfirm ? 'Hide password' : 'Show password'}
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {passwordValidationMessage ? <p className="text-sm text-destructive">{passwordValidationMessage}</p> : null}
                  {!passwordValidationMessage && newPassword ? (
                    <p className="text-xs text-muted-foreground">Use at least 8 characters.</p>
                  ) : null}
                </CardContent>
              </Card>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={handleCancelEdit} disabled={isSavingPassword}>
                  Cancel
                </Button>
                <Button onClick={handleSavePassword} disabled={!canSavePassword || isSavingPassword}>
                  {isSavingPassword ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
