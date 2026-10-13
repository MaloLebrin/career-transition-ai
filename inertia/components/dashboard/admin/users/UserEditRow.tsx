import { useForm } from '@inertiajs/react'
import { SUPER_ADMIN_PATHS } from '#shared/constants/super_admin'
import type { UserListItem } from '#shared/types/super_admin/lists'
import Button from '~/components/ui/Button'
import Input from '~/components/ui/Input'

interface UserEditRowProps {
  user: UserListItem
  colSpan: number
  onClose: () => void
}

/** Ligne de formulaire sous un utilisateur : nom et e-mail (#73). */
export function UserEditRow({ user, colSpan, onClose }: UserEditRowProps) {
  const { data, setData, put, processing, errors } = useForm({
    name: user.name,
    email: user.email,
  })

  return (
    <tr className="border-b border-hairline bg-surface-soft">
      <td colSpan={colSpan} className="px-5 py-4">
        <form
          aria-label={`Modifier ${user.name}`}
          className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]"
          onSubmit={(event) => {
            event.preventDefault()
            put(SUPER_ADMIN_PATHS.user(user.id), { preserveScroll: true, onSuccess: onClose })
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
            label="E-mail"
            name="email"
            type="email"
            required
            value={data.email}
            onChange={(e) => setData('email', e.target.value)}
            error={errors.email}
            hint={
              data.email.trim().toLowerCase() !== user.email.toLowerCase()
                ? 'Changer l’adresse oblige à la reconfirmer.'
                : undefined
            }
          />
          <div className="flex items-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={processing}>
              Annuler
            </Button>
            <Button type="submit" disabled={processing} isLoading={processing}>
              Enregistrer
            </Button>
          </div>
        </form>
      </td>
    </tr>
  )
}
