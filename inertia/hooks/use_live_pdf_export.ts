import { PDF_EXPORT_STATUSES } from '#shared/constants/pdf_export'
import { Transmit } from '@adonisjs/transmit-client'
import { useEffect, useState } from 'react'
import { useAuth } from './use_auth'

export type LivePdfExport = {
  id: number
  status: string
  downloadUrl: string | null
} | null

/**
 * Dernier export PDF de synthèse d'un candidat, mis à jour en temps réel par
 * le canal Transmit `users/:id/pdf-exports` (job `GenerateEmployeeSynthesisPdf`).
 * Partagé par les pages synthèse conseiller et candidat (#70).
 */
export function useLivePdfExport(
  employeeId: string | number,
  initial: LivePdfExport
): LivePdfExport {
  const { user } = useAuth()
  const [live, setLive] = useState<LivePdfExport>(initial)

  useEffect(() => {
    setLive(initial)
  }, [initial])

  useEffect(() => {
    if (!user || typeof window === 'undefined') return

    const transmit = new Transmit({ baseUrl: window.location.origin })
    const subscription = transmit.subscription(`users/${user.id}/pdf-exports`)
    let unsubscribe: (() => void) | null = null

    subscription
      .create()
      .then(() => {
        unsubscribe = subscription.onMessage((data: any) => {
          const exportId = Number(data?.id)
          const status = String(data?.status ?? '')
          if (!exportId || !status) return
          if (Number(data?.employeeId) !== Number(employeeId)) return

          setLive({
            id: exportId,
            status,
            downloadUrl:
              status === PDF_EXPORT_STATUSES.COMPLETED
                ? `/dashboard/pdf-exports/${exportId}/download`
                : null,
          })
        })
      })
      .catch(() => {})

    return () => {
      if (unsubscribe) unsubscribe()
      subscription.delete().catch(() => {})
    }
  }, [employeeId, user?.id])

  return live
}
