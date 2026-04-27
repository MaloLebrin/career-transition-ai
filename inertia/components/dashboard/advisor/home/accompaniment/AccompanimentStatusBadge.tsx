import { AccompanimentProgress } from "~/types/employee";
import Badge from "../../../../ui/Badge";

export function AccompanimentStatusBadge({ status }: { status: AccompanimentProgress['status'] }) {
  const map: Record<string, { label: string; variant: 'lime' | 'amber' | 'slate' | 'violet' | 'orange' }> = {
    active: { label: 'Actif', variant: 'lime' },
    completed: { label: 'Terminé', variant: 'violet' },
    'on-hold': { label: 'En pause', variant: 'amber' },
    archived: { label: 'Archivé', variant: 'slate' },
    onboarding: { label: 'Onboarding', variant: 'orange' },
  }
  const config = map[status] ?? { label: status, variant: 'slate' as const }
  return <Badge variant={config.variant}>{config.label}</Badge>
}
