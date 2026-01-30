import { ArrowRight, Check, Plus, Users, Trash2 } from 'lucide-react'

import type { FamilyListItem } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useState } from 'react'

function roleLabel(role: string) {
  if (role === 'ADMIN') return 'Admin'
  return 'Member'
}

type FamilyGridProps = {
  families: FamilyListItem[]
  selectedId: string | null
  onSelect: (id: string) => void
  onCreate: () => void
  onContinue: () => void
  onDelete: (id: string) => void
}

export function FamilyGrid({ families, selectedId, onSelect, onCreate, onContinue, onDelete }: FamilyGridProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  return (
    <>
      <section className="flex-1 mb-6">
        <div className="grid grid-cols-2 gap-3">
          {families.map((f) => {
            const isSelected = selectedId === f.id
            const isAdmin = f.role === 'ADMIN'
            return (
              <Card
                key={f.id}
                className={`cursor-pointer transition-all group relative ${
                  isSelected ? 'ring-2 ring-primary shadow-md scale-[1.02]' : 'hover:shadow-sm'
                }`}
                role="button"
                tabIndex={0}
                onClick={() => onSelect(f.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') onSelect(f.id)
                }}
              >
                <CardContent className="p-4 flex flex-col items-center text-center gap-3 relative min-h-[140px]">
                  {isSelected ? (
                    <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      <Check className="h-4 w-4" />
                    </div>
                  ) : null}

                  {isAdmin && (
                    <div 
                      className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteConfirmId(f.id)
                      }}
                    >
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  <div
                    className={`h-14 w-14 rounded-full flex items-center justify-center border-2 mt-2 ${
                      isAdmin ? 'bg-primary/10 border-primary' : 'bg-muted border-border'
                    }`}
                  >
                    <Users className={`h-7 w-7 ${isAdmin ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="min-w-0 w-full">
                    <div className="font-bold text-base truncate">{f.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">{roleLabel(f.role)}</div>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          <Card
            className="cursor-pointer border-2 border-dashed border-border bg-transparent hover:bg-muted/30 transition-colors"
            role="button"
            tabIndex={0}
            onClick={onCreate}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onCreate()
            }}
          >
            <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-3 min-h-[140px]">
              <div className="h-14 w-14 rounded-full bg-muted/60 flex items-center justify-center mt-2">
                <Plus className="h-7 w-7 text-primary" />
              </div>
              <div className="text-sm font-semibold text-muted-foreground">Create</div>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="space-y-4">
        <Button className="w-full !text-body" size="lg" onClick={onContinue} disabled={!selectedId}>
          Continue to Meal Plan <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
      </div>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Family Group?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the family group and all its data, including meal plans and history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (deleteConfirmId) {
                   onDelete(deleteConfirmId)
                   setDeleteConfirmId(null)
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
