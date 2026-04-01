import { useForm } from '@inertiajs/react'
import React, { useCallback, useEffect } from 'react'
import Button from '../ui/Button'
import Card from '../ui/Card'
import Input from '../ui/Input'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export const CreateOrganizationModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { data, setData, post, processing, errors, reset, transform } = useForm({
    name: '',
    slug: '',
    ownerName: '',
    ownerEmail: '',
  })

  transform((payload) => ({
    ...payload,
    slug: payload.slug?.trim() ? payload.slug.trim() : undefined,
  }))

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      post('/dashboard/super-admin/organizations', {
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

  const canSubmit = Boolean(data.name.trim() && data.ownerEmail.trim())

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
      aria-labelledby="create-org-modal-title"
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
          <div className="w-16 h-16 bg-brand-sage/15 text-brand-sage rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <h2
            id="create-org-modal-title"
            className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-none"
          >
            Nouvelle organisation
          </h2>
          <p className="text-slate-500 mt-2 text-sm font-medium">
            Créez le cabinet et invitez le propriétaire (admin) par email pour finaliser son accès.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <p className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest">
            Cabinet
          </p>
          <Input
            label="Nom du cabinet"
            required
            placeholder="Cabinet Dupont"
            value={data.name}
            onChange={(e) => setData('name', e.target.value)}
            error={errors.name}
          />
          <Input
            label="Slug (optionnel)"
            placeholder="cabinet-dupont"
            value={data.slug}
            onChange={(e) => setData('slug', e.target.value)}
            error={errors.slug}
          />

          <p className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest pt-2">
            Propriétaire
          </p>
          <Input
            label="Nom du propriétaire"
            required
            placeholder="Jean Dupont"
            value={data.ownerName}
            onChange={(e) => setData('ownerName', e.target.value)}
            error={errors.ownerName}
          />
          <Input
            label="Email du propriétaire"
            required
            type="email"
            placeholder="jean.dupont@cabinet.fr"
            value={data.ownerEmail}
            onChange={(e) => setData('ownerEmail', e.target.value)}
            error={errors.ownerEmail}
          />

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
      </Card>
    </div>
  )
}
