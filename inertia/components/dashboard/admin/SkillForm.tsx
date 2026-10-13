import { useForm } from '@inertiajs/react'
import { SUPER_ADMIN_PATHS } from '#shared/constants/super_admin'
import type { SkillItem } from '#shared/types/skill/admin'
import Button from '~/components/ui/Button'
import Input from '~/components/ui/Input'

interface SkillFormProps {
  /** Compétence modifiée ; absente = ajout. */
  skill?: SkillItem
  onDone?: () => void
}

/** Ajout ou modification d'une compétence du catalogue (#73). */
export function SkillForm({ skill, onDone }: SkillFormProps) {
  const { data, setData, post, put, processing, errors, reset } = useForm({
    name: skill?.name ?? '',
    category: skill?.category ?? '',
  })

  return (
    <form
      aria-label={skill ? `Modifier ${skill.name}` : 'Ajouter une compétence'}
      className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]"
      onSubmit={(event) => {
        event.preventDefault()
        const options = {
          preserveScroll: true,
          onSuccess: () => {
            if (!skill) reset()
            onDone?.()
          },
        }
        if (skill) put(SUPER_ADMIN_PATHS.skill(skill.id), options)
        else post(SUPER_ADMIN_PATHS.skills, options)
      }}
    >
      <Input
        label="Nom"
        name="name"
        required
        value={data.name}
        onChange={(e) => setData('name', e.target.value)}
        error={errors.name}
      />
      <Input
        label="Catégorie"
        name="category"
        value={data.category}
        onChange={(e) => setData('category', e.target.value)}
        error={errors.category}
      />
      <div className="flex items-end gap-2">
        {skill && (
          <Button type="button" variant="outline" onClick={onDone} disabled={processing}>
            Annuler
          </Button>
        )}
        <Button type="submit" disabled={processing} isLoading={processing}>
          {skill ? 'Enregistrer' : 'Ajouter'}
        </Button>
      </div>
    </form>
  )
}
