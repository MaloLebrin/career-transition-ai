import { useForm } from '@inertiajs/react'
import { EXPERT_REQUEST_PATHS } from '#shared/constants/expert_request'
import { ROLE_LABELS } from '#shared/helpers/roles'
import type { PlatformTeamMember } from '#shared/types/expert_request/admin'
import Button from '~/components/ui/Button'
import SelectField, { type SelectFieldOption } from '~/components/ui/SelectField'

interface AssignExpertFormProps {
  requestId: number
  experts: PlatformTeamMember[]
}

/** Choix d'un membre de l'équipe interne puis assignation (#105). */
export function AssignExpertForm({ requestId, experts }: AssignExpertFormProps) {
  const { data, setData, post, processing, errors } = useForm({
    expertUserId: experts[0] ? String(experts[0].id) : '',
  })

  if (experts.length === 0) {
    return (
      <p className="text-sm text-muted">
        Aucun membre dans l’équipe interne : invitez un expert depuis « Équipe interne ».
      </p>
    )
  }

  const options: SelectFieldOption<string>[] = experts.map((expert) => ({
    value: String(expert.id),
    label: `${expert.name} — ${ROLE_LABELS[expert.role]}`,
    description: `${expert.assignedCandidatesCount} candidat(s) suivi(s)${
      expert.onboardingCompleted ? '' : ' · compte non activé'
    }`,
  }))

  return (
    <form
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
      aria-label="Assigner un expert"
      onSubmit={(event) => {
        event.preventDefault()
        post(EXPERT_REQUEST_PATHS.adminAssign(requestId), { preserveScroll: true })
      }}
    >
      <SelectField
        label="Expert"
        name="expertUserId"
        className="flex-1"
        options={options}
        value={data.expertUserId}
        onChange={(value) => setData('expertUserId', value)}
        error={errors.expertUserId}
        showSelectedOptionDescription
      />
      <Button type="submit" variant="primary" size="sm" isLoading={processing}>
        Assigner
      </Button>
    </form>
  )
}
