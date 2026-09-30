import { useForm } from '@inertiajs/react'
import React from 'react'
import Button from '~/components/ui/Button'
import Input from '~/components/ui/Input'
import type { EmployeeData } from '~/types/employee'

interface IdentityFormProps {
  employee: Pick<EmployeeData, 'name' | 'currentRole' | 'targetRole' | 'summary'>
}

/**
 * Identité du candidat après l'onboarding (#70) : nom, poste actuel, poste
 * visé et résumé (`PUT /dashboard/candidat/profile`). L'e-mail n'est pas
 * modifiable ici : il attend la vérification d'adresse (#68).
 */
export function IdentityForm({ employee }: IdentityFormProps) {
  const form = useForm({
    name: employee.name ?? '',
    currentRole: employee.currentRole ?? '',
    targetRole: employee.targetRole ?? '',
    summary: employee.summary ?? '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    form.put('/dashboard/candidat/profile', {
      preserveScroll: true,
      onSuccess: () => form.setDefaults(),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" aria-label="Modifier mon identité">
      <Input
        label="Nom complet"
        required
        autoComplete="name"
        maxLength={255}
        value={form.data.name}
        onChange={(e) => form.setData('name', e.target.value)}
        error={form.errors.name}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Poste actuel"
          maxLength={255}
          value={form.data.currentRole}
          onChange={(e) => form.setData('currentRole', e.target.value)}
          error={form.errors.currentRole}
        />
        <Input
          label="Poste visé"
          maxLength={255}
          value={form.data.targetRole}
          onChange={(e) => form.setData('targetRole', e.target.value)}
          error={form.errors.targetRole}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label
          htmlFor="identity-summary"
          className="text-[10px] font-bold text-brand-navy/50 uppercase tracking-widest"
        >
          Résumé
        </label>
        <textarea
          id="identity-summary"
          rows={4}
          maxLength={5000}
          value={form.data.summary}
          onChange={(e) => form.setData('summary', e.target.value)}
          aria-invalid={form.errors.summary ? true : undefined}
          className="w-full rounded-2xl border border-brand-navy/10 bg-white px-4 py-3 text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-sage/40"
        />
        {form.errors.summary && (
          <p className="text-xs text-rose-600 font-medium">{form.errors.summary}</p>
        )}
      </div>
      <Button
        type="submit"
        variant="secondary"
        className="w-full"
        isLoading={form.processing}
        disabled={form.processing || !form.isDirty}
      >
        Enregistrer mon identité
      </Button>
    </form>
  )
}
