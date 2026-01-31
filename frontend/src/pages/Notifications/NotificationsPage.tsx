import { useCallback, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlarmClock, ArrowLeft, Bell, ChefHat, CheckCircle2, CheckCheck, ChevronDown, Loader2, UserPlus } from 'lucide-react'

import { PageHeader, PageShell } from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useFamily } from '@/context/FamilyContext'
import { useToast } from '@/context/ToastContext'
import { getApiErrorMessage } from '@/api/error'
import { useNotificationsInfiniteQuery } from '@/query/hooks/useNotificationsInfiniteQuery'
import { useUnreadNotificationsCountQuery } from '@/query/hooks/useUnreadNotificationsCountQuery'
import { useMarkAllNotificationsReadMutation, useMarkNotificationReadMutation } from '@/query/hooks/useNotificationMutations'
import type { FamilyNotification, NotificationTypeId } from '@/types'
import { cn } from '@/lib/utils'

type NotificationsPageProps = {
  variant?: 'tab' | 'settings'
}

type NotificationUi = {
  icon: typeof Bell
  title: string
  description: string
  href: string
}

function formatTimestamp(iso: string) {
  const date = new Date(iso)
  const datePart = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date)
  const timePart = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date)
  return `${datePart} • ${timePart}`
}

function startOfWeek(date: Date) {
  const d = new Date(date)
  const day = d.getDay() // 0 Sun .. 6 Sat
  const diff = (day + 6) % 7 // Monday=0
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - diff)
  return d
}

function weekBucket(createdAtIso: string) {
  const created = new Date(createdAtIso)
  const now = new Date()
  const currentWeekStart = startOfWeek(now).getTime()
  const lastWeekStart = currentWeekStart - 7 * 24 * 60 * 60 * 1000
  const ts = created.getTime()
  if (ts >= currentWeekStart) return 'This week'
  if (ts >= lastWeekStart) return 'Last week'
  return 'Earlier'
}

function notificationUi(type: NotificationTypeId, refId: string): NotificationUi {
  switch (type) {
    case 1:
      return { icon: Bell, title: 'New meal proposal', description: 'A member proposed a meal.', href: `/proposals/${refId}` }
    case 2:
      return { icon: CheckCircle2, title: 'Meal finalized', description: 'Voting ended and a meal was finalized.', href: `/meals/${refId}` }
    case 3:
      return { icon: UserPlus, title: 'New member joined', description: 'A new member joined your family.', href: '/family' }
    case 4:
      return { icon: AlarmClock, title: 'Reminder', description: 'It’s time to plan your meal.', href: `/meals/${refId}` }
    case 5:
      return { icon: ChefHat, title: 'You’re the cook', description: 'You’ve been assigned as cook for a meal.', href: `/meals/${refId}` }
    case 6:
      return { icon: UserPlus, title: 'Welcome to the family', description: 'You’ve been added to a family.', href: '/family' }
    default:
      return { icon: Bell, title: 'Notification', description: 'You have a new update.', href: '/history' }
  }
}

export default function NotificationsPage({ variant = 'tab' }: NotificationsPageProps) {
  const navigate = useNavigate()
  const toast = useToast()
  const { familyId } = useFamily()

  const unreadCountQuery = useUnreadNotificationsCountQuery(familyId)
  const unreadCount = unreadCountQuery.data ?? 0

  const notificationsQuery = useNotificationsInfiniteQuery(familyId, { limit: 20 })
  const markReadMutation = useMarkNotificationReadMutation()
  const markAllReadMutation = useMarkAllNotificationsReadMutation()

  const notifications = useMemo(() => {
    const pages = notificationsQuery.data?.pages ?? []
    const seen = new Set<string>()
    const items: FamilyNotification[] = []
    for (const page of pages) {
      for (const item of page.items) {
        if (seen.has(item.id)) continue
        seen.add(item.id)
        items.push(item)
      }
    }
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return items
  }, [notificationsQuery.data?.pages])

  const grouped = useMemo(() => {
    const buckets = new Map<string, FamilyNotification[]>()
    for (const n of notifications) {
      const key = weekBucket(n.createdAt)
      const bucket = buckets.get(key)
      if (bucket) bucket.push(n)
      else buckets.set(key, [n])
    }
    const order = ['This week', 'Last week', 'Earlier']
    return order
      .map((label) => ({ label, items: buckets.get(label) ?? [] }))
      .filter((g) => g.items.length > 0)
  }, [notifications])

  useEffect(() => {
    if (notificationsQuery.error) toast.error(getApiErrorMessage(notificationsQuery.error, 'Failed to load notifications.'))
  }, [notificationsQuery.error, toast])

  useEffect(() => {
    if (unreadCountQuery.error) toast.error(getApiErrorMessage(unreadCountQuery.error, 'Failed to load unread count.'))
  }, [toast, unreadCountQuery.error])

  const handleOpenNotification = useCallback(
    async (n: FamilyNotification) => {
      if (!familyId) return
      const ui = notificationUi(n.type, n.refId)

      if (!n.isRead) {
        markReadMutation.mutate({ familyId, id: n.id })
      }

      navigate(ui.href)
    },
    [familyId, markReadMutation, navigate]
  )

  const handleMarkAllRead = useCallback(() => {
    if (!familyId) return
    markAllReadMutation.mutate(familyId, {
      onSuccess: (res) => {
        if (res.updated > 0) toast.success('All notifications marked as read.')
      },
      onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to mark all as read.')),
    })
  }, [familyId, markAllReadMutation, toast])

  const isLoading = notificationsQuery.isLoading || unreadCountQuery.isLoading
  const hasNotifications = notifications.length > 0

  return (
    <PageShell>
      <PageHeader
        title="History"
        subtitle="Notifications"
        align="center"
        left={
          variant === 'settings' ? (
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Go back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          ) : undefined
        }
        right={variant === 'settings' ? <div className="h-10 w-10" aria-hidden="true" /> : undefined}
      />

      <div className="space-y-4">
        {unreadCount > 0 && hasNotifications ? (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleMarkAllRead}
              disabled={markAllReadMutation.isPending || !familyId}
            >
              {markAllReadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
              Mark all read
            </Button>
          </div>
        ) : null}

        {isLoading ? (
          <Card>
            <CardContent className="p-6 flex items-center justify-center text-muted-foreground">Loading…</CardContent>
          </Card>
        ) : !hasNotifications ? (
          <Card>
            <CardContent className="p-10 text-center text-muted-foreground">
              <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center border border-border">
                <Bell className="h-6 w-6" aria-hidden="true" />
              </div>
              <p className="mt-3 font-medium text-foreground">No notifications yet</p>
              <p className="mt-1 text-sm">Updates about meals and your family will show up here.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {grouped.map(({ label, items }) => (
              <section key={label} aria-label={label} className="space-y-3">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">{label}</h2>
                <ul className="space-y-4">
                  {items.map((n) => {
                    const ui = notificationUi(n.type, n.refId)
                    const Icon = ui.icon
                    return (
                      <li key={n.id} className="group relative flex gap-4">
                        <div className="flex flex-col items-center">
                          <div
                            className={cn(
                              'h-10 w-10 rounded-full bg-muted flex items-center justify-center border',
                              n.isRead ? 'border-border' : 'border-primary'
                            )}
                          >
                            <Icon className={cn('h-5 w-5', n.isRead ? 'text-muted-foreground' : 'text-primary')} />
                          </div>
                          <div className="w-px flex-1 bg-border mt-2 group-last:hidden" />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenNotification(n)}
                          className="flex-1 text-left"
                          aria-label={`${ui.title}. ${ui.description}`}
                        >
                          <Card className={cn('transition-colors', !n.isRead && 'border-primary/40')}>
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    {!n.isRead ? <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" /> : null}
                                    <div className={cn('font-semibold truncate', !n.isRead && 'text-foreground')}>
                                      {ui.title}
                                    </div>
                                  </div>
                                  <div className="mt-1 text-sm text-muted-foreground">{ui.description}</div>
                                  <div className="mt-2 text-xs text-muted-foreground">{formatTimestamp(n.createdAt)}</div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))}

            {notificationsQuery.hasNextPage ? (
              <div className="pt-2 flex justify-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => notificationsQuery.fetchNextPage()}
                  disabled={notificationsQuery.isFetchingNextPage}
                  aria-label="Load more notifications"
                >
                  {notificationsQuery.isFetchingNextPage ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </PageShell>
  )
}
