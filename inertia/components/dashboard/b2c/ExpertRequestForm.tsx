import { useForm } from '@inertiajs/react'
import {
  EXPERT_REQUEST_AVAILABILITY_MAX,
  EXPERT_REQUEST_MESSAGE_MAX,
  EXPERT_REQUEST_PATHS,
} from '#shared/constants/expert_request'
import Button from '~/components/ui/Button'
import Card from '~/components/ui/Card'
import { Textarea } from '~/components/ui/Textarea'

/** Formulaire de demande d'accompagnement (#103), réservé aux particuliers au forfait. */
export function ExpertRequestForm() {
  const { data, setData, post, processing, errors } = useForm({ message: '', availability: '' })

  return (
    <Card className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-title-md text-ink">Demander un accompagnement</h2>
        <p className="text-sm text-muted">
          Dites-nous où vous en êtes et ce que vous attendez : un expert de la plateforme prend
          connaissance de votre demande et vous contacte. Le tarif et le cadre de l’accompagnement
          vous sont présentés avant tout engagement.
        </p>
      </div>
      <form
        className="space-y-5"
        aria-label="Demande d’accompagnement"
        onSubmit={(event) => {
          event.preventDefault()
          post(EXPERT_REQUEST_PATHS.create, { preserveScroll: true })
        }}
      >
        <Textarea
          label="Votre demande"
          name="message"
          required
          rows={6}
          maxLength={EXPERT_REQUEST_MESSAGE_MAX}
          value={data.message}
          onChange={(e) => setData('message', e.target.value)}
          error={errors.message}
          hint={`Ce que vous souhaitez travailler avec un expert (${EXPERT_REQUEST_MESSAGE_MAX} caractères maximum).`}
        />
        <Textarea
          label="Vos disponibilités"
          name="availability"
          rows={2}
          maxLength={EXPERT_REQUEST_AVAILABILITY_MAX}
          value={data.availability}
          onChange={(e) => setData('availability', e.target.value)}
          error={errors.availability}
          hint="Optionnel : jours et créneaux qui vous conviennent."
        />
        <Button type="submit" variant="primary" isLoading={processing}>
          Envoyer ma demande
        </Button>
      </form>
    </Card>
  )
}
