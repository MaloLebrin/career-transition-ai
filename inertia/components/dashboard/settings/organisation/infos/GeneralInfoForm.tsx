import { useForm } from "@inertiajs/react";
import { useEffect } from "react";
import Button from "~/components/ui/Button";
import Card from "~/components/ui/Card";
import Input from "~/components/ui/Input";
import { Organization } from "~/types/Organization";

interface GeneralInfoFormProps {
  organization: Organization;
}

export const GeneralInfoForm = ({ organization: org }: GeneralInfoFormProps) => {
  const orgForm = useForm({ name: '', slug: '' })

  useEffect(() => {
    if (org) orgForm.setData({ name: org.name, slug: org.slug })
  }, [org?.id])

  return (
    <Card className="space-y-8 p-10">
      <h3 className="text-xl font-black text-slate-900 flex items-center">
        <span className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mr-3">
          🏢
        </span>
        Informations Générales
      </h3>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          orgForm.put('/dashboard/conseiller/settings/organization')
        }}
        className="space-y-6"
      >
        <Input
          label="Nom du Cabinet"
          value={orgForm.data.name}
          onChange={(e) => orgForm.setData('name', e.target.value)}
          placeholder="Ex: FTC Paris"
          error={orgForm.errors.name}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Slug URL"
            value={orgForm.data.slug}
            onChange={(e) => orgForm.setData('slug', e.target.value)}
            placeholder="ftc-paris"
            error={orgForm.errors.slug}
          />
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
              Date de création
            </label>
            <div className="p-4 bg-slate-50 border-2 border-transparent rounded-2xl font-bold text-sm text-slate-400">
              {new Date(org.createdAt).toLocaleDateString('fr-FR')}
            </div>
          </div>
        </div>

        <div className="pt-4">
          <Button
            type="submit"
            isLoading={orgForm.processing}
            disabled={orgForm.processing}
            className="w-full shadow-indigo-100"
          >
            Mettre à jour les infos
          </Button>
        </div>
      </form>
    </Card>
  );
};
