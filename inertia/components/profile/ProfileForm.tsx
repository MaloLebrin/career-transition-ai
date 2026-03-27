import { useForm } from "@inertiajs/react";
import { useEffect } from "react";
import Button from "~/components/ui/Button";
import Input from "~/components/ui/Input";
import { UserSession } from "~/types/auth";

interface ProfileFormProps {
  user: UserSession;
  setSuccess: (success: boolean) => void;
}

export const ProfileForm = ({ user, setSuccess }: ProfileFormProps) => {
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
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => profileForm.setData('name', e.target.value)}
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
        />
      </div>

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
  );
};
