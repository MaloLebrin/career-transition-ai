import { router } from '@inertiajs/react'
import { useState } from 'react'
import Button from '~/components/ui/Button'
import ConfirmModal from '~/components/ui/ConfirmModal'

type Props = {
  employeeId: string | number
  /** Slug de l'exercice (`values`, `disc`…). */
  type: string
  exerciseTitle: string
}

/** Réinitialise un exercice du candidat (supprime ses résultats et notes liées) après confirmation (#72). */
export function ResetExerciseButton({ employeeId, type, exerciseTitle }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="danger" size="sm" onClick={() => setOpen(true)}>
        Réinitialiser l’exercice
      </Button>
      <ConfirmModal
        isOpen={open}
        title="Réinitialiser l’exercice"
        description={`Les résultats de « ${exerciseTitle} » et les notes qui y sont liées seront supprimés. Le candidat pourra refaire l’exercice. Cette action est irréversible.`}
        confirmLabel="Réinitialiser"
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          router.delete(`/dashboard/conseiller/employees/${employeeId}/exercises/results/${type}`, {
            preserveScroll: true,
            onFinish: () => setOpen(false),
          })
        }}
      />
    </>
  )
}
