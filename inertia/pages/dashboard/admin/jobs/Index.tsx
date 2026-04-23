import { Transmit } from '@adonisjs/transmit-client'
import { Head } from '@inertiajs/react'
import { useEffect, useState } from 'react'
import DashboardLayout from '~/components/dashboard/DashboardLayout'
import Badge, { BadgeVariant } from '~/components/ui/Badge'
import { useAuth } from '~/hooks/use_auth'

import { PDF_EXPORT_STATUSES, type PdfExportStatus } from '#shared/constants/pdf_export'

export type PdfExportListItem = {
  id: number
  userId: number
  organizationId: number | null
  employeeId: number
  advisorUserId: number | null
  status: PdfExportStatus
  errorMessage: string | null
  createdAt: string
  startedAt: string | null
  finishedAt: string | null
  downloadUrl: string | null
  fileName: string | null
}

type PdfExportBroadcastPayload = {
  id: number
  userId: number
  organizationId: number | null
  employeeId: number
  advisorUserId: number | null
  status: PdfExportStatus
  errorMessage: string | null
  fileName: string | null
  createdAt: string | null
  startedAt: string | null
  finishedAt: string | null
}

const STATUS_LABELS: Record<PdfExportStatus, string> = {
  [PDF_EXPORT_STATUSES.PENDING]: 'En attente',
  [PDF_EXPORT_STATUSES.PROCESSING]: 'En cours',
  [PDF_EXPORT_STATUSES.COMPLETED]: 'Terminé',
  [PDF_EXPORT_STATUSES.FAILED]: 'Erreur',
}

const STATUS_VARIANTS: Record<PdfExportStatus, BadgeVariant> = {
  [PDF_EXPORT_STATUSES.PENDING]: 'slate',
  [PDF_EXPORT_STATUSES.PROCESSING]: 'indigo',
  [PDF_EXPORT_STATUSES.COMPLETED]: 'lime',
  [PDF_EXPORT_STATUSES.FAILED]: 'pink',
}

function downloadUrlForExport(id: number, status: PdfExportStatus): string | null {
  if (status !== PDF_EXPORT_STATUSES.COMPLETED) return null
  return `/dashboard/pdf-exports/${id}/download`
}

function mergeFromBroadcast(data: PdfExportBroadcastPayload): PdfExportListItem {
  const status = data.status
  return {
    id: data.id,
    userId: data.userId,
    organizationId: data.organizationId,
    employeeId: data.employeeId,
    advisorUserId: data.advisorUserId,
    status,
    errorMessage: data.errorMessage,
    createdAt: data.createdAt ?? new Date().toISOString(),
    startedAt: data.startedAt,
    finishedAt: data.finishedAt,
    fileName: data.fileName,
    downloadUrl: downloadUrlForExport(data.id, status),
  }
}

interface PdfExportsListProps {
  exports?: PdfExportListItem[]
}

export default function PdfExportsList({ exports: initialExports = [] }: PdfExportsListProps) {
  const { user } = useAuth()
  const [exports, setExports] = useState<PdfExportListItem[]>(initialExports)
  const [loading] = useState(false)
  const [error] = useState<string | null>(null)

  useEffect(() => {
    if (!user || typeof window === 'undefined') return

    const transmit = new Transmit({
      baseUrl: window.location.origin,
    })

    const channelUser = `users/${user.id}/pdf-exports`
    const subscription = transmit.subscription(channelUser)

    let unsubscribe: (() => void) | null = null

    subscription
      .create()
      .then(() => {
        unsubscribe = subscription.onMessage((raw: PdfExportBroadcastPayload) => {
          const data = mergeFromBroadcast(raw)
          setExports((prev) => {
            const exists = prev.find((e) => e.id === data.id)
            if (exists) {
              return prev.map((e) =>
                e.id === data.id
                  ? {
                      ...e,
                      ...data,
                      downloadUrl: data.downloadUrl ?? downloadUrlForExport(data.id, data.status),
                    }
                  : e
              )
            }
            return [data, ...prev]
          })
        })
      })
      .catch(() => {})

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
      subscription.delete().catch(() => {})
    }
  }, [user])

  const title = 'Exports PDF'

  return (
    <>
      <Head title={title} />
      <DashboardLayout>
        <div className="space-y-6 animate-fadeIn">
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-[0.25em]">
              Suivi des générations
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-brand-navy tracking-tight">
              {title}
            </h1>
            <p className="text-brand-navy/60 text-sm font-medium max-w-2xl">
              Visualisez l&apos;état des PDFs de synthèse lancés en arrière-plan. La liste se met à
              jour automatiquement grâce aux événements serveur (SSE).
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-xs font-medium px-4 py-2 rounded-2xl border border-red-100">
              {error}
            </div>
          )}

          <div className="bg-white rounded-3xl border border-brand-navy/5 overflow-x-auto shadow-sm">
            <table className="min-w-full divide-y divide-brand-navy/5 text-sm">
              <thead className="bg-brand-ivory/60">
                <tr>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest">
                    Candidat
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest">
                    Utilisateur
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest">
                    Créé
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest">
                    Début
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest">
                    Fin
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest">
                    Erreur
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest">
                    Fichier
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-navy/5">
                {loading && exports.length === 0 && (
                  <tr>
                    <td
                      className="px-6 py-10 text-center text-xs font-medium text-brand-navy/40"
                      colSpan={9}
                    >
                      Chargement…
                    </td>
                  </tr>
                )}
                {!loading &&
                  exports.map((row) => (
                    <tr key={row.id} className="hover:bg-brand-ivory/60 transition-colors">
                      <td className="px-6 py-4 text-xs font-mono text-brand-navy/70">{row.id}</td>
                      <td className="px-4 py-4 text-xs font-medium text-brand-navy/80">
                        {row.employeeId}
                      </td>
                      <td className="px-4 py-4 text-xs font-medium text-brand-navy/80">
                        {row.userId}
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant={STATUS_VARIANTS[row.status]}>
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
                            {STATUS_LABELS[row.status]}
                          </span>
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-xs text-brand-navy/70">
                        {new Date(row.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-xs text-brand-navy/70">
                        {row.startedAt ? new Date(row.startedAt).toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-4 text-xs text-brand-navy/70">
                        {row.finishedAt ? new Date(row.finishedAt).toLocaleString() : '—'}
                      </td>
                      <td className="px-6 py-4 text-xs text-brand-navy/60 max-w-xs">
                        {row.errorMessage ? (
                          <span className="line-clamp-2" title={row.errorMessage}>
                            {row.errorMessage}
                          </span>
                        ) : (
                          <span className="text-brand-navy/30">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-brand-navy/60">
                        {row.downloadUrl ? (
                          <a
                            href={row.downloadUrl}
                            className="text-brand-sage font-bold hover:underline"
                            title={row.fileName ?? 'Télécharger'}
                          >
                            Télécharger
                          </a>
                        ) : (
                          <span className="text-brand-navy/30">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                {!loading && exports.length === 0 && (
                  <tr>
                    <td
                      className="px-6 py-10 text-center text-xs font-medium text-brand-navy/40"
                      colSpan={9}
                    >
                      Aucun export PDF pour le moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </DashboardLayout>
    </>
  )
}
