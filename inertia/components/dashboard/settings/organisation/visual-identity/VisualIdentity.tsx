import {
  ORGANIZATION_LOGO_EXTENSIONS,
  ORGANIZATION_LOGO_MAX_SIZE,
  ORGANIZATION_LOGO_ROUTE,
} from '#shared/constants/organisation'
import { router, useForm } from '@inertiajs/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import Button from '~/components/ui/Button'
import Card from '~/components/ui/Card'
import { Organization } from '~/types/organization'

interface VisualIdentityProps {
  organization: Organization
}

const ACCEPT = ORGANIZATION_LOGO_EXTENSIONS.map((ext) => `.${ext}`).join(',')

/** Logo du cabinet : choix d'une image, aperçu, envoi (Cloudinary) et suppression. */
export const VisualIdentity = ({ organization }: VisualIdentityProps) => {
  const form = useForm<{ logo: File | null }>({ logo: null })
  const inputRef = useRef<HTMLInputElement>(null)
  const [deleting, setDeleting] = useState(false)

  const previewUrl = useMemo(
    () => (form.data.logo ? URL.createObjectURL(form.data.logo) : null),
    [form.data.logo]
  )
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const displayed = previewUrl ?? organization.logoUrl ?? null

  const cancel = () => {
    form.reset()
    if (inputRef.current) inputRef.current.value = ''
  }

  const submit = () => {
    form.post(ORGANIZATION_LOGO_ROUTE, {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: cancel,
    })
  }

  const remove = () => {
    router.delete(ORGANIZATION_LOGO_ROUTE, {
      preserveScroll: true,
      onStart: () => setDeleting(true),
      onFinish: () => setDeleting(false),
    })
  }

  return (
    <Card className="p-10 text-center space-y-6">
      <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">
        Identité Visuelle
      </h3>
      <div className="relative group mx-auto w-32 h-32">
        <div className="w-32 h-32 bg-slate-50 border-4 border-dashed border-slate-200 rounded-[32px] flex items-center justify-center text-slate-300 group-hover:border-indigo-300 group-hover:text-indigo-400 transition-all overflow-hidden">
          {displayed ? (
            <img src={displayed} alt="Logo du cabinet" className="w-full h-full object-contain" />
          ) : (
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2-2v12a2 2 0 002 2z"
              />
            </svg>
          )}
        </div>
        <Button
          size="sm"
          type="button"
          aria-label="Choisir un logo"
          className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
          onClick={() => inputRef.current?.click()}
          disabled={form.processing || deleting}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          data-testid="logo-input"
          onChange={(e) => form.setData('logo', e.target.files?.[0] ?? null)}
        />
      </div>

      {form.errors.logo && (
        <p className="text-xs font-bold text-rose-500" role="alert">
          {form.errors.logo}
        </p>
      )}

      {form.data.logo ? (
        <div className="flex justify-center gap-3">
          <Button type="button" size="sm" onClick={submit} isLoading={form.processing}>
            Enregistrer le logo
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={cancel}
            disabled={form.processing}
          >
            Annuler
          </Button>
        </div>
      ) : (
        organization.logoUrl && (
          <Button type="button" size="sm" variant="outline" onClick={remove} isLoading={deleting}>
            Supprimer le logo
          </Button>
        )
      )}

      <p className="text-xs text-slate-500 font-medium">
        Format carré, PNG, JPG, WebP ou SVG (max {ORGANIZATION_LOGO_MAX_SIZE.replace('mb', ' Mo')}).
      </p>
    </Card>
  )
}
