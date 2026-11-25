import { Head, router } from '@inertiajs/react'
import { SUPER_ADMIN_PATHS } from '#shared/constants/super_admin'
import { CONTACT_BLOCK_RETENTION_YEARS } from '#shared/constants/contact_request'
import { formatDateTimeFR } from '#shared/helpers/date'
import type { BlockedContactEmailItem } from '#shared/types/contact_request/admin'
import type { PaginationMeta } from '#shared/types/pagination'
import DashboardLayout from '~/components/dashboard/DashboardLayout'
import AppLink from '~/components/ui/AppLink'
import Button from '~/components/ui/Button'
import Card from '~/components/ui/Card'
import Input from '~/components/ui/Input'
import { Pagination } from '~/components/ui/Pagination'
import { useServerList } from '~/hooks/use_server_list'

interface BlockedContactEmailsProps {
  blockedEmails: BlockedContactEmailItem[]
  pagination: PaginationMeta
  filters: { search: string }
}

const LIST_ONLY = ['blockedEmails', 'pagination']

/** Adresses bloquées pour le formulaire de contact : liste et levée du blocage. */
export default function BlockedContactEmails({
  blockedEmails,
  pagination,
  filters,
}: BlockedContactEmailsProps) {
  const { values, setSearch, goToPage } = useServerList(
    SUPER_ADMIN_PATHS.blockedContactEmails,
    { search: filters.search },
    LIST_ONLY
  )

  const unblock = (id: number) =>
    router.post(
      SUPER_ADMIN_PATHS.blockedContactEmailUnblock(id),
      {},
      { preserveScroll: true, only: LIST_ONLY }
    )

  return (
    <>
      <Head title="Adresses bloquées" />
      <DashboardLayout>
        <div className="space-y-6 animate-fade-in">
          <div className="space-y-1">
            <AppLink
              href={SUPER_ADMIN_PATHS.contactRequests}
              className="text-sm text-accent underline-offset-4 hover:underline"
            >
              Retour aux demandes de contact
            </AppLink>
            <h1 className="font-display text-display-sm text-ink">Adresses bloquées</h1>
            <p className="text-sm text-muted">
              Les demandes envoyées depuis ces adresses sont ignorées, sans que l’expéditeur en soit
              averti. Un blocage est levé automatiquement au bout de {CONTACT_BLOCK_RETENTION_YEARS}{' '}
              ans.
            </p>
          </div>

          <Input
            type="search"
            aria-label="Rechercher une adresse bloquée"
            placeholder="Rechercher une adresse…"
            value={values.search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {blockedEmails.length === 0 ? (
            <Card variant="flat" role="status">
              <p className="text-sm text-muted">
                {filters.search !== ''
                  ? 'Aucune adresse bloquée ne correspond à cette recherche.'
                  : 'Aucune adresse bloquée pour le moment.'}
              </p>
            </Card>
          ) : (
            <ul className="space-y-3" aria-label="Adresses bloquées">
              {blockedEmails.map((blocked) => (
                <li key={blocked.id}>
                  <Card className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-ink">{blocked.email}</p>
                      <p className="text-sm text-muted">
                        Bloquée le {formatDateTimeFR(blocked.blockedAt)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="xs"
                      variant="outline"
                      aria-label={`Débloquer ${blocked.email}`}
                      onClick={() => unblock(blocked.id)}
                    >
                      Débloquer
                    </Button>
                  </Card>
                </li>
              ))}
            </ul>
          )}

          <Pagination
            page={pagination.page}
            lastPage={pagination.lastPage}
            onPageChange={goToPage}
          />
        </div>
      </DashboardLayout>
    </>
  )
}
