import { useForm } from '@inertiajs/react'
import React, { useEffect } from 'react'
import type { AdvisorRole } from '../../types'
import Button from '../ui/Button'
import Card from '../ui/Card'
import Input from '../ui/Input'

interface Props {
  onClose: () => void
}

const roles: { id: AdvisorRole; title: string; desc: string }[] = [
  { id: 'admin', title: 'Administrateur', desc: 'Gestion du cabinet, équipe et facturation' },
  { id: 'expert', title: 'Expert Référent', desc: 'Accompagnement et supervision de dossiers' },
  { id: 'consultant', title: 'Consultant', desc: 'Accompagnement de ses propres candidats' },
]

const AddAdvisorModal: React.FC<Props> = ({ onClose }) => {
  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    email: '',
    role: 'consultant' as AdvisorRole,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post('/dashboard/conseiller/settings/organization/advisors', {
      onSuccess: () => {
        reset()
        onClose()
      },
    })
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

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
    >
      <Card className="w-full max-w-xl relative animate-slideUp overflow-hidden">
        <Button
          onClick={onClose}
          variant="ghost"
          size="sm"
          className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 z-10 p-2"
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

        <div className="mb-10 text-center">
          <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none">
            Nouveau Collaborateur
          </h2>
          <p className="text-slate-500 mt-3 font-medium">
            Définissez l'identité et le niveau d'accès du conseiller.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-6">
            <Input
              label="Nom complet"
              required
              placeholder="Sophie Martin"
              value={data.name}
              onChange={(e) => setData('name', e.target.value)}
              error={errors.name}
            />
            <Input
              label="Email professionnel"
              required
              type="email"
              placeholder="s.martin@votre-cabinet.fr"
              value={data.email}
              onChange={(e) => setData('email', e.target.value)}
              error={errors.email}
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
              Rôle et permissions
            </label>
            <div className="grid grid-cols-1 gap-3">
              {roles.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setData('role', r.id)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between group cursor-pointer disabled:cursor-not-allowed ${
                    data.role === r.id
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                  }`}
                >
                  <div>
                    <div
                      className={`font-black text-sm ${
                        data.role === r.id ? 'text-orange-600' : 'text-slate-700'
                      }`}
                    >
                      {r.title}
                    </div>
                    <div className="text-[10px] font-bold text-slate-400">{r.desc}</div>
                  </div>
                  {data.role === r.id && (
                    <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-lg">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="3"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
            {errors.role && (
              <p className="text-[9px] font-bold text-rose-500 px-2">{errors.role}</p>
            )}
          </div>

          <div className="pt-4 flex flex-col gap-3">
            <Button
              type="submit"
              className="w-full shadow-orange-100"
              variant="secondary"
              size="lg"
              isLoading={processing}
              disabled={processing}
            >
              Envoyer l'invitation
            </Button>
            <p className="text-[9px] text-slate-400 text-center font-bold uppercase tracking-widest italic">
              L'utilisateur recevra ses accès immédiatement par email.
            </p>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default AddAdvisorModal
