import { useForm } from '@inertiajs/react'
import { CheckCircle2 } from 'lucide-react'
import React from 'react'
import { rateLimitError } from '#shared/helpers/rate_limit'
import Button from '~/components/ui/Button'
import Input from '~/components/ui/Input'
import { Textarea } from '~/components/ui/Textarea'

export type ContactDemoFormVariant = 'contact' | 'demo'

interface ContactDemoFormProps {
  variant?: ContactDemoFormVariant
  title?: string
  description?: string
  className?: string
}

interface FormData {
  name: string
  email: string
  phone: string
  organization: string
  message: string
  type: ContactDemoFormVariant
}

export function ContactDemoForm({
  variant = 'demo',
  title,
  description,
  className = '',
}: ContactDemoFormProps) {
  const { data, setData, post, processing, errors, wasSuccessful, reset } = useForm<FormData>({
    name: '',
    email: '',
    phone: '',
    organization: '',
    message: '',
    type: variant,
  })

  const defaultTitle = variant === 'demo' ? 'Demander une démo' : 'Nous contacter'
  const defaultDescription =
    variant === 'demo'
      ? 'Décrivez votre organisation : nous revenons vers vous avec une proposition adaptée sous 48h ouvrées.'
      : 'Une question ? Écrivez-nous, nous répondons sous 48h ouvrées.'
  const submitLabel = variant === 'demo' ? 'Demander une démo' : 'Envoyer le message'
  const messagePlaceholder =
    variant === 'demo' ? 'Contexte, volume de bilans, nombre de conseillers…' : 'Votre message…'

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    post('/contact-requests', { preserveScroll: true, onSuccess: () => reset() })
  }

  const throttled = rateLimitError(errors)

  if (wasSuccessful) {
    return (
      <div
        role="status"
        className={`flex flex-col items-center justify-center gap-4 py-12 text-center ${className}`}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success-soft text-success">
          <CheckCircle2 size={24} aria-hidden="true" />
        </span>
        <p className="text-title-md">
          {variant === 'demo' ? 'Demande envoyée !' : 'Message envoyé !'}
        </p>
        <p className="max-w-sm text-sm text-muted">
          Nous avons bien reçu votre message et reviendrons vers vous sous 48h ouvrées.
        </p>
      </div>
    )
  }

  return (
    <div className={className}>
      {(title || defaultTitle) && (
        <div className="mb-6">
          <h3 className="text-title-lg">{title ?? defaultTitle}</h3>
          {(description || defaultDescription) && (
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {description ?? defaultDescription}
            </p>
          )}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Nom"
            required
            value={data.name}
            onChange={(e) => setData('name', e.target.value)}
            error={errors.name}
            placeholder="Votre nom"
            autoComplete="name"
            showClearButton={false}
          />
          <Input
            label="Email"
            type="email"
            required
            value={data.email}
            onChange={(e) => setData('email', e.target.value)}
            error={errors.email}
            placeholder="prenom@cabinet.fr"
            autoComplete="email"
            showClearButton={false}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Téléphone"
            type="tel"
            value={data.phone}
            onChange={(e) => setData('phone', e.target.value)}
            error={errors.phone}
            placeholder="+33 6 00 00 00 00"
            autoComplete="tel"
            showClearButton={false}
          />
          <Input
            label="Cabinet / Organisation"
            value={data.organization}
            onChange={(e) => setData('organization', e.target.value)}
            error={errors.organization}
            placeholder="Nom du cabinet"
            autoComplete="organization"
            showClearButton={false}
          />
        </div>

        <Textarea
          label="Message"
          required
          value={data.message}
          onChange={(e) => setData('message', e.target.value)}
          error={errors.message}
          placeholder={messagePlaceholder}
          rows={5}
        />

        {throttled && (
          <p role="alert" className="text-sm text-danger">
            {throttled}
          </p>
        )}

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={processing}
            className="w-full sm:w-auto"
          >
            {submitLabel}
          </Button>
          <p className="text-sm text-muted">Pas de spam. Réponse sous 48h ouvrées.</p>
        </div>
      </form>
    </div>
  )
}
