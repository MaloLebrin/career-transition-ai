import React, { useRef, useState } from 'react'
import { extractCVData } from '../../services/geminiService'
import { Employee, Skill } from '../../types'
import Button from '../ui/Button'
import Card from '../ui/Card'
import Input from '../ui/Input'

interface Props {
  employee: Employee
  onComplete: (updatedEmployee: Employee) => void
}

const OnboardingFlow: React.FC<Props> = ({ employee, onComplete }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [isExtracting, setIsExtracting] = useState(false)

  // Added missing organizationId to match Omit<Employee, ...> type requirements
  const [formData, setFormData] = useState<
    Omit<Employee, 'id' | 'status' | 'onboarded' | 'exercises' | 'plan'>
  >({
    organizationId: employee.organizationId,
    name: employee.name,
    email: employee.email,
    currentRole: '',
    targetRole: '',
    skills: [] as Skill[],
    summary: '',
    experiences: [],
    educations: [],
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsExtracting(true)
    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = reader.result as string
      const extracted = await extractCVData(base64, file.type)

      if (extracted) {
        setFormData((prev) => ({
          ...prev,
          name: extracted.name || prev.name,
          currentRole: extracted.currentRole || '',
          targetRole: extracted.suggestedTargetRole || '',
          skills: extracted.skills || [],
          summary: extracted.summary || '',
          experiences: extracted.experiences || [],
          educations: extracted.educations || [],
        }))
        setStep(3)
      }
      setIsExtracting(false)
    }
    reader.readAsDataURL(file)
  }

  const handleFinalize = () => {
    onComplete({
      ...employee,
      ...formData,
      onboarded: true,
      status: 'active',
    })
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center animate-fadeIn">
      <Card className="w-full max-w-4xl overflow-hidden p-0 border-brand-navy/5">
        <div className="h-2 bg-brand-navy/5 w-full">
          <div
            className="h-full bg-brand-sage transition-all duration-700"
            style={{ width: `${(step / 3) * 100}%` }}
          ></div>
        </div>

        <div className="p-10 md:p-14">
          {step === 1 && (
            <div className="text-center space-y-8 animate-slideUp">
              <div className="w-24 h-24 bg-brand-sage/10 rounded-[32px] flex items-center justify-center text-brand-sage mx-auto">
                <svg
                  className="w-12 h-12 stroke-[1.5]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
              </div>
              <div className="space-y-4">
                <h2 className="text-4xl font-bold text-brand-navy tracking-tight">
                  Bonjour, {employee.name.split(' ')[0]}
                </h2>
                <p className="text-brand-navy/60 text-lg leading-relaxed max-w-lg mx-auto">
                  Prêt à lancer votre nouvelle étape de carrière ? Commençons par structurer votre
                  profil professionnel.
                </p>
              </div>
              <Button onClick={() => setStep(2)} size="lg" variant="dark">
                Compléter mon Profil
              </Button>
            </div>
          )}

          {step === 2 && (
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
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                />
                {isExtracting ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 border-4 border-brand-sage border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-brand-sage font-bold uppercase text-[10px] tracking-widest">
                      Extraction Gemini en cours...
                    </p>
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
                  </div>
                )}
              </div>

              <Button onClick={() => setStep(3)} variant="ghost" size="sm" className="w-full">
                Saisir manuellement (Plus long)
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-10 animate-slideUp max-h-[70vh] overflow-y-auto custom-scrollbar pr-4">
              <div className="text-center">
                <h3 className="text-3xl font-bold text-brand-navy">Vérification du Profil</h3>
                <p className="text-brand-navy/60 mt-2">
                  L'IA a organisé votre parcours. Vérifiez que tout est correct.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Nom complet"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <Input label="Email" value={formData.email} readOnly />
                <Input
                  label="Poste actuel"
                  value={formData.currentRole}
                  onChange={(e) => setFormData({ ...formData, currentRole: e.target.value })}
                />
                <Input
                  label="Cible pro"
                  value={formData.targetRole}
                  onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                />
              </div>

              {formData.experiences.length > 0 && (
                <section className="space-y-4">
                  <h4 className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest px-1">
                    Expériences détectées
                  </h4>
                  <div className="space-y-3">
                    {formData.experiences.map((exp) => (
                      <div
                        key={exp.id}
                        className="p-4 bg-white rounded-2xl border border-brand-navy/5 flex justify-between items-center"
                      >
                        <div>
                          <div className="font-bold text-brand-navy">
                            {exp.title}{' '}
                            <span className="text-[9px] font-bold uppercase text-brand-sage ml-2">
                              {exp.type}
                            </span>
                          </div>
                          <div className="text-xs text-brand-navy/40">
                            {exp.company} • {exp.startDate}{' '}
                            {exp.isCurrent ? '- Présent' : exp.endDate ? `- ${exp.endDate}` : ''}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <Button onClick={handleFinalize} className="w-full" size="lg">
                Confirmer et accéder à mon espace
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export default OnboardingFlow
