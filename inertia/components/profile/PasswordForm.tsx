import { useForm } from '@inertiajs/react'
import React from 'react'
import { rateLimitError } from '#shared/helpers/rate_limit'
import Button from '~/components/ui/Button'
import Input from '~/components/ui/Input'

/**
 * Changement de mot de passe de l'utilisateur connecté (#68), tous rôles.
 * Un e-mail de confirmation part côté serveur.
 */
export function PasswordForm() {
  const form = useForm({ current_password: '', password: '', password_confirmation: '' })
  const throttled = rateLimitError(form.errors)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    form.put('/dashboard/password', {
      preserveScroll: true,
      onSuccess: () => form.reset(),
      onError: () => form.reset('current_password'),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" aria-label="Changer mon mot de passe">
      {throttled && (
        <p role="alert" className="text-sm text-rose-600 font-medium">
          {throttled}
        </p>
      )}
      <Input
        label="Mot de passe actuel"
        type="password"
        autoComplete="current-password"
        required
        value={form.data.current_password}
        onChange={(e) => form.setData('current_password', e.target.value)}
        error={form.errors.current_password}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Nouveau mot de passe"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="Minimum 8 caractères"
          value={form.data.password}
          onChange={(e) => form.setData('password', e.target.value)}
          error={form.errors.password}
        />
        <Input
          label="Confirmer le nouveau mot de passe"
          type="password"
          autoComplete="new-password"
          required
          value={form.data.password_confirmation}
          onChange={(e) => form.setData('password_confirmation', e.target.value)}
          error={form.errors.password_confirmation}
        />
      </div>
      <Button
        type="submit"
        variant="secondary"
        className="w-full"
        isLoading={form.processing}
        disabled={form.processing}
      >
        Changer mon mot de passe
      </Button>
    </form>
  )
}
