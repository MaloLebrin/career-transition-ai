import { useForm } from '@inertiajs/react'
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'
import React from 'react'
import { rateLimitError } from '#shared/helpers/rate_limit'
import Button from '~/components/ui/Button'

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
    variant === 'demo'
      ? 'Contexte, volume de bilans, nombre de conseillers…'
      : 'Votre message…'

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    post('/contact-requests', { preserveScroll: true, onSuccess: () => reset() })
  }

  const throttled = rateLimitError(errors)

  if (wasSuccessful) {
    return (
      <div className={`flex flex-col items-center justify-center gap-4 py-12 ${className}`}>
        <div className="w-14 h-14 rounded-full bg-brand-sage/10 flex items-center justify-center">
          <CheckCircle2 className="text-brand-sage" size={32} />
        </div>
        <p className="text-xl font-bold text-brand-navy text-center">
          {variant === 'demo' ? 'Demande envoyée !' : 'Message envoyé !'}
        </p>
        <p className="text-brand-navy/60 text-center max-w-sm">
          Nous avons bien reçu votre message et reviendrons vers vous sous 48h ouvrées.
        </p>
      </div>
    )
  }

  return (
    <div className={className}>
      {(title || defaultTitle) && (
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-brand-navy tracking-tight">
            {title ?? defaultTitle}
          </h3>
          {(description || defaultDescription) && (
            <p className="mt-2 text-brand-navy/60 font-medium leading-relaxed">
              {description ?? defaultDescription}
            </p>
          )}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Nom *" error={errors.name}>
            <input
              value={data.name}
              onChange={(e) => setData('name', e.target.value)}
              className={fieldClass(!!errors.name)}
              placeholder="Votre nom"
              autoComplete="name"
            />
          </FormField>

          <FormField label="Email *" error={errors.email}>
            <input
              type="email"
              value={data.email}
              onChange={(e) => setData('email', e.target.value)}
              className={fieldClass(!!errors.email)}
              placeholder="prenom@cabinet.fr"
              autoComplete="email"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Téléphone" error={errors.phone}>
            <input
              type="tel"
              value={data.phone}
              onChange={(e) => setData('phone', e.target.value)}
              className={fieldClass(!!errors.phone)}
              placeholder="+33 6 00 00 00 00"
              autoComplete="tel"
            />
          </FormField>

          <FormField label="Cabinet / Organisation" error={errors.organization}>
            <input
              value={data.organization}
              onChange={(e) => setData('organization', e.target.value)}
              className={fieldClass(!!errors.organization)}
              placeholder="Nom du cabinet"
              autoComplete="organization"
            />
          </FormField>
        </div>

        <FormField label="Message *" error={errors.message}>
          <textarea
            value={data.message}
            onChange={(e) => setData('message', e.target.value)}
            className={`${fieldClass(!!errors.message)} min-h-[120px] resize-y`}
            placeholder={messagePlaceholder}
          />
        </FormField>

        {throttled && (
          <p role="alert" className="text-sm text-rose-500 font-medium">
            {throttled}
          </p>
        )}

        <div className="pt-2 flex flex-col sm:flex-row items-start gap-3">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={processing}
            className="w-full sm:w-auto"
          >
            {processing ? (
              <Loader2 size={18} className="mr-2 animate-spin" />
            ) : (
              <ArrowRight size={18} className="mr-2" />
            )}
            {submitLabel}
          </Button>
        </div>

        <p className="text-xs font-bold uppercase tracking-widest text-brand-navy/30">
          Pas de spam • Réponse sous 48h ouvrées
        </p>
      </form>
    </div>
  )
}

function FormField({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-brand-navy/70">{label}</label>
      {children}
      {error && <span className="text-xs text-rose-500 font-medium">{error}</span>}
    </div>
  )
}

function fieldClass(hasError: boolean): string {
  return [
    'w-full px-4 py-3 rounded-2xl border bg-white focus:outline-none focus:ring-2 transition-colors',
    hasError
      ? 'border-rose-300 focus:ring-rose-200'
      : 'border-brand-navy/10 focus:ring-brand-sage/30',
  ].join(' ')
}
