import React, { useEffect, useMemo, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Image as ImageIcon, Shield, ThumbsUp } from 'lucide-react'

import { getApiErrorMessage } from '@/api/error'
import { getAvatarSrc } from '@/assets/avatars'
import { useAuth } from '@/context/AuthContext'
import { useFamily } from '@/context/FamilyContext'
import { useToast } from '@/context/ToastContext'
import { useActiveMealQuery } from '@/query/hooks/useActiveMealQuery'
import { useMealSummaryQuery } from '@/query/hooks/useMealSummaryQuery'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const HomePage: React.FC = () => {
  const { user } = useAuth()
  const { familyId, family, role, isLoading: isFamilyLoading, error: familyError } = useFamily()
  const navigate = useNavigate()
  const toast = useToast()
  const activeMealQuery = useActiveMealQuery(familyId)
  const activeMeal = activeMealQuery.data ?? null
  const isMealLoading = activeMealQuery.isLoading
  const mealError = activeMealQuery.error ? String(activeMealQuery.error) : null

  const mealSummaryQuery = useMealSummaryQuery(activeMeal?.id ?? null)
  const mealSummary = mealSummaryQuery.data ?? null
  const isSummaryLoading = mealSummaryQuery.isLoading
  const summaryError = mealSummaryQuery.error

  const summaryErrorMessage = useMemo(() => {
    if (!summaryError) return null
    return getApiErrorMessage(summaryError, 'Failed to load meal data.')
  }, [summaryError])

  const lastSummaryErrorRef = useRef<string | null>(null)
  useEffect(() => {
    if (!summaryErrorMessage) return
    if (lastSummaryErrorRef.current === summaryErrorMessage) return
    lastSummaryErrorRef.current = summaryErrorMessage
    toast.error(summaryErrorMessage)
  }, [summaryErrorMessage, toast])

  const todayText = useMemo(() => {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      weekday: 'long',
    }).format(new Date())
  }, [])

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }, [])

  const errorMessage = familyError || mealError || summaryErrorMessage

  return (
    <div className="min-h-full text-foreground">
      <main className="app-frame app-content space-y-8">
        <section className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-sm text-muted-foreground">{todayText}</div>
            <h1 className="t-display mt-1">
              {greeting}, {user?.name || user?.username || 'there'}
            </h1>
          </div>

          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="relative shrink-0 h-12 w-12 rounded-full border border-border overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Open settings"
          >
            <img
              src={getAvatarSrc(user?.avatarId)}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <span
              className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-primary ring-2 ring-background"
              aria-hidden="true"
            />
          </button>
        </section>

        {errorMessage && !isFamilyLoading ? (
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-foreground">{errorMessage}</div>
            </CardContent>
          </Card>
        ) : null}

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="t-section-title">My Family</h2>
            <Button asChild variant="outline" size="sm">
              <Link to="/settings">Settings</Link>
            </Button>
          </div>

          <Card>
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="font-semibold truncate">{isFamilyLoading ? 'Loading…' : family?.name ?? '—'}</div>
                <div className="text-sm text-muted-foreground">{role ?? '—'}</div>
              </div>
              {activeMeal && role === 'ADMIN' ? (
                <Button asChild size="sm">
                  <Link to={`/admin/meals/${activeMeal.id}/finalize`}>
                    <Shield className="h-4 w-4" />
                    Admin
                  </Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="t-section-title">Recent Updates</h2>
            {activeMeal ? (
              <Button asChild variant="ghost" size="sm">
                <Link to={`/meals/${activeMeal.id}/vote`}>See all</Link>
              </Button>
            ) : null}
          </div>

          <div className="space-y-3">
            {(mealSummary?.proposals ?? []).slice(0, 2).map((proposal) => (
              <Card key={proposal.id} className="overflow-hidden">
                <CardContent className="p-4 flex items-center gap-4">
                  {proposal.extra?.imageUrls?.[0] ? (
                    <img
                      src={proposal.extra.imageUrls[0]}
                      alt={proposal.dishName}
                      className="h-14 w-14 rounded-lg object-cover border border-border"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center border border-border">
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate">
                      <span className="text-foreground">{proposal.userName}</span> proposed{' '}
                      <span className="text-foreground">{proposal.dishName}</span>
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                      {mealSummary?.meal.mealType ?? 'Meal'} • {proposal.voteStats.voteCount} votes
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ThumbsUp className="h-4 w-4" />
                    <span className="font-semibold text-foreground">{proposal.voteStats.voteCount}</span>
                  </div>
                </CardContent>
              </Card>
            ))}

            {!isFamilyLoading &&
            !isMealLoading &&
            !isSummaryLoading &&
            activeMeal &&
            (mealSummary?.proposals?.length ?? 0) === 0 ? (
              <Card>
                <CardContent className="p-4 text-sm text-muted-foreground">
                  No updates yet. Add a proposal to kick off voting.
                </CardContent>
              </Card>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  )
}

export default HomePage
