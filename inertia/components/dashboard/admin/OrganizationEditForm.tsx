import { useForm } from '@inertiajs/react'
import { SUPER_ADMIN_PATHS } from '#shared/constants/super_admin'
import Button from '~/components/ui/Button'
import Card from '~/components/ui/Card'
import Input from '~/components/ui/Input'

interface OrganizationEditFormProps {
  organization: { id: number; name: string; slug: string }
}

/** Renommage d'une organisation cliente par le super admin (#73). */
export function OrganizationEditForm({ organization }: OrganizationEditFormProps) {
  const { data, setData, put, processing, errors, isDirty } = useForm({
    name: organization.name,
    slug: organization.slug,
  })

  return (
    <Card className="space-y-5">
      <h2 className="text-title-md text-ink">Informations</h2>
      <form
        className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]"
        aria-label="Modifier l’organisation"
        onSubmit={(event) => {
          event.preventDefault()
          put(SUPER_ADMIN_PATHS.organization(organization.id), { preserveScroll: true })
        }}
      >
        <Input
          label="Nom du cabinet"
          name="name"
          required
          value={data.name}
          onChange={(e) => setData('name', e.target.value)}
          error={errors.name}
        />
        <Input
          label="Slug"
          name="slug"
          value={data.slug}
          onChange={(e) => setData('slug', e.target.value)}
          error={errors.slug}
        />
        <div className="flex items-end">
          <Button type="submit" disabled={!isDirty || processing} isLoading={processing}>
            Enregistrer
          </Button>
        </div>
      </form>
    </Card>
  )
}
