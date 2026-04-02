import React, { useRef, useState } from 'react'
import { extractCVData } from '../../helpers/ai'
import { Employee, JobType, Skill } from '../../types'
import Button from '../ui/Button'
import Card from '../ui/Card'
import DatePicker from '../ui/DatePicker'
import Input from '../ui/Input'

interface Props {
  employee: Employee
  onSave: (updatedEmployee: Employee) => void
  onBack: () => void
}

const ProfilePage: React.FC<Props> = ({ employee, onSave, onBack }) => {
  const [isExtracting, setIsExtracting] = useState(false)
  const [activeTab, setActiveTab] = useState<'info' | 'exp' | 'skills'>('info')
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false)
  const [newSkill, setNewSkill] = useState<Skill>({ name: '', level: 3 })

  // Added missing organizationId to satisfy Omit<Employee, ...> type requirements
  const [formData, setFormData] = useState<
    Omit<Employee, 'id' | 'status' | 'onboarded' | 'exercises' | 'plan'>
  >({
    organizationId: employee.organizationId,
    name: employee.name,
    email: employee.email,
    currentRole: employee.currentRole || '',
    targetRole: employee.targetRole || '',
    skills: employee.skills || [],
    summary: employee.summary || '',
    experiences: employee.experiences || [],
    educations: employee.educations || [],
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
          currentRole: extracted.currentRole || prev.currentRole,
          targetRole: extracted.suggestedTargetRole || prev.targetRole,
          skills: extracted.skills || prev.skills,
          summary: extracted.summary || prev.summary,
          experiences: extracted.experiences || prev.experiences,
          educations: extracted.educations || prev.educations,
        }))
      }
      setIsExtracting(false)
    }
    reader.readAsDataURL(file)
  }

  const updateSkillLevel = (name: string, level: number) => {
    setFormData({
      ...formData,
      skills: formData.skills.map((s) => (s.name === name ? { ...s, level } : s)),
    })
  }

  const handleAddSkillSubmit = () => {
    if (newSkill.name.trim() === '') return
    if (formData.skills.find((s) => s.name.toLowerCase() === newSkill.name.toLowerCase())) {
      alert('Cette compétence existe déjà.')
      return
    }
    setFormData({ ...formData, skills: [...formData.skills, newSkill] })
    setNewSkill({ name: '', level: 3 })
    setIsSkillModalOpen(false)
  }

  const removeSkill = (name: string) => {
    setFormData({ ...formData, skills: formData.skills.filter((s) => s.name !== name) })
  }

  const addItem = (type: 'experiences' | 'educations') => {
    const newItem =
      type === 'experiences'
        ? {
            id: Date.now() + Math.floor(Math.random() * 1000),
            title: '',
            company: '',
            type: 'CDI' as JobType,
            startDate: '',
            endDate: '',
            isCurrent: false,
            description: '',
          }
        : {
            id: Date.now() + Math.floor(Math.random() * 1000),
            degree: '',
            school: '',
            startDate: '',
            endDate: '',
            isCurrent: false,
            description: '',
          }
    setFormData({ ...formData, [type]: [newItem, ...formData[type]] })
  }

  const updateItem = (
    type: 'experiences' | 'educations',
    id: string,
    field: string,
    value: any
  ) => {
    const updated = (formData[type] as any[]).map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    )
    setFormData({ ...formData, [type]: updated })
  }

  const removeItem = (type: 'experiences' | 'educations', id: string) => {
    setFormData({ ...formData, [type]: formData[type].filter((item: any) => item.id !== id) })
  }

  return (
    <div className="min-h-screen bg-brand-ivory pb-24 animate-fadeIn">
      {/* Header Sticky */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-brand-navy/5 px-4 py-4 md:py-6">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-4">
            <Button onClick={onBack} variant="ghost" size="sm" className="rounded-full p-2">
              <svg
                className="w-6 h-6 text-brand-navy/60"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </Button>
            <h1 className="text-xl md:text-2xl font-bold text-brand-navy tracking-tight">
              Mon Profil Carrière
            </h1>
          </div>
          <div className="flex space-x-3 w-full md:w-auto">
            <Button
              onClick={() => fileInputRef.current?.click()}
              size="sm"
              variant="dark"
              className="grow md:flex-none"
              isLoading={isExtracting}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
              }
            >
              <span>{isExtracting ? 'Analyse...' : 'Mettre à jour par CV'}</span>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
              />
            </Button>
            <Button
              onClick={() => onSave({ ...employee, ...formData })}
              size="sm"
              variant="primary"
              className="grow md:flex-none px-8"
            >
              Sauvegarder
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-8 max-w-6xl">
        {/* Navigation Tabs */}
        <div className="flex bg-white p-1.5 rounded-2xl border border-brand-navy/5 mb-8 overflow-x-auto no-scrollbar">
          <TabButton
            active={activeTab === 'info'}
            onClick={() => setActiveTab('info')}
            label="Infos Générales"
          />
          <TabButton
            active={activeTab === 'exp'}
            onClick={() => setActiveTab('exp')}
            label="Expériences & Études"
          />
          <TabButton
            active={activeTab === 'skills'}
            onClick={() => setActiveTab('skills')}
            label="Compétences"
          />
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 gap-8">
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 gap-8 animate-slideUp">
              <div className="space-y-6">
                <Card className="p-8">
                  <div className="w-20 h-20 bg-brand-sage/10 rounded-3xl flex items-center justify-center text-brand-sage font-bold text-2xl mx-auto mb-6">
                    {formData.name[0]}
                  </div>
                  <div className="space-y-4">
                    <Input
                      label="Nom complet"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    <Input
                      label="Poste actuel"
                      value={formData.currentRole}
                      onChange={(e) => setFormData({ ...formData, currentRole: e.target.value })}
                    />
                    <Input
                      label="Cible professionnelle"
                      value={formData.targetRole}
                      onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                    />
                  </div>
                </Card>
              </div>
              <div className="space-y-6">
                <Card className="p-8">
                  <h3 className="text-sm font-bold text-brand-navy/20 uppercase tracking-widest mb-4">
                    À propos de moi
                  </h3>
                  <textarea
                    className="w-full p-6 bg-brand-ivory/50 border border-brand-navy/5 rounded-3xl outline-none focus:ring-2 focus:ring-brand-sage focus:border-brand-sage font-medium text-brand-navy/70 text-sm h-64 resize-none transition-all focus:bg-white"
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    placeholder="Décrivez votre parcours, vos aspirations et ce qui vous anime..."
                  />
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'exp' && (
            <div className="space-y-12 animate-slideUp">
              <section className="space-y-6">
                <div className="flex justify-between items-center px-4">
                  <h3 className="text-2xl font-bold text-brand-navy">Parcours Pro</h3>
                  <Button
                    onClick={() => addItem('experiences')}
                    variant="outline"
                    size="sm"
                    className="p-3"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {formData.experiences.map((exp) => (
                    <Card key={exp.id} className="p-6 relative group">
                      <Button
                        onClick={() => removeItem('experiences', exp.id)}
                        variant="ghost"
                        size="sm"
                        className="absolute top-4 right-4 text-brand-navy/20 hover:text-rose-500"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </Button>
                      <div className="space-y-4">
                        <Input
                          label="Intitulé"
                          value={exp.title}
                          onChange={(e) =>
                            updateItem('experiences', exp.id, 'title', e.target.value)
                          }
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            label="Entreprise"
                            value={exp.company}
                            onChange={(e) =>
                              updateItem('experiences', exp.id, 'company', e.target.value)
                            }
                          />
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-brand-navy/40 uppercase tracking-widest px-2">
                              Type de poste
                            </label>
                            <select
                              className="w-full p-4 bg-white border border-brand-navy/10 rounded-2xl outline-none focus:ring-2 focus:ring-brand-sage focus:border-brand-sage font-bold transition-all text-sm h-[54px]"
                              value={exp.type || 'CDI'}
                              onChange={(e) =>
                                updateItem('experiences', exp.id, 'type', e.target.value)
                              }
                            >
                              <option value="CDI">CDI</option>
                              <option value="CDD">CDD</option>
                              <option value="Alternance">Alternance</option>
                              <option value="Freelance">Freelance</option>
                              <option value="Stage">Stage</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <DatePicker
                            label="Début"
                            type="month"
                            value={exp.startDate}
                            onChange={(val) => updateItem('experiences', exp.id, 'startDate', val)}
                          />
                          {!exp.isCurrent && (
                            <DatePicker
                              label="Fin"
                              type="month"
                              value={exp.endDate}
                              onChange={(val) => updateItem('experiences', exp.id, 'endDate', val)}
                            />
                          )}
                        </div>

                        <div className="flex items-center px-2">
                          <input
                            type="checkbox"
                            id={`current-${exp.id}`}
                            checked={exp.isCurrent}
                            onChange={(e) =>
                              updateItem('experiences', exp.id, 'isCurrent', e.target.checked)
                            }
                            className="w-4 h-4 rounded border-brand-navy/20 text-brand-sage focus:ring-brand-sage"
                          />
                          <label
                            htmlFor={`current-${exp.id}`}
                            className="ml-2 text-xs font-bold text-brand-navy/60 cursor-pointer"
                          >
                            Poste actuel
                          </label>
                        </div>

                        <textarea
                          className="w-full p-4 bg-brand-ivory/50 border border-brand-navy/5 rounded-2xl text-xs text-brand-navy/60 h-24 resize-none"
                          placeholder="Description des missions..."
                          value={exp.description}
                          onChange={(e) =>
                            updateItem('experiences', exp.id, 'description', e.target.value)
                          }
                        />
                      </div>
                    </Card>
                  ))}
                </div>
              </section>

              <section className="space-y-6">
                <div className="flex justify-between items-center px-4">
                  <h3 className="text-2xl font-bold text-brand-navy">Éducation</h3>
                  <Button
                    onClick={() => addItem('educations')}
                    variant="outline"
                    size="sm"
                    className="p-3"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {formData.educations.map((edu) => (
                    <Card key={edu.id} className="p-6 relative group">
                      <Button
                        onClick={() => removeItem('educations', edu.id)}
                        variant="ghost"
                        size="sm"
                        className="absolute top-4 right-4 text-brand-navy/20 hover:text-rose-500"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </Button>
                      <div className="space-y-4">
                        <Input
                          label="Diplôme"
                          value={edu.degree}
                          onChange={(e) =>
                            updateItem('educations', edu.id, 'degree', e.target.value)
                          }
                        />
                        <Input
                          label="École"
                          value={edu.school}
                          onChange={(e) =>
                            updateItem('educations', edu.id, 'school', e.target.value)
                          }
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <DatePicker
                            label="Début"
                            type="month"
                            value={edu.startDate}
                            onChange={(val) => updateItem('educations', edu.id, 'startDate', val)}
                          />
                          {!edu.isCurrent && (
                            <DatePicker
                              label="Fin"
                              type="month"
                              value={edu.endDate}
                              onChange={(val) => updateItem('educations', edu.id, 'endDate', val)}
                            />
                          )}
                        </div>

                        <div className="flex items-center px-2">
                          <input
                            type="checkbox"
                            id={`current-edu-${edu.id}`}
                            checked={edu.isCurrent}
                            onChange={(e) =>
                              updateItem('educations', edu.id, 'isCurrent', e.target.checked)
                            }
                            className="w-4 h-4 rounded border-brand-navy/20 text-brand-sage focus:ring-brand-sage"
                          />
                          <label
                            htmlFor={`current-edu-${edu.id}`}
                            className="ml-2 text-xs font-bold text-brand-navy/60 cursor-pointer"
                          >
                            Formation en cours
                          </label>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'skills' && (
            <Card className="p-8 animate-slideUp">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-xl font-bold text-brand-navy">Compétences & Maîtrise</h3>
                <Button onClick={() => setIsSkillModalOpen(true)} size="sm" variant="primary">
                  + Ajouter une compétence
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {formData.skills.map((skill) => (
                  <Card key={skill.name} className="p-6 bg-brand-ivory/50 group relative">
                    <Button
                      onClick={() => removeSkill(skill.name)}
                      variant="ghost"
                      size="sm"
                      className="absolute top-4 right-4 text-brand-navy/20 hover:text-rose-500 opacity-0 group-hover:opacity-100"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </Button>
                    <div className="mb-4">
                      <div className="text-sm font-bold text-brand-navy mb-1">{skill.name}</div>
                      <div className="text-[10px] font-bold text-brand-sage uppercase tracking-widest">
                        {skill.level === 1 && 'Débutant'}
                        {skill.level === 2 && 'Intermédiaire'}
                        {skill.level === 3 && 'Confirmé'}
                        {skill.level === 4 && 'Avancé'}
                        {skill.level === 5 && 'Expert'}
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <button
                          key={lvl}
                          onClick={() => updateSkillLevel(skill.name, lvl)}
                          className={`h-2 grow rounded-full transition-all cursor-pointer disabled:cursor-not-allowed ${lvl <= skill.level ? 'bg-brand-sage' : 'bg-brand-navy/10'}`}
                        />
                      ))}
                    </div>
                  </Card>
                ))}
                {formData.skills.length === 0 && (
                  <div className="col-span-full py-20 text-center text-brand-navy/20 border-2 border-dashed border-brand-navy/5 rounded-[40px]">
                    Identifiez vos forces professionnelles
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Modale d'ajout de compétence */}
      {isSkillModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-brand-navy/60 backdrop-blur-sm animate-fadeIn">
          <Card className="w-full max-w-lg p-10 animate-slideUp relative">
            <Button
              onClick={() => setIsSkillModalOpen(false)}
              variant="ghost"
              size="sm"
              className="absolute top-8 right-8 text-brand-navy/20 hover:text-brand-navy/60"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </Button>

            <h2 className="text-2xl font-bold text-brand-navy mb-8 tracking-tight">
              Ajouter une Compétence
            </h2>

            <div className="space-y-8">
              <Input
                autoFocus
                label="Nom de la compétence"
                placeholder="Ex: Analyse Financière, Design UI, Python..."
                value={newSkill.name}
                onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
              />

              <div className="space-y-4">
                <label className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest px-2">
                  Niveau de maîtrise
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setNewSkill({ ...newSkill, level: lvl })}
                      className={`h-12 rounded-xl flex items-center justify-center font-bold text-sm transition-all cursor-pointer disabled:cursor-not-allowed ${newSkill.level === lvl ? 'bg-brand-sage text-white shadow-lg shadow-brand-sage/20' : 'bg-brand-ivory text-brand-navy/40 hover:bg-brand-sage/10'}`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
                <div className="text-center">
                  <span className="text-[10px] font-bold text-brand-sage uppercase tracking-[0.2em]">
                    {newSkill.level === 1 && 'Niveau Débutant'}
                    {newSkill.level === 2 && 'Niveau Intermédiaire'}
                    {newSkill.level === 3 && 'Niveau Confirmé'}
                    {newSkill.level === 4 && 'Niveau Avancé'}
                    {newSkill.level === 5 && 'Niveau Expert'}
                  </span>
                </div>
              </div>

              <Button
                onClick={handleAddSkillSubmit}
                disabled={!newSkill.name.trim()}
                className="w-full"
                size="lg"
                variant="dark"
              >
                Ajouter au profil
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

const TabButton = ({ active, onClick, label }: any) => (
  <button
    onClick={onClick}
    className={`flex-shrink-0 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer disabled:cursor-not-allowed ${active ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
  >
    {label}
  </button>
)

export default ProfilePage
