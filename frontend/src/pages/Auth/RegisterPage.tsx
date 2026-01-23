import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { getApiErrorMessage } from '@/api/error'
import type { AvatarId } from '@/assets/avatars'
import { AvatarPicker } from '@/components/AvatarPicker'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'

const RegisterPage: React.FC = () => {
  const navigate = useNavigate()
  const { register } = useAuth()
  const toast = useToast()

  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [avatarId, setAvatarId] = useState<AvatarId>('panda')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await register({ name, username, email, password, avatarId })
      toast.success('Account created.')
      navigate('/', { replace: true })
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Registration failed.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center">
      <div className="app-frame app-content">
        <Card className="mx-auto w-full max-w-md">
          <CardHeader>
            <CardTitle>Create account</CardTitle>
            <CardDescription>Start planning meals together.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="name">
                  Full name
                </label>
                <Input
                  id="name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="username">
                  Username
                </label>
                <Input
                  id="username"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

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
                  autoComplete="new-password"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Choose an avatar</div>
                <AvatarPicker value={avatarId} onChange={setAvatarId} />
              </div>

              <Button className="w-full" size="lg" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating…' : 'Create account'}
              </Button>

              <div className="text-sm text-muted-foreground text-center">
                Already have an account?{' '}
                <Link className="font-semibold text-primary hover:underline" to="/login">
                  Log in
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default RegisterPage
