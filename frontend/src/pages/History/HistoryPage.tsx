import { useFamily } from '@/context/FamilyContext'
import { PageHeader, PageShell } from '@/components/Layout'

/**
 * History page - shows past meals and voting history
 */
export default function HistoryPage() {
  const { family } = useFamily()

  return (
    <PageShell>
      <PageHeader
        title="History"
        subtitle={`Past meals for ${family?.name || 'your family'}`}
        align="center"
      />

      <div className="space-y-4">
        <div className="text-center py-12 text-muted-foreground">
          <p>History page coming soon...</p>
        </div>
      </div>
    </PageShell>
  )
}
