import React, { useEffect, useRef, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ExerciseDraft } from '../../types'
import Button from '../ui/Button'
import Card from '../ui/Card'

interface Point {
  year: number
  satisfaction: number // 1 to 10
  label: string
}

interface Reflection {
  form: string
  mostlySatisfied: string
  amplitude: string
  explanation: string
  surprise: string
  coherence: string
}

interface Props {
  onSave: (data: { points: Point[]; reflection: Reflection }, duration: number) => void
  // Added missing draft props
  onSaveDraft: (data: any) => void
  initialDraftPromise?: Promise<ExerciseDraft | null>
}

const LifeCurveTool: React.FC<Props> = ({ onSave, onSaveDraft, initialDraftPromise }) => {
  const [draftHydrated, setDraftHydrated] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const [points, setPoints] = useState<Point[]>([])
  const [newPoint, setNewPoint] = useState<Point>({
    year: new Date().getFullYear(),
    satisfaction: 5,
    label: '',
  })
  const [reflection, setReflection] = useState<Reflection>({
    form: '',
    mostlySatisfied: '',
    amplitude: '',
    explanation: '',
    surprise: '',
    coherence: '',
  })
  const startTimeRef = useRef<number>(Date.now())
  const onSaveDraftRef = useRef(onSaveDraft)
  const lastAutoSavePayloadRef = useRef<string | null>(null)
  const draftAppliedRef = useRef(false)

  // Hydrate once. The page passes a new Promise on every render (autosave, Inertia
  // props). Re-applying that draft would wipe points the user just added.
  useEffect(() => {
    let cancelled = false
    if (draftAppliedRef.current) {
      setDraftHydrated(true)
      return () => {
        cancelled = true
      }
    }
    if (!initialDraftPromise) {
      draftAppliedRef.current = true
      setDraftHydrated(true)
      return () => {
        cancelled = true
      }
    }
    initialDraftPromise
      .then((draft) => {
        if (cancelled || draftAppliedRef.current) return
        draftAppliedRef.current = true
        if (draft && draft.data) {
          setPoints(draft.data.points || [])
          setReflection(
            draft.data.reflection || {
              form: '',
              mostlySatisfied: '',
              amplitude: '',
              explanation: '',
              surprise: '',
              coherence: '',
            }
          )
          setStep(draft.data.step || 1)
        }
      })
      .finally(() => {
        if (!cancelled) setDraftHydrated(true)
      })
    return () => {
      cancelled = true
    }
  }, [initialDraftPromise])

  // Auto-save draft (uniquement pendant l'étape 1)
  useEffect(() => {
    onSaveDraftRef.current = onSaveDraft
  }, [onSaveDraft])

  useEffect(() => {
    if (step !== 1 || !draftHydrated) return

    const payload = { points, reflection, step }
    const serialized = JSON.stringify(payload)
    if (serialized === lastAutoSavePayloadRef.current) return
    lastAutoSavePayloadRef.current = serialized

    onSaveDraftRef.current(payload)
  }, [points, reflection, step, draftHydrated])

  const handleAddPoint = () => {
    if (!newPoint.label) return
    const updated = [...points, newPoint].sort((a, b) => a.year - b.year)
    setPoints(updated)
    setNewPoint({ year: newPoint.year + 1, satisfaction: 5, label: '' })
  }

  const removePoint = (idx: number) => {
    setPoints(points.filter((_, i) => i !== idx))
  }

  const sortedData = [...points].sort((a, b) => a.year - b.year)

  const handleSave = () => {
    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000)
    onSave({ points: sortedData, reflection }, duration)
  }

  return (
    <Card className="p-10 w-full animate-fadeIn">
      {step === 1 ? (
        <div className="space-y-8">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">
              La courbe de vie
            </h3>
            <p className="text-slate-500 leading-relaxed">
              Tracez l'évolution de votre satisfaction professionnelle. Identifiez les sommets de
              réussite et les creux de remise en question.
              <span className="block mt-2 text-[10px] uppercase font-black text-slate-400">
                Suivi du temps actif
              </span>
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6 bg-slate-50 p-6 rounded-[32px] border border-slate-100 h-fit">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-4">
                Ajouter un point clé
              </h4>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 px-1">
                    Année
                  </label>
                  <input
                    type="number"
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                    value={newPoint.year}
                    onChange={(e) => setNewPoint({ ...newPoint, year: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 px-1">
                    Événement / Période
                  </label>
                  <input
                    placeholder="Ex: Premier poste chez..."
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                    value={newPoint.label}
                    onChange={(e) => setNewPoint({ ...newPoint, label: e.target.value })}
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1 px-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase">
                      Satisfaction
                    </label>
                    <span className="text-xs font-black text-indigo-600">
                      {newPoint.satisfaction}/10
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    className="w-full h-2 bg-white rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    value={newPoint.satisfaction}
                    onChange={(e) =>
                      setNewPoint({ ...newPoint, satisfaction: parseInt(e.target.value) })
                    }
                  />
                </div>
                <Button onClick={handleAddPoint} className="w-full" variant="emphasis" size="sm">
                  Ajouter au graphique
                </Button>
              </div>

              {points.length > 0 && (
                <div className="pt-6 border-t border-slate-200 space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                  {points.map((p, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 text-xs animate-slideUp"
                    >
                      <div className="truncate grow mr-2">
                        <span className="font-black text-indigo-600 mr-2">{p.year}</span>
                        <span className="font-bold text-slate-700">{p.label}</span>
                      </div>
                      <button
                        onClick={() => removePoint(i)}
                        className="text-slate-300 hover:text-red-500 cursor-pointer disabled:cursor-not-allowed"
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
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div
                data-testid="life-curve-chart"
                className="relative h-[450px] w-full min-w-0 bg-slate-50 rounded-[40px] border border-slate-100"
              >
                {points.length < 2 ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                    <svg
                      className="w-16 h-16 mx-auto mb-4 opacity-20"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                      />
                    </svg>
                    <p className="font-medium">
                      Ajoutez au moins 2 points pour visualiser votre courbe
                    </p>
                  </div>
                ) : (
                  <div className="absolute inset-0 p-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={sortedData}
                        margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis
                          dataKey="year"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }}
                        />
                        <YAxis
                          domain={[0, 10]}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: '16px',
                            border: 'none',
                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                            fontWeight: 900,
                          }}
                          itemStyle={{ color: '#6366f1' }}
                        />
                        <ReferenceLine y={5} stroke="#cbd5e1" strokeDasharray="5 5" />
                        <Line
                          type="monotone"
                          dataKey="satisfaction"
                          stroke="#6366f1"
                          strokeWidth={4}
                          dot={{ r: 6, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                          isAnimationActive={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {points.length >= 2 && (
                <Button onClick={() => setStep(2)} className="w-full" variant="primary" size="lg">
                  Suivant : Analyse de votre courbe
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-fadeIn max-w-3xl mx-auto space-y-12">
          <div className="text-center">
            <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">
              Exploitons vos réponses
            </h3>
            <p className="text-slate-500">
              Prenez un moment pour analyser le relief de votre parcours professionnel.
            </p>
          </div>

          <div className="space-y-8">
            <ReflectionQuestion
              label="Quelle est la forme de votre courbe de vie ?"
              value={reflection.form}
              onChange={(v) => setReflection({ ...reflection, form: v })}
            />
            <ReflectionQuestion
              label="Est-elle plus souvent satisfaisante qu'insatisfaisante ?"
              value={reflection.mostlySatisfied}
              onChange={(v) => setReflection({ ...reflection, mostlySatisfied: v })}
            />
            <ReflectionQuestion
              label="A-t-elle une grande amplitude ?"
              value={reflection.amplitude}
              onChange={(v) => setReflection({ ...reflection, amplitude: v })}
            />
            <ReflectionQuestion
              label="Pouvez-vous expliquer ce relief ?"
              value={reflection.explanation}
              onChange={(v) => setReflection({ ...reflection, explanation: v })}
            />
            <ReflectionQuestion
              label="Êtes-vous surpris par cette courbe ?"
              value={reflection.surprise}
              onChange={(v) => setReflection({ ...reflection, surprise: v })}
            />
            <ReflectionQuestion
              label="Est-elle cohérente avec votre parcours ?"
              value={reflection.coherence}
              onChange={(v) => setReflection({ ...reflection, coherence: v })}
            />
          </div>

          <div className="flex space-x-4 pt-8">
            <Button onClick={() => setStep(1)} variant="ghost" size="md">
              Retour
            </Button>
            <Button onClick={handleSave} className="grow" variant="primary" size="lg">
              Finaliser l'analyse
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}

const ReflectionQuestion: React.FC<{
  label: string
  value: string
  onChange: (v: string) => void
}> = ({ label, value, onChange }) => (
  <div className="space-y-2">
    <label className="text-sm font-black text-slate-700 px-1">{label}</label>
    <textarea
      className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-600 bg-slate-50 h-24 resize-none transition-all focus:bg-white"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
)

export default LifeCurveTool
