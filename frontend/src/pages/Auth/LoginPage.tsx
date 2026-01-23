import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { getApiErrorMessage } from '@/api/error'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'

type LocationState = { from?: { pathname?: string } }

const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const toast = useToast()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fromPathname = (location.state as LocationState | null)?.from?.pathname
  const from = typeof fromPathname === 'string' && fromPathname !== '/login' ? fromPathname : '/'

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await login({ email, password })
      toast.success('Logged in.')
      navigate(from, { replace: true })
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Login failed.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center">
      <div className="app-frame app-content">
        <Card className="mx-auto w-full max-w-md">
          <CardHeader>
            <CardTitle>Log in</CardTitle>
            <CardDescription>Welcome back to FamMeal.</CardDescription>
          </CardHeader>
          <CardContent>
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
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="password">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button className="w-full" size="lg" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Logging in…' : 'Log in'}
              </Button>

              <div className="text-sm text-muted-foreground text-center">
                New here?{' '}
                <Link className="font-semibold text-primary hover:underline" to="/register">
                  Create an account
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default LoginPage
