import { ArrowRight, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type OnboardingCreateCardProps = {
  onCreate: () => void
}

export function OnboardingCreateCard({ onCreate }: OnboardingCreateCardProps) {
  return (
    <div className="flex-1 flex flex-col">
      <Card
        className="w-full overflow-hidden cursor-pointer border-2 border-dashed border-border bg-transparent shadow-none rounded-3xl transition-colors hover:bg-muted/30 mb-8"
        role="button"
        tabIndex={0}
        onClick={onCreate}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onCreate()
        }}
      >
        <CardContent className="p-12 flex flex-col items-center justify-center text-center gap-6 min-h-[280px]">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted/60">
            <Plus className="h-10 w-10 text-primary" />
          </div>
          <div>
            <div className="text-2xl font-bold leading-tight mb-2" style={{ fontFamily: 'var(--font-family-display)' }}>
              Create Family Group
            </div>
            <div className="text-sm text-muted-foreground leading-relaxed">
              Start proposing meals
              <br />
              and voting together
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-auto">
        <Button className="w-full" size="lg" onClick={onCreate}>
          Continue <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
      </div>
    </div>
  )
}

