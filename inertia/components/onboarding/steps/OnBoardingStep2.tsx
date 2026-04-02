import { ChangeEvent, useCallback, useRef, useState } from 'react'
import Button from '~/components/ui/Button'
import { extractCVData } from '~/helpers/ai'

interface OnBoardingStep2Props {
  onNext: () => void
  setFormData: (data: any) => void
}

export const OnBoardingStep2 = ({
  onNext,
  setFormData,
}: OnBoardingStep2Props) => {
  const [isExtracting, setIsExtracting] = useState(false)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFileName(file.name)
    setIsExtracting(true)
    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = reader.result as string
      const extracted = await extractCVData(base64, file.type)
      if (extracted) {
        setFormData((prev: { name: any; }) => ({
          ...prev,
          name: extracted.name || prev.name,
          currentRole: extracted.currentRole || '',
          targetRole: extracted.suggestedTargetRole || '',
          skills: extracted.skills || [],
          summary: extracted.summary || '',
          experiences: extracted.experiences || [],
          educations: extracted.educations || [],
        }))
        onNext()
      }
      setIsExtracting(false)
    }
    reader.readAsDataURL(file)
  }, [setFormData, onNext])

  return (
    <div className="space-y-10 animate-slideUp">
      <div className="text-center">
        <h3 className="text-3xl font-bold text-brand-navy">Importez votre CV</h3>
        <p className="text-brand-navy/60 mt-2">
          Notre IA va extraire vos expériences et formations automatiquement.
        </p>
      </div>

      <div
        onClick={() => fileInputRef.current?.click()}
        className={`border-4 border-dashed rounded-[40px] p-16 text-center cursor-pointer transition-all ${isExtracting ? 'border-brand-sage bg-brand-sage/5' : 'border-brand-navy/5 hover:border-brand-sage/30 hover:bg-brand-ivory'}`}
      >
        <input
          type="file"
          ref={fileInputRef}
          disabled={isExtracting}
          className="hidden disabled:opacity-80 disabled:cursor-not-allowed"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileUpload}
        />
        {isExtracting ? (
          <div className="space-y-4">
            <div className="w-16 h-16 border-4 border-brand-sage border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-brand-sage font-bold uppercase text-[10px] tracking-widest">
              Extraction IA en cours...
            </p>
            {selectedFileName && (
              <p className="text-brand-navy/60 text-sm">Fichier: {selectedFileName}</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-20 h-20 bg-white shadow-xl shadow-brand-navy/5 rounded-3xl flex items-center justify-center text-brand-sage mx-auto">
              <svg
                className="w-10 h-10 stroke-[1.5]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
            </div>
            <p className="text-lg font-bold text-brand-navy">Déposez votre CV ici</p>
            <p className="text-brand-navy/40 text-sm">PDF, JPEG ou PNG (Max 5Mo)</p>
            {selectedFileName && (
              <p className="text-brand-sage text-sm font-semibold">
                Fichier sélectionné: {selectedFileName}
              </p>
            )}
          </div>
        )}
      </div>

      <Button onClick={onNext} variant="ghost" size="sm" className="w-full">
        Saisir manuellement (Plus long)
      </Button>
    </div>)
};
