import { useForm } from '@inertiajs/react'
import React, { useCallback, useEffect } from 'react'
import { SUPER_ADMIN_ASSIGNABLE_ROLES } from '#shared/constants/roles'
import { ROLE_LABELS } from '#shared/helpers/roles'
import type { UserRole } from '#shared/types/advisor/roles'
import Button from '../ui/Button'
import Card from '../ui/Card'
import Input from '../ui/Input'

interface OrganizationOption {
  id: number
  name: string
  slug: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  organizations: OrganizationOption[]
}

export const CreateUserModal: React.FC<Props> = ({ isOpen, onClose, organizations }) => {
  const { data, setData, post, processing, errors, reset, transform } = useForm({
    organizationId: '' as string | number,
    name: '',
    email: '',
    role: 'advisor' as UserRole,
  })

  transform((payload) => ({
    ...payload,
    organizationId:
      typeof payload.organizationId === 'string'
        ? Number(payload.organizationId)
        : payload.organizationId,
  }))

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      post('/dashboard/super-admin/users', {
        onSuccess: () => {
          reset()
          onClose()
        },
      })
    },
    [post, reset, onClose]
  )

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const canSubmit = Boolean(
    String(data.organizationId).trim() &&
    data.name.trim() &&
    data.email.trim() &&
    organizations.length > 0
  )

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-200 flex items-center justify-center p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
      aria-modal="true"
      role="dialog"
      aria-labelledby="create-user-modal-title"
    >
      <Card className="w-full max-w-xl relative animate-slideUp overflow-hidden p-8 md:p-10">
        <Button
          type="button"
          onClick={onClose}
          variant="ghost"
          size="sm"
          className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 z-10 p-2"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </Button>

        <div className="mb-8 text-center pr-8">
          <h2
            id="create-user-modal-title"
            className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-none"
          >
            Nouvel utilisateur
          </h2>
          <p className="text-slate-500 mt-2 text-sm font-medium">
            Créez un compte dans un cabinet client et envoyez-lui un lien pour définir son mot de
            passe.
          </p>
        </div>

        {organizations.length === 0 ? (
          <p className="text-sm text-brand-navy/60 text-center py-4">
            Aucune organisation cliente disponible. Créez d’abord une organisation.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest px-2 block mb-2">
                Organisation
              </label>
              <select
                value={data.organizationId === '' ? '' : String(data.organizationId)}
                onChange={(e) => setData('organizationId', e.target.value)}
                className="w-full border border-brand-navy/10 rounded-2xl text-sm px-4 py-3 text-brand-navy bg-white outline-none focus:ring-2 focus:ring-brand-sage/30"
                required
              >
                <option value="">Choisir un cabinet…</option>
                {organizations.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
              {errors.organizationId && (
                <p className="text-[10px] font-bold text-rose-500 mt-1 px-2">
                  {errors.organizationId}
                </p>
              )}
            </div>

            <Input
              label="Nom complet"
              required
              placeholder="Jean Dupont"
              value={data.name}
              onChange={(e) => setData('name', e.target.value)}
              error={errors.name}
            />
            <Input
              label="Email"
              required
              type="email"
              placeholder="jean@cabinet.fr"
              value={data.email}
              onChange={(e) => setData('email', e.target.value)}
              error={errors.email}
            />

            <div>
              <label className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest px-2 block mb-2">
                Rôle
              </label>
              <select
                value={data.role}
                onChange={(e) => setData('role', e.target.value as UserRole)}
                className="w-full border border-brand-navy/10 rounded-2xl text-sm px-4 py-3 text-brand-navy bg-white outline-none focus:ring-2 focus:ring-brand-sage/30"
              >
                {SUPER_ADMIN_ASSIGNABLE_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
              {errors.role && (
                <p className="text-[10px] font-bold text-rose-500 mt-1 px-2">{errors.role}</p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onClose}
                disabled={processing}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={!canSubmit || processing}
                isLoading={processing}
              >
                Créer et inviter
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  )
}
