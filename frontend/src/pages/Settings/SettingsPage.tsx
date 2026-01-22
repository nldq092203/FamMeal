import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, LogOut, Pencil, Lock, Bell, UtensilsCrossed, ArrowLeft } from 'lucide-react'

import { getAvatarSrc } from '@/assets/avatars'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'
import { useFamily } from '@/context/FamilyContext'
import { useToast } from '@/context/ToastContext'

const SettingsPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { family, role, families } = useFamily()
  const toast = useToast()

  const handleLogout = () => {
    logout()
    toast.info('Logged out.')
    navigate('/login', { replace: true })
  }

  const memberCount = families.find(f => f.id === family?.id)?.memberCount

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="app-frame min-h-screen flex flex-col">
        {/* Header */}
        <div className="py-6 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="flex-shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="t-page-title">Profile</h1>
        </div>

        <div className="flex-1 overflow-y-auto pb-6 space-y-8">
          {/* Profile Section */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="relative">
              <img
                src={getAvatarSrc(user?.avatarId)}
                alt={user?.name || 'Profile'}
                className="h-24 w-24 rounded-full border-2 border-border object-cover"
              />
              <button
                onClick={() => navigate('/settings/edit-profile')}
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

          {/* Account Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
              Account
            </h3>
            <Card>
              <CardContent className="p-0">
                <button
                  onClick={() => navigate('/settings/edit-profile')}
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
                  onClick={() => navigate('/settings/change-password')}
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
          <div className="pt-4">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-5 w-5 mr-2" />
              Logout
            </Button>
          </div>

          {/* Version */}
          <div className="text-center text-xs text-muted-foreground pb-4">
            FamMeal v2.4.0
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
