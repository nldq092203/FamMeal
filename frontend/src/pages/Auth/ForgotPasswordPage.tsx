import React, { useState } from 'react'
import { Link } from 'react-router-dom'

import { authService } from '@/api/auth.service'
import { getApiErrorMessage } from '@/api/error'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/context/ToastContext'

const ForgotPasswordPage: React.FC = () => {
  const toast = useToast()

  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resetToken, setResetToken] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const result = await authService.forgotPassword(email)
      setSubmitted(true)
      if (result.resetToken) {
        setResetToken(result.resetToken)
      }
      toast.success('If that email exists, a reset link has been generated.')
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Something went wrong. Please try again.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center">
      <div className="app-frame app-content">
        <Card className="mx-auto w-full max-w-md">
          <CardHeader>
            <CardTitle>Forgot password</CardTitle>
            <CardDescription>
              Enter your email and we'll generate a reset link for you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!submitted ? (
              <form className="space-y-4" onSubmit={onSubmit}>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="email">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <Button className="w-full" size="lg" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Sending…' : 'Send reset link'}
                </Button>

                <div className="text-sm text-muted-foreground text-center">
                  Remember your password?{' '}
                  <Link className="font-semibold text-primary hover:underline" to="/login">
                    Log in
                  </Link>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  If an account with <strong>{email}</strong> exists, a password reset link has been generated.
                </p>

                {resetToken ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Since email delivery isn't configured yet, here's your reset link:
                    </p>
                    <Link
                      to={`/reset-password?token=${resetToken}`}
                      className="block text-center text-sm font-semibold text-primary hover:underline break-all"
                    >
                      Click here to reset your password
                    </Link>
                  </div>
                ) : null}

                <div className="text-sm text-muted-foreground text-center pt-2">
                  <Link className="font-semibold text-primary hover:underline" to="/login">
                    Back to login
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
