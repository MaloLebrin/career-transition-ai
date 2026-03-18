import { formatDate } from '#shared/helpers/date'
import { router } from '@inertiajs/react'
import { Pencil, Trash } from 'lucide-react'
import { useState } from 'react'
import { EducationForm } from '~/components/dashboard/employee/profile/educations/EducationForm'
import ConfirmModal, { type ConfirmModalState } from '~/components/ui/ConfirmModal'
import { EmployeeData } from '~/types'

interface EducationItemProps {
  education: EmployeeData['educations'][0]
}

export const EducationItem = ({ education }: EducationItemProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deleteState, setDeleteState] = useState<ConfirmModalState>('idle')

  return (
    <li className={`relative pb-10 last:pb-0 border-b border-brand-navy/5 last:border-0 ${!isEditing ? 'flex gap-6 group' : ''}`}>
      {isEditing ? (
        <div className="flex-1">
          <EducationForm
            education={education}
            onCancel={() => setIsEditing(false)}
            onSuccess={() => setIsEditing(false)}
          />
        </div>
      ) : (
        <>
          <div key={education.id} className="pb-8 last:pb-0">
            <h3 className="text-lg font-bold text-brand-navy">{education.degree}</h3>
            <p className="text-brand-navy/70 mt-1">{education.school}</p>
            <p className="text-brand-navy/50 text-sm mt-1 space-x-0.5">
              <span>{formatDate(education.startDate)}</span>
              <span>-</span>
              <span>{education.endDate ? formatDate(education.endDate) : 'Aujourd\'hui'}</span>
            </p>
            {education.description && (
              <p className="text-brand-navy/60 mt-3 leading-relaxed text-sm">
                {education.description}
              </p>
            )}
          </div>

          <div>
            <button
              type="button"
              onClick={() => {
                setIsEditing(true)
              }}
              className="opacity-0 group-hover:opacity-100 absolute top-0 right-10 p-2 text-brand-navy/20 hover:text-brand-sage transition-all cursor-pointer disabled:cursor-not-allowed"
              title="Modifier"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsDeleteOpen(true)
              }}
              className="opacity-0 group-hover:opacity-100 absolute top-0 right-0 p-2 text-brand-navy/20 hover:text-rose-500 transition-all cursor-pointer disabled:cursor-not-allowed"
              title="Supprimer"
            >
              <Trash className="w-4 h-4" />
            </button>
          </div>

          <ConfirmModal
            isOpen={isDeleteOpen}
            title="Supprimer la formation"
            description="Cette action est définitive."
            variant="danger"
            state={deleteState}
            confirmLabel="Supprimer"
            onCancel={() => {
              if (deleteState === 'loading') return
              setIsDeleteOpen(false)
              setDeleteState('idle')
            }}
            onConfirm={() => {
              if (!education.id) return
              setDeleteState('loading')
              router.delete('/dashboard/candidat/educations', {
                data: { id: education.id },
                onSuccess: () => {
                  setDeleteState('success')
                  setIsDeleteOpen(false)
                  setDeleteState('idle')
                },
                onError: () => {
                  setDeleteState('error')
                },
              })
            }}
            errorMessage="Impossible de supprimer la formation. Réessaie."
          />
        </>
      )}
    </li>
  );
};
