import React, { useEffect, useRef, useState } from 'react'
import { extractSkillMappingFromText } from '../../services/ai_service'
import { ExerciseDraft, Experience } from '../../types'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Card from '../ui/Card'

interface SkillRow {
  id: string
  mission: string
  activity: string
  proof: string
}

interface Props {
  onSave: (
    data: { mapping: SkillRow[]; experienceId: string; jobTitle: string },
    duration: number
  ) => void
  onSaveDraft: (data: any) => void
  initialDraftPromise?: Promise<ExerciseDraft | null>
  experiences: Experience[]
}

const SkillMappingTool: React.FC<Props> = ({
  onSave,
  onSaveDraft,
  initialDraftPromise,
  experiences,
}) => {
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedExpId, setSelectedExpId] = useState<string>('')
  const [rows, setRows] = useState<SkillRow[]>([])
  const [narrative, setNarrative] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const startTimeRef = useRef<number>(Date.now())

  const selectedExp = experiences.find((e) => e.id === selectedExpId)

  useEffect(() => {
    if (initialDraftPromise) {
      initialDraftPromise.then((draft) => {
        if (draft && draft.data) {
          setRows(draft.data.rows || [])
          setSelectedExpId(draft.data.selectedExpId || '')
          setStep(draft.data.step || 1)
          setNarrative(draft.data.narrative || '')
        }
      })
    }
  }, [])

  useEffect(() => {
    onSaveDraft({ rows, selectedExpId, step, narrative })
  }, [rows, selectedExpId, step, narrative, onSaveDraft])

  const handleProcessNarrative = async () => {
    if (!narrative.trim()) return
    setIsProcessing(true)
    try {
      const result = await extractSkillMappingFromText(narrative)
      setRows(
        result.mapping.map((m: any) => ({
          ...m,
          id: Math.random().toString(36).substr(2, 9),
        }))
      )
      setStep(2)
    } catch (err) {
      console.error(err)
    } finally {
      setIsProcessing(false)
    }
  }

  const addRow = () => {
    setRows([
      ...rows,
      { id: Math.random().toString(36).substr(2, 9), mission: '', activity: '', proof: '' },
    ])
  }

  const removeRow = (id: string) => {
    setRows(rows.filter((r) => r.id !== id))
  }

  const updateRow = (id: string, field: keyof SkillRow, value: string) => {
    setRows(rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
  }

  const handleSave = () => {
    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000)
    onSave(
      {
        mapping: rows,
        experienceId: selectedExpId,
        jobTitle: selectedExp?.title || 'Analyse de récit',
      },
      duration
    )
  }

  if (step === 1) {
    return (
      <div className="max-w-4xl mx-auto space-y-12 animate-fadeIn py-10">
        <div className="text-center space-y-4">
          <Badge variant="violet">Analyse d'Expérience</Badge>
          <h2 className="text-5xl font-black text-slate-900 tracking-tight italic">
            Racontez votre parcours
          </h2>
          <p className="text-slate-500 text-lg font-medium max-w-2xl mx-auto">
            Décrivez vos missions de manière libre. L'IA va simplement structurer vos propos pour en
            extraire une cartographie professionnelle.
          </p>
        </div>

        <div className="space-y-8">
          <Card className="p-8">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 px-2">
              1. Sélectionnez l'expérience concernée (Optionnel)
            </h3>
            <div className="flex flex-wrap gap-3">
              {experiences.map((exp) => (
                <button
                  key={exp.id}
                  onClick={() => setSelectedExpId(exp.id === selectedExpId ? '' : exp.id)}
                  className={`px-6 py-3 rounded-2xl border-2 transition-all text-xs font-bold cursor-pointer disabled:cursor-not-allowed ${selectedExpId === exp.id ? 'border-violet-600 bg-violet-50 text-violet-700' : 'border-slate-50 bg-slate-50 text-slate-500 hover:border-slate-200'}`}
                >
                  {exp.title} @ {exp.company}
                </button>
              ))}
            </div>
          </Card>

          <Card variant="dark" className="p-10 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black flex items-center">
                <span className="w-8 h-8 bg-white/10 text-white rounded-lg flex items-center justify-center mr-3 text-sm italic">
                  ✍️
                </span>
                Votre récit
              </h3>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                L'IA va structurer ce texte
              </span>
            </div>
            <textarea
              className="w-full bg-white/5 border border-white/10 rounded-3xl p-8 text-lg grow min-h-[300px] outline-none focus:ring-2 focus:ring-violet-500 transition-all resize-none font-medium placeholder:text-slate-600"
              placeholder="Ex: Dans mon dernier poste, j'étais responsable de... J'ai notamment géré le projet X avec l'outil Y, ce qui a permis de réduire les coûts de 15%..."
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
            />
            <div className="flex justify-end">
              <Button
                size="lg"
                className="bg-violet-600 border-none px-12"
                disabled={!narrative.trim() || narrative.length < 20}
                isLoading={isProcessing}
                onClick={handleProcessNarrative}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                }
              >
                Restructurer mon récit
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-fadeIn pb-20">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <Badge variant="lime">Validation des Acquis</Badge>
          <h2 className="text-4xl font-black text-slate-900 mt-2 tracking-tight italic">
            {selectedExp ? `${selectedExp.title}` : 'Analyse de votre récit'}
          </h2>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">
            Vérifiez et ajustez la structure extraite de vos propos.
          </p>
        </div>
        <div className="flex gap-4">
          <Button
            onClick={addRow}
            variant="outline"
            size="sm"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            }
          >
            Ajouter une ligne
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest w-[20%]">
                  Mission
                </th>
                <th className="p-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest w-[25%]">
                  Activité associée
                </th>
                <th className="p-8 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest w-[45%]">
                  Réalisations / Preuves identifiées
                </th>
                <th className="p-8 w-[10%]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map((row) => (
                <tr key={row.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="p-6 align-top">
                    <textarea
                      className="w-full bg-transparent border-none outline-none text-sm font-black text-slate-900 resize-none h-20"
                      value={row.mission}
                      onChange={(e) => updateRow(row.id, 'mission', e.target.value)}
                      placeholder="Mission..."
                    />
                  </td>
                  <td className="p-6 align-top border-l border-slate-50">
                    <textarea
                      className="w-full bg-transparent border-none outline-none text-sm font-bold text-slate-500 resize-none h-20"
                      value={row.activity}
                      onChange={(e) => updateRow(row.id, 'activity', e.target.value)}
                      placeholder="Activité..."
                    />
                  </td>
                  <td className="p-6 align-top border-l border-slate-50">
                    <textarea
                      placeholder="Preuve ou résultat..."
                      className="w-full bg-white border-2 border-slate-100 rounded-3xl p-5 text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-violet-500 min-h-[100px] resize-none transition-all shadow-inner"
                      value={row.proof}
                      onChange={(e) => updateRow(row.id, 'proof', e.target.value)}
                    />
                  </td>
                  <td className="p-6 align-middle text-right">
                    <button
                      onClick={() => removeRow(row.id)}
                      className="p-3 text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer disabled:cursor-not-allowed"
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-12 flex flex-col md:flex-row justify-between items-center gap-6 border-t border-slate-100 pt-10">
        <Button
          onClick={() => setStep(1)}
          variant="ghost"
          size="sm"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          }
        >
          Modifier mon récit
        </Button>
        <div className="flex gap-4 w-full md:w-auto">
          <Button
            onClick={handleSave}
            size="lg"
            className="px-16 w-full md:w-auto shadow-2xl shadow-indigo-100"
          >
            Valider & Transmettre
          </Button>
        </div>
      </div>
    </div>
  )
}

export default SkillMappingTool
