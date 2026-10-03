import { useForm } from '@inertiajs/react'
import { EXPERT_REQUEST_PATHS } from '#shared/constants/expert_request'
import {
  PLATFORM_TEAM_ROLES,
  ROLE_DESCRIPTIONS,
  type PlatformTeamRole,
} from '#shared/constants/roles'
import { ROLE_LABELS } from '#shared/helpers/roles'
import Button from '~/components/ui/Button'
import Card from '~/components/ui/Card'
import Input from '~/components/ui/Input'
import SelectField, { type SelectFieldOption } from '~/components/ui/SelectField'

const ROLE_OPTIONS: SelectFieldOption<PlatformTeamRole>[] = PLATFORM_TEAM_ROLES.map((role) => ({
  value: role,
  label: ROLE_LABELS[role],
  description: ROLE_DESCRIPTIONS[role],
}))

/** Invitation d'un membre de l'équipe interne (#105) : même activation que les cabinets. */
export function InvitePlatformMemberForm() {
  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    email: '',
    role: PLATFORM_TEAM_ROLES[0] as PlatformTeamRole,
  })

  return (
    <Card className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-title-md text-ink">Inviter un membre</h2>
        <p className="text-sm text-muted">
          Un lien d’activation lui est envoyé par e-mail. Le rôle « {ROLE_LABELS.advisor} » est
          celui des experts assignés aux particuliers.
        </p>
      </div>
      <form
        className="grid gap-4 sm:grid-cols-2"
        aria-label="Inviter un membre de l’équipe interne"
        onSubmit={(event) => {
          event.preventDefault()
          post(EXPERT_REQUEST_PATHS.team, {
            preserveScroll: true,
            onSuccess: () => reset('name', 'email'),
          })
        }}
      >
        <Input
          label="Nom complet"
          name="name"
          required
          value={data.name}
          onChange={(e) => setData('name', e.target.value)}
          error={errors.name}
        />
        <Input
          label="E-mail"
          name="email"
          type="email"
          required
          value={data.email}
          onChange={(e) => setData('email', e.target.value)}
          error={errors.email}
        />
        <SelectField
          label="Rôle"
          name="role"
          options={ROLE_OPTIONS}
          value={data.role}
          onChange={(value) => setData('role', value)}
          error={errors.role}
          showSelectedOptionDescription
        />
        <div className="flex items-end">
          <Button type="submit" variant="primary" isLoading={processing}>
            Inviter
          </Button>
        </div>
      </form>
    </Card>
  )
}
