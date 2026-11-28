import { useForm } from '@inertiajs/react'
import { useEffect } from 'react'
import Button from '~/components/ui/Button'
import Input from '~/components/ui/Input'
import { UserSession } from '~/types/auth'

interface ProfileFormProps {
  user: UserSession
  setSuccess: (success: boolean) => void
  /** Nouvelle adresse en attente de confirmation par lien (#143). */
  pendingEmail?: string | null
}

export const ProfileForm = ({ user, setSuccess, pendingEmail = null }: ProfileFormProps) => {
  const profileForm = useForm({ name: '', email: '' })

  useEffect(() => {
    if (user) {
      profileForm.setData({ name: user.name, email: user.email })
    }
  }, [user?.id])

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        profileForm.put('/dashboard/conseiller/profile', {
          onSuccess: () => {
            // L'adresse ne change qu'après le clic sur le lien (#143) : le champ revient à l'actuelle.
            profileForm.setData('email', user.email)
            setSuccess(true)
            setTimeout(() => setSuccess(false), 3000)
          },
        })
      }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Nom complet"
          value={profileForm.data.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            profileForm.setData('name', e.target.value)
          }
          placeholder="Votre nom"
          error={profileForm.errors.name}
        />
        <Input
          label="Email professionnel"
          value={profileForm.data.email}
          onChange={(e) => profileForm.setData('email', e.target.value)}
          placeholder="votre@email.fr"
          type="email"
          error={profileForm.errors.email}
          hint="Une nouvelle adresse ne remplace l’actuelle qu’après un clic sur le lien de confirmation que nous lui envoyons."
        />
      </div>

      {pendingEmail && (
        <p role="status" className="rounded-lg bg-info-soft px-4 py-3 text-sm text-ink-soft">
          Confirmation en attente pour <span className="font-medium text-ink">{pendingEmail}</span>{' '}
          : cliquez sur le lien reçu à cette adresse pour l’utiliser.
        </p>
      )}

      <div className="pt-2">
        <Button
          type="submit"
          isLoading={profileForm.processing}
          disabled={profileForm.processing}
          variant="secondary"
          className="w-full"
        >
          Mettre à jour mon profil
        </Button>
      </div>
    </form>
  )
}
