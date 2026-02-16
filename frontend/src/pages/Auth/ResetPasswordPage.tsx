import React, { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'

import { authService } from '@/api/auth.service'
import { getApiErrorMessage } from '@/api/error'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/context/ToastContext'

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()

  const token = searchParams.get('token') ?? ''

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const passwordsMatch = newPassword === confirmPassword
  const isLongEnough = newPassword.length >= 8
  const canSubmit = Boolean(token) && Boolean(newPassword) && Boolean(confirmPassword) && passwordsMatch && isLongEnough

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setIsSubmitting(true)
    try {
      await authService.resetPassword(token, newPassword)
      toast.success('Password reset! You can now log in.')
      setDone(true)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Reset failed. The link may have expired.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center">
        <div className="app-frame app-content">
          <Card className="mx-auto w-full max-w-md">
            <CardHeader>
              <CardTitle>Invalid link</CardTitle>
              <CardDescription>This reset link is missing a token.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground text-center">
                <Link className="font-semibold text-primary hover:underline" to="/forgot-password">
                  Request a new reset link
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center">
        <div className="app-frame app-content">
          <Card className="mx-auto w-full max-w-md">
            <CardHeader>
              <CardTitle>Password reset ✓</CardTitle>
              <CardDescription>Your password has been changed successfully.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" size="lg" onClick={() => navigate('/login', { replace: true })}>
                Go to login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center">
      <div className="app-frame app-content">
        <Card className="mx-auto w-full max-w-md">
          <CardHeader>
            <CardTitle>Reset your password</CardTitle>
            <CardDescription>Enter a new password for your account.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="new-password">
                  New password
                </label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNew ? 'text' : 'password'}
                    autoComplete="new-password"
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
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
                <label className="text-sm font-medium" htmlFor="confirm-password">
                  Confirm new password
                </label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
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

              {newPassword && confirmPassword && !passwordsMatch ? (
                <p className="text-sm text-destructive">Passwords do not match.</p>
              ) : null}
              {newPassword && !isLongEnough ? (
                <p className="text-sm text-destructive">Password must be at least 8 characters.</p>
              ) : null}

              <Button className="w-full" size="lg" type="submit" disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? 'Resetting…' : 'Reset password'}
              </Button>

              <div className="text-sm text-muted-foreground text-center">
                <Link className="font-semibold text-primary hover:underline" to="/login">
                  Back to login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ResetPasswordPage
