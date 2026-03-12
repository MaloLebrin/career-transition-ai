import { Transmit } from '@adonisjs/transmit-client'
import { Head } from '@inertiajs/react'
import { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import Badge from '../../components/ui/Badge'
import { useAuth } from '../../hooks/useAuth'

type BulkJobStatus = 'pending' | 'processing' | 'completed' | 'failed'
type BulkJobType = 'emails' | 'pdfs' | 'mixed'
type BulkJobScope = 'single' | 'batch' | 'org'

type BulkJobDto = {
  id: number
  userId: number
  organizationId: number | null
  type: BulkJobType
  scope: BulkJobScope
  status: BulkJobStatus
  errorMessage: string | null
  createdAt: string
  startedAt: string | null
  finishedAt: string | null
}

const STATUS_LABELS: Record<BulkJobStatus, string> = {
  pending: 'En attente',
  processing: 'En cours',
  completed: 'Terminé',
  failed: 'Erreur',
}

const STATUS_VARIANTS: Record<BulkJobStatus, 'navy' | 'success' | 'danger' | 'outline'> = {
  pending: 'outline',
  processing: 'navy',
  completed: 'success',
  failed: 'danger',
}

const TYPE_LABELS: Record<BulkJobType, string> = {
  emails: 'Emails',
  pdfs: 'PDFs',
  mixed: 'Mixte',
}

const SCOPE_LABELS: Record<BulkJobScope, string> = {
  single: 'Individuel',
  batch: 'Batch',
  org: 'Organisation',
}

export default function BulkJobs() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState<BulkJobDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const transmit = useMemo(
    () =>
      new Transmit({
        baseUrl: window.location.origin,
      }),
    []
  )

  useEffect(() => {
    let isMounted = true

    async function fetchJobs() {
      try {
        setLoading(true)
        const res = await fetch('/api/bulk-jobs', { credentials: 'include' })
        if (!res.ok) {
          throw new Error(`Erreur HTTP ${res.status}`)
        }
        const data = (await res.json()) as BulkJobDto[]
        if (isMounted) {
          setJobs(data)
        }
      } catch (e: any) {
        if (isMounted) {
          setError(e?.message ?? 'Impossible de charger les jobs')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchJobs()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!user) return

    const channelUser = `users/${user.id}/bulk-jobs`
    const subscription = transmit.subscription(channelUser)

    let unsubscribe: (() => void) | null = null

    subscription
      .create()
      .then(() => {
        unsubscribe = subscription.onMessage((data: BulkJobDto) => {
          setJobs((prev) => {
            const exists = prev.find((j) => j.id === data.id)
            if (exists) {
              return prev.map((j) => (j.id === data.id ? data : j))
            }
            return [data, ...prev]
          })
        })
      })
      .catch(() => {
        // On reste silencieux côté UI, les jobs seront visibles via refresh manuel si besoin
      })

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
      subscription.delete().catch(() => { })
    }
  }, [transmit, user])

  const title = 'Tâches en arrière-plan'

  return (
    <>
      <Head title={title} />
      <DashboardLayout>
        <div className="space-y-6 animate-fadeIn">
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-[0.25em]">
              Suivi des jobs asynchrones
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-brand-navy tracking-tight">
              {title}
            </h1>
            <p className="text-brand-navy/60 text-sm font-medium max-w-2xl">
              Visualisez l&apos;état des envois d&apos;emails et des générations de PDFs lancés en
              arrière-plan. La liste se met à jour automatiquement grâce aux événements serveur
              (SSE).
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
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest">
                    Portée
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
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-navy/5">
                {loading && jobs.length === 0 && (
                  <tr>
                    <td
                      className="px-6 py-10 text-center text-xs font-medium text-brand-navy/40"
                      colSpan={8}
                    >
                      Chargement des jobs...
                    </td>
                  </tr>
                )}
                {!loading &&
                  jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-brand-ivory/60 transition-colors">
                      <td className="px-6 py-4 text-xs font-mono text-brand-navy/70">{job.id}</td>
                      <td className="px-4 py-4 text-xs font-medium text-brand-navy/80">
                        {TYPE_LABELS[job.type] ?? job.type}
                      </td>
                      <td className="px-4 py-4 text-xs font-medium text-brand-navy/80">
                        {SCOPE_LABELS[job.scope] ?? job.scope}
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant={STATUS_VARIANTS[job.status]}>
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
                            {STATUS_LABELS[job.status]}
                          </span>
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-xs text-brand-navy/70">
                        {new Date(job.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-xs text-brand-navy/70">
                        {job.startedAt ? new Date(job.startedAt).toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-4 text-xs text-brand-navy/70">
                        {job.finishedAt ? new Date(job.finishedAt).toLocaleString() : '—'}
                      </td>
                      <td className="px-6 py-4 text-xs text-brand-navy/60 max-w-xs">
                        {job.errorMessage ? (
                          <span className="line-clamp-2" title={job.errorMessage}>
                            {job.errorMessage}
                          </span>
                        ) : (
                          <span className="text-brand-navy/30">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                {!loading && jobs.length === 0 && (
                  <tr>
                    <td
                      className="px-6 py-10 text-center text-xs font-medium text-brand-navy/40"
                      colSpan={8}
                    >
                      Aucun job en arrière-plan pour le moment.
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

