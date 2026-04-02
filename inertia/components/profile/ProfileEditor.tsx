import React, { useRef, useState } from 'react'
import { extractCVData } from '../../helpers/ai'
import { Employee, JobType } from '../../types'
import DatePicker from '../ui/DatePicker'

interface Props {
  employee: Employee
  onSave: (updatedEmployee: Employee) => void
  onClose: () => void
}

const ProfileEditor: React.FC<Props> = ({ employee, onSave, onClose }) => {
  const [isExtracting, setIsExtracting] = useState(false)

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

  const addItem = (type: 'experiences' | 'educations') => {
    const newItem =
      type === 'experiences'
        ? {
            id: Math.random().toString(36).substr(2, 9),
            title: '',
            company: '',
            type: 'CDI' as JobType,
            startDate: '',
            endDate: '',
            isCurrent: false,
            description: '',
          }
        : {
            id: Math.random().toString(36).substr(2, 9),
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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-5xl rounded-[48px] shadow-2xl p-10 relative animate-slideUp max-h-[95vh] overflow-y-auto custom-scrollbar">
        <button
          onClick={onClose}
          className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 transition-colors z-10 cursor-pointer disabled:cursor-not-allowed"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Mon Profil Complet
            </h2>
            <p className="text-slate-500 mt-1">
              Gérez vos informations, vos expériences et vos formations.
            </p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`flex items-center space-x-2 px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all cursor-pointer disabled:cursor-not-allowed ${isExtracting ? 'bg-indigo-50 text-indigo-400' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-200'}`}
          >
            {isExtracting ? (
              <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
            )}
            <span>{isExtracting ? 'IA en cours...' : 'Mettre à jour via CV'}</span>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
            />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4 space-y-8">
            <section className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                Informations de base
              </h3>
              <div className="space-y-4">
                <InputGroup
                  label="Nom complet"
                  value={formData.name}
                  onChange={(v: string) => setFormData({ ...formData, name: v })}
                />
                <InputGroup label="Email" value={formData.email} readOnly />
                <InputGroup
                  label="Poste actuel"
                  value={formData.currentRole}
                  onChange={(v: string) => setFormData({ ...formData, currentRole: v })}
                />
                <InputGroup
                  label="Cible professionnelle"
                  value={formData.targetRole}
                  onChange={(v: string) => setFormData({ ...formData, targetRole: v })}
                />
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                Résumé & Bio
              </h3>
              <textarea
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-600 text-sm h-40 resize-none transition-all focus:bg-white"
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                placeholder="Décrivez votre parcours en quelques lignes..."
              />
            </section>

            <section className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Compétences
                </h3>
                <button
                  onClick={() => {
                    const s = prompt('Nouvelle compétence :')
                    if (s)
                      setFormData({
                        ...formData,
                        skills: [...formData.skills, { name: s, level: 3 }],
                      })
                  }}
                  className="text-indigo-600 font-black text-lg cursor-pointer disabled:cursor-not-allowed"
                >
                  +
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((s, i) => (
                  <span
                    key={i}
                    className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-indigo-100 flex items-center group"
                  >
                    {s.name}
                    <button
                      onClick={() =>
                        setFormData({
                          ...formData,
                          skills: formData.skills.filter((_, idx) => idx !== i),
                        })
                      }
                      className="ml-2 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all cursor-pointer disabled:cursor-not-allowed"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </section>
          </div>

          <div className="lg:col-span-8 space-y-10">
            <section className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Expériences Professionnelles
                </h3>
                <button
                  onClick={() => addItem('experiences')}
                  className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  + Ajouter
                </button>
              </div>
              <div className="space-y-4">
                {formData.experiences.map((exp) => (
                  <div
                    key={exp.id}
                    className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 relative group animate-fadeIn"
                  >
                    <button
                      onClick={() => removeItem('experiences', exp.id)}
                      className="absolute top-6 right-6 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer disabled:cursor-not-allowed"
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
                    </button>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <InputGroup
                        label="Poste"
                        value={exp.title}
                        onChange={(v: string) => updateItem('experiences', exp.id, 'title', v)}
                      />
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">
                          Type de poste
                        </label>
                        <select
                          className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold transition-all text-sm h-[54px]"
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
                      <InputGroup
                        label="Entreprise"
                        value={exp.company}
                        onChange={(v: string) => updateItem('experiences', exp.id, 'company', v)}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <InputGroup
                          label="Début"
                          type="month"
                          value={exp.startDate}
                          onChange={(v: string) =>
                            updateItem('experiences', exp.id, 'startDate', v)
                          }
                        />
                        {!exp.isCurrent && (
                          <InputGroup
                            label="Fin"
                            type="month"
                            value={exp.endDate}
                            onChange={(v: string) =>
                              updateItem('experiences', exp.id, 'endDate', v)
                            }
                          />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center px-2 mb-4">
                      <input
                        type="checkbox"
                        id={`current-edtr-${exp.id}`}
                        checked={exp.isCurrent}
                        onChange={(e) =>
                          updateItem('experiences', exp.id, 'isCurrent', e.target.checked)
                        }
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <label
                        htmlFor={`current-edtr-${exp.id}`}
                        className="ml-2 text-xs font-bold text-slate-600 cursor-pointer"
                      >
                        Poste actuel
                      </label>
                    </div>
                    <textarea
                      placeholder="Description des missions..."
                      className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-600 h-24 resize-none"
                      value={exp.description}
                      onChange={(e) =>
                        updateItem('experiences', exp.id, 'description', e.target.value)
                      }
                    />
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Formations & Diplômes
                </h3>
                <button
                  onClick={() => addItem('educations')}
                  className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  + Ajouter
                </button>
              </div>
              <div className="space-y-4">
                {formData.educations.map((edu) => (
                  <div
                    key={edu.id}
                    className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 relative group animate-fadeIn"
                  >
                    <button
                      onClick={() => removeItem('educations', edu.id)}
                      className="absolute top-6 right-6 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer disabled:cursor-not-allowed"
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
                    </button>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <InputGroup
                        label="Diplôme"
                        value={edu.degree}
                        onChange={(v: string) => updateItem('educations', edu.id, 'degree', v)}
                      />
                      <InputGroup
                        label="Établissement"
                        value={edu.school}
                        onChange={(v: string) => updateItem('educations', edu.id, 'school', v)}
                      />
                      <InputGroup
                        label="Début"
                        type="month"
                        value={edu.startDate}
                        onChange={(v: string) => updateItem('educations', edu.id, 'startDate', v)}
                      />
                      {!edu.isCurrent && (
                        <InputGroup
                          label="Fin"
                          type="month"
                          value={edu.endDate}
                          onChange={(v: string) => updateItem('educations', edu.id, 'endDate', v)}
                        />
                      )}
                    </div>
                    <div className="flex items-center px-2">
                      <input
                        type="checkbox"
                        id={`current-edu-edtr-${edu.id}`}
                        checked={edu.isCurrent}
                        onChange={(e) =>
                          updateItem('educations', edu.id, 'isCurrent', e.target.checked)
                        }
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <label
                        htmlFor={`current-edu-edtr-${edu.id}`}
                        className="ml-2 text-xs font-bold text-slate-600 cursor-pointer"
                      >
                        Formation en cours
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        <div className="mt-12 flex flex-col md:flex-row gap-4 border-t border-slate-100 pt-10">
          <button
            onClick={() => onSave({ ...employee, ...formData })}
            className="grow bg-indigo-600 text-white py-5 rounded-[24px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-2xl shadow-indigo-100 transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
          >
            Mettre à jour mon profil
          </button>
          <button
            onClick={onClose}
            className="px-12 py-5 text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:text-slate-600 cursor-pointer disabled:cursor-not-allowed"
          >
            Quitter sans sauvegarder
          </button>
        </div>
      </div>
    </div>
  )
}

const InputGroup = ({ label, value, onChange, readOnly = false, type = 'text' }: any) => {
  const isMonth = type === 'month'

  return (
    <div className="space-y-1">
      {isMonth && !readOnly ? (
        <DatePicker
          label={label}
          value={value}
          onChange={onChange}
          type="month"
          placeholder="MM/AAAA"
        />
      ) : (
        <>
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">
            {label}
          </label>
          <input
            type={type}
            readOnly={readOnly}
            placeholder="..."
            className={`w-full p-4 border rounded-2xl outline-none font-bold transition-all text-sm ${readOnly ? 'bg-slate-100 text-slate-400 border-transparent' : 'bg-white border-slate-200 focus:ring-2 focus:ring-indigo-500'}`}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
          />
        </>
      )}
    </div>
  )
}

export default ProfileEditor
