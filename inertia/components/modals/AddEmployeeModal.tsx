import React from 'react'
import { useForm } from '@inertiajs/react'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Card from '../ui/Card'

interface Props {
  onClose: () => void
}

const AddEmployeeModal: React.FC<Props> = ({ onClose }) => {
  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    email: '',
    currentRole: '',
    targetRole: '',
    summary: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post('/dashboard/employees', {
      onSuccess: () => {
        reset()
        onClose()
      },
    })
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fadeIn">
      <Card className="w-full max-w-lg relative animate-slideUp">
        <Button
          onClick={onClose}
          variant="ghost"
          size="sm"
          className="absolute top-8 right-8 text-slate-400 hover:text-slate-600"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          }
        />

        <div className="mb-8">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Inviter un Talent</h2>
          <p className="text-slate-500 mt-2">
            L'invitation sera envoyée par email pour qu'il complète son profil.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <Input
              label="Nom complet"
              required
              placeholder="Ex: Jean Dupont"
              value={data.name}
              onChange={(e) => setData('name', e.target.value)}
              error={errors.name}
            />
            <Input
              label="Email professionnel"
              required
              type="email"
              placeholder="j.dupont@exemple.fr"
              value={data.email}
              onChange={(e) => setData('email', e.target.value)}
              error={errors.email}
            />
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={processing}>
            {processing ? 'Envoi...' : "Envoyer l'invitation"}
          </Button>
        </form>
      </Card>
    </div>
  )
}

export default AddEmployeeModal
