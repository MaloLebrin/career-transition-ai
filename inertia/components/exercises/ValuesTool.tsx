import React, { useEffect, useRef, useState } from 'react'
import { SCHWARTZ_VALUES } from '../../constants/values'
import { ExerciseDraft } from '../../types'
import Button from '../ui/Button'
import Card from '../ui/Card'
import Input from '../ui/Input'

interface Props {
  onSave: (
    data: { selectedValues: string[]; peopleExercise: { name: string; values: string }[] },
    duration: number
  ) => void
  onSaveDraft: (data: any) => void
  initialDraftPromise?: Promise<ExerciseDraft | null>
}

function valueByLabel(label: string) {
  return SCHWARTZ_VALUES.find((v) => v.label === label)
}

const ValuesTool: React.FC<Props> = ({ onSave, onSaveDraft, initialDraftPromise }) => {
  const [step, setStep] = useState<1 | 2>(1)
  const [rankedValues, setRankedValues] = useState<string[]>([])
  const [people, setPeople] = useState([
    { name: '', values: '' },
    { name: '', values: '' },
    { name: '', values: '' },
  ])
  const startTimeRef = useRef<number>(Date.now())
  const dragFromIndexRef = useRef<number | null>(null)
  const onSaveDraftRef = useRef(onSaveDraft)
  const didInitFromDraftRef = useRef(false)

  useEffect(() => {
    if (didInitFromDraftRef.current) return
    didInitFromDraftRef.current = true
    let cancelled = false

    initialDraftPromise?.then((draft) => {
      if (cancelled) return
      if (draft && (draft as any).data) {
        const data = (draft as any).data
        setRankedValues(data.selectedValues || [])
        setPeople(
          data.peopleExercise || [
            { name: '', values: '' },
            { name: '', values: '' },
            { name: '', values: '' },
          ]
        )
        setStep(data.step || 1)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    onSaveDraftRef.current = onSaveDraft
  }, [onSaveDraft])

  useEffect(() => {
    onSaveDraftRef.current({ selectedValues: rankedValues, peopleExercise: people, step })
  }, [rankedValues, people, step])

  const unrankedValues = SCHWARTZ_VALUES.filter((v) => !rankedValues.includes(v.label))

  const handleRankValue = (label: string) => {
    setRankedValues([...rankedValues, label])
  }

  const handleRemoveValue = (label: string) => {
    setRankedValues(rankedValues.filter((v) => v !== label))
  }

  const moveRankedValue = (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx) return
    if (fromIdx < 0 || toIdx < 0) return
    if (fromIdx >= rankedValues.length || toIdx >= rankedValues.length) return
    const next = [...rankedValues]
    const [moved] = next.splice(fromIdx, 1)
    next.splice(toIdx, 0, moved)
    setRankedValues(next)
  }

  const updatePerson = (idx: number, field: 'name' | 'values', val: string) => {
    const next = [...people]
    next[idx][field] = val
    setPeople(next)
  }

  const handleSave = () => {
    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000)
    onSave({ selectedValues: rankedValues, peopleExercise: people }, duration)
  }

  return (
    <Card className="max-w-5xl mx-auto animate-fadeIn border-brand-navy/5">
      {step === 1 ? (
        <div className="space-y-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h3 className="text-3xl font-bold text-ink mb-4 tracking-tight">
              Classement des valeurs
            </h3>
            <p className="text-muted leading-relaxed">
              Classez les 10 valeurs par ordre d’importance pour vous. Lisez le portrait et la
              situation de travail de chaque carte — pas seulement le nom — avant de cliquer.
              <span className="block mt-2 font-semibold text-accent">
                Cliquez sur les valeurs dans votre ordre de priorité.
              </span>
              <span className="block mt-1 text-sm text-muted-soft">Chronométrage actif</span>
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-muted px-2">
                Valeurs à classer ({unrankedValues.length})
              </h4>
              <div className="grid grid-cols-1 gap-3">
                {unrankedValues.map((val) => (
                  <button
                    key={val.id}
                    type="button"
                    onClick={() => handleRankValue(val.label)}
                    className="p-4 text-left rounded-2xl border border-hairline bg-surface hover:bg-surface-soft hover:border-accent hover:shadow-card transition-all group cursor-pointer disabled:cursor-not-allowed"
                  >
                    <div className="font-bold text-ink group-hover:text-accent">{val.label}</div>
                    <p className="text-sm text-muted mt-1">{val.desc}</p>
                    <p className="text-sm text-ink mt-3">{val.portrait}</p>
                    <p className="text-sm text-muted mt-2 border-t border-hairline pt-2">
                      <span className="font-semibold text-ink">En situation : </span>
                      <span>{val.situation}</span>
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-surface-soft p-8 rounded-2xl border-2 border-dashed border-hairline-strong min-h-[500px]">
              <h4 className="text-sm font-semibold text-accent mb-6">
                Votre hiérarchie ({rankedValues.length}/10)
              </h4>
              <div
                className="space-y-3"
                onDragOver={(e) => {
                  e.preventDefault()
                }}
                onDropCapture={(e) => {
                  e.preventDefault()
                  const target = (e.target as HTMLElement | null)?.closest?.('[data-ranked-idx]') as
                    | HTMLElement
                    | null
                  const toIdx = target ? Number(target.dataset.rankedIdx) : NaN
                  const fromIdx = dragFromIndexRef.current
                  if (typeof fromIdx === 'number' && Number.isFinite(toIdx)) {
                    moveRankedValue(fromIdx, toIdx)
                  }
                  dragFromIndexRef.current = null
                }}
              >
                {rankedValues.map((label, idx) => {
                  const value = valueByLabel(label)
                  return (
                    <div
                      key={label}
                      data-testid={`ranked-value-${label}`}
                      data-ranked-idx={idx}
                      draggable
                      onDragStart={(e) => {
                        dragFromIndexRef.current = idx
                        try {
                          e.dataTransfer?.setData('text/plain', label)
                          e.dataTransfer.effectAllowed = 'move'
                        } catch {}
                      }}
                      onDragEnd={() => {
                        dragFromIndexRef.current = null
                      }}
                      className="flex items-start bg-surface p-4 rounded-2xl shadow-card border border-hairline animate-slideUp"
                    >
                      <span
                        className="mr-3 mt-1 text-muted-soft select-none"
                        aria-hidden="true"
                        title="Glisser pour réordonner"
                      >
                        ⠿
                      </span>
                      <span className="w-8 h-8 shrink-0 rounded-lg bg-primary text-on-primary flex items-center justify-center font-bold text-xs mr-4">
                        {idx + 1}
                      </span>
                      <div className="grow min-w-0">
                        <span className="font-bold text-ink">{label}</span>
                        {value?.situation ? (
                          <p className="text-sm text-muted mt-1">{value.situation}</p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveValue(label)}
                        className="text-muted-soft hover:text-danger transition-colors cursor-pointer disabled:cursor-not-allowed shrink-0 ml-2"
                        aria-label={`Retirer ${label}`}
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
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  )
                })}
              </div>

              {rankedValues.length === 10 && (
                <Button
                  onClick={() => setStep(2)}
                  className="w-full mt-8 animate-bounce"
                  variant="primary"
                  size="lg"
                >
                  Suivant : Figures marquantes
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-fadeIn max-w-3xl mx-auto">
          <div className="mb-12 text-center">
            <h3 className="text-3xl font-bold text-brand-navy mb-4 tracking-tight">
              Les Figures d'Inspiration
            </h3>
            <p className="text-brand-navy/60">
              Identifiez 3 personnes (réelles ou fictives) qui incarnent vos valeurs.
            </p>
          </div>

          <div className="space-y-6">
            {people.map((p, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-[32px] border border-brand-navy/5 space-y-4"
              >
                <div className="flex items-center space-x-4">
                  <span className="w-10 h-10 rounded-2xl bg-brand-ivory border border-brand-navy/5 flex items-center justify-center font-bold text-brand-navy/40">
                    {i + 1}
                  </span>
                  <Input
                    placeholder="Nom de la personne"
                    value={p.name}
                    onChange={(e) => updatePerson(i, 'name', e.target.value)}
                  />
                </div>
                <textarea
                  placeholder="Quelles valeurs cette personne représente-t-elle pour vous ?"
                  className="w-full p-4 border border-brand-navy/10 rounded-2xl focus:ring-2 focus:ring-brand-sage focus:border-brand-sage outline-none text-brand-navy/70 bg-white h-24 resize-none transition-all"
                  value={p.values}
                  onChange={(e) => updatePerson(i, 'values', e.target.value)}
                />
              </div>
            ))}
          </div>

          <div className="mt-12 flex space-x-4">
            <Button onClick={() => setStep(1)} variant="ghost" size="md">
              Retour au classement
            </Button>
            <Button onClick={handleSave} className="grow" variant="primary" size="lg">
              Enregistrer mon profil de valeurs
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}

export default ValuesTool
