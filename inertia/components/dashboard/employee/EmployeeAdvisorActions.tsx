import { EMPLOYEES_STATUS } from '#shared/constants/employee'
import { router } from '@inertiajs/react'
import { useState } from 'react'
import Button from '~/components/ui/Button'
import ConfirmModal from '~/components/ui/ConfirmModal'

type Props = {
  employeeId: string | number
  status: string
  onboarded: boolean
}

/**
 * Actions du conseiller sur une fiche candidat : renvoyer l'invitation tant
 * que le compte n'est pas activé, archiver (réversible) ou restaurer (#72).
 */
export function EmployeeAdvisorActions({ employeeId, status, onboarded }: Props) {
  const [confirmingArchive, setConfirmingArchive] = useState(false)
  const base = `/dashboard/conseiller/employees/${employeeId}`
  const archived = status === EMPLOYEES_STATUS.ARCHIVED

  return (
    <>
      {!onboarded && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.post(`${base}/onboarding/resend`, {}, { preserveScroll: true })}
        >
          Renvoyer l’invitation
        </Button>
      )}
      {archived ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.post(`${base}/restore`, {}, { preserveScroll: true })}
        >
          Restaurer
        </Button>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setConfirmingArchive(true)}>
          Archiver
        </Button>
      )}
      <ConfirmModal
        isOpen={confirmingArchive}
        title="Archiver ce candidat"
        description="La fiche passe en « Archivé » : aucune donnée n’est supprimée et vous pourrez la restaurer à tout moment."
        confirmLabel="Archiver"
        variant="warning"
        onCancel={() => setConfirmingArchive(false)}
        onConfirm={() => {
          router.post(
            `${base}/archive`,
            {},
            { preserveScroll: true, onFinish: () => setConfirmingArchive(false) }
          )
        }}
      />
    </>
  )
}
