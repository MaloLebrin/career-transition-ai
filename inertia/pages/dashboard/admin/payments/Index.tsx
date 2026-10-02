import { Head, router } from '@inertiajs/react'
import {
  BILLING_ADMIN_PATHS,
  PAYMENT_STATUS_LABELS,
  type PaymentStatus,
  paymentStatusValues,
} from '#shared/constants/billing'
import type { PaymentsListResult } from '#shared/types/billing/admin'
import DashboardLayout from '~/components/dashboard/DashboardLayout'
import { PaymentsTable } from '~/components/dashboard/admin/PaymentsTable'
import Button from '~/components/ui/Button'
import SelectField, { type SelectFieldOption } from '~/components/ui/SelectField'

interface PaymentsAdminProps {
  payments: PaymentsListResult
}

type StatusFilter = PaymentStatus | 'all'

const FILTER_OPTIONS: SelectFieldOption<StatusFilter>[] = [
  { value: 'all', label: 'Tous les statuts' },
  ...paymentStatusValues.map((status) => ({ value: status, label: PAYMENT_STATUS_LABELS[status] })),
]

function visit(status: StatusFilter, page: number) {
  const query: Record<string, string> = {}
  if (status !== 'all') query.status = status
  if (page > 1) query.page = String(page)
  router.get(BILLING_ADMIN_PATHS.payments, query, { preserveScroll: true, preserveState: true })
}

/** Back-office super admin : paiements du forfait, filtre par statut, retrait d'un accès (#107). */
export default function PaymentsAdmin({ payments }: PaymentsAdminProps) {
  const status: StatusFilter = payments.filter.status ?? 'all'
  const { page } = payments.filter

  return (
    <>
      <Head title="Paiements" />
      <DashboardLayout>
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-1">
              <h1 className="font-display text-display-sm text-ink">Paiements du forfait</h1>
              <p className="text-sm text-muted">
                {payments.total} paiement(s). Un remboursement se fait dans Stripe ; le retrait d’un
                accès se fait ici, avec un motif.
              </p>
            </div>
            <SelectField
              aria-label="Filtrer par statut"
              className="md:w-64"
              options={FILTER_OPTIONS}
              value={status}
              onChange={(value) => visit(value, 1)}
            />
          </div>

          <PaymentsTable payments={payments.items} />

          {payments.lastPage > 1 && (
            <nav className="flex items-center justify-between" aria-label="Pagination">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => visit(status, page - 1)}
              >
                Précédent
              </Button>
              <span className="text-sm text-muted">
                Page {page} / {payments.lastPage}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= payments.lastPage}
                onClick={() => visit(status, page + 1)}
              >
                Suivant
              </Button>
            </nav>
          )}
        </div>
      </DashboardLayout>
    </>
  )
}
