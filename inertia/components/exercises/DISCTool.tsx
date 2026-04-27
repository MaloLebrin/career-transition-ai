import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ExerciseDraft } from '../../types'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Card from '../ui/Card'
import { DISC_BLOCKS } from './disc/disc_questionnaire'
import DiscResultSummary from './disc/DiscResultSummary'
import {
  computeDiscFromSelections,
  type DiscComputation,
  type DiscSelection,
} from './disc/disc_scoring'

interface Props {
  onSave: (data: any, duration: number) => void
  onSaveDraft: (data: any) => void
  initialDraftPromise?: Promise<ExerciseDraft | null>
  initialResultData?: any
}

const DISCTool: React.FC<Props> = ({ onSave, onSaveDraft, initialDraftPromise, initialResultData }) => {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selections, setSelections] = useState<Record<number, DiscSelection>>({})
  const [resultPreview, setResultPreview] = useState<DiscComputation | null>(null)
  const startTimeRef = useRef<number>(Date.now())
  const hasInitializedRef = useRef(false)
  const onSaveDraftRef = useRef(onSaveDraft)

  const blocksCount = DISC_BLOCKS.length

  useEffect(() => {
    onSaveDraftRef.current = onSaveDraft
  }, [onSaveDraft])

  useEffect(() => {
    if (hasInitializedRef.current) return
    hasInitializedRef.current = true

    const applyInitialData = (data: any) => {
      const selectionsCandidate = data?.selections
      const currentIdxCandidate = data?.currentIdx
      const resultCandidate = data?.resultPreview

      if (
        selectionsCandidate &&
        typeof selectionsCandidate === 'object' &&
        !Array.isArray(selectionsCandidate)
      ) {
        setSelections(selectionsCandidate)
      }

      if (
        typeof currentIdxCandidate === 'number' &&
        Number.isFinite(currentIdxCandidate) &&
        currentIdxCandidate >= 0
      ) {
        setCurrentIdx(currentIdxCandidate)
      }

      if (resultCandidate && typeof resultCandidate === 'object') {
        setResultPreview(resultCandidate)
      }
    }

    if (initialDraftPromise) {
      initialDraftPromise.then((draft) => {
        const data = (draft as any)?.data
        const hasSelections = Boolean(data?.selections && typeof data.selections === 'object')

        if (hasSelections) {
          applyInitialData(data)
          return
        }

        // Fallback: completed legacy/new result data (if it contains selections)
        applyInitialData(initialResultData)
      })
      return
    }

    // No draft available: try completed result data
    applyInitialData(initialResultData)
  }, [initialDraftPromise, initialResultData])

  useEffect(() => {
    onSaveDraftRef.current({ selections, currentIdx, resultPreview })
  }, [selections, currentIdx, resultPreview])

  const handleSelect = (trait: DiscSelection['most'], type: 'most' | 'least') => {
    const currentSelection = selections[currentIdx] || { most: '', least: '' }
    if (type === 'most' && currentSelection.least === trait) return
    if (type === 'least' && currentSelection.most === trait) return
    setSelections({ ...selections, [currentIdx]: { ...currentSelection, [type]: trait } })
  }

  const isCurrentStepValid = selections[currentIdx]?.most && selections[currentIdx]?.least

  const next = () => {
    if (currentIdx < DISC_BLOCKS.length - 1) {
      setCurrentIdx(currentIdx + 1)
    } else {
      finalize()
    }
  }

  const finalize = useCallback(() => {
    const computed = computeDiscFromSelections(selections, blocksCount)
    setResultPreview(computed)
  }, [selections, blocksCount])

  const saveResults = useCallback(() => {
    if (!resultPreview) return
    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000)

    onSave(
      {
        // Backward-compatible keys (existing radar expects D/I/S/C)
        D: resultPreview.percent.D,
        I: resultPreview.percent.I,
        S: resultPreview.percent.S,
        C: resultPreview.percent.C,
        dominant: resultPreview.dominant,
        secondary: resultPreview.secondary,
        blocksCount: resultPreview.blocksCount,
        raw: resultPreview.raw,
        mostCount: resultPreview.mostCount,
        leastCount: resultPreview.leastCount,
        selections,
        currentIdx,
        version: resultPreview.version,
      },
      duration
    )
  }, [onSave, resultPreview, selections, currentIdx])

  const currentBlock = DISC_BLOCKS[currentIdx]

  const percent = useMemo(() => resultPreview?.percent ?? null, [resultPreview])

  return (
    <div className="mx-auto animate-fadeIn pb-20">
      <Card className="overflow-hidden p-0">
        <div className="h-3 bg-slate-100 w-full rounded-full">
          <div
            className="h-full bg-violet-600 transition-all duration-700 rounded-full"
            style={{
              width: `${((Math.min(currentIdx, DISC_BLOCKS.length - 1) + 1) / DISC_BLOCKS.length) * 100}%`,
            }}
          />
        </div>

        <div className="p-12 md:p-16">
          <div className="flex justify-between items-center mb-12">
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter italic">
              Diagnostic Comportemental
            </h3>
            <Badge variant="violet">
              {resultPreview ? 'Résultats' : `Étape ${currentIdx + 1} / ${DISC_BLOCKS.length}`}
            </Badge>
          </div>

          {resultPreview ? (
            percent && (
              <DiscResultSummary
                percent={percent}
                dominant={resultPreview.dominant}
                secondary={resultPreview.secondary}
                footer={
                  <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center border-t border-slate-100 pt-10">
                    <Button onClick={() => setResultPreview(null)} variant="ghost" size="sm">
                      ← Revoir mes réponses
                    </Button>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => {
                          setSelections({})
                          setCurrentIdx(0)
                          setResultPreview(null)
                          startTimeRef.current = Date.now()
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Recommencer
                      </Button>
                      <Button onClick={saveResults} size="lg">
                        Enregistrer mon profil
                      </Button>
                    </div>
                  </div>
                }
              />
            )
          ) : (
            <>
              <p className="text-slate-500 mb-10 font-medium">
                Choisissez la proposition qui vous ressemble{' '}
                <span className="text-violet-600 font-black">LE PLUS</span> et celle qui vous ressemble{' '}
                <span className="text-rose-500 font-black">LE MOINS</span>.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {currentBlock.choices.map((choice, i) => {
                  const isMost = selections[currentIdx]?.most === choice.trait
                  const isLeast = selections[currentIdx]?.least === choice.trait

                  return (
                    <div
                      key={i}
                      className={`p-8 rounded-[40px] border-2 transition-all flex flex-col justify-between min-h-56 ${isMost ? 'border-violet-600 bg-violet-50' : isLeast ? 'border-rose-500 bg-rose-50' : 'border-slate-100 bg-slate-50'}`}
                    >
                      <span className="text-lg font-black text-slate-900 leading-tight">
                        {choice.label}
                      </span>

                      <div className="flex gap-4 mt-6">
                        <Button
                          onClick={() => handleSelect(choice.trait, 'most')}
                          className="grow"
                          variant={isMost ? 'primary' : 'outline'}
                          size="md"
                        >
                          C'est moi
                        </Button>
                        <Button
                          onClick={() => handleSelect(choice.trait, 'least')}
                          className="grow"
                          variant={isLeast ? 'danger' : 'outline'}
                          size="md"
                        >
                          Pas du tout
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-16 flex justify-between items-center border-t border-slate-100 pt-10">
                <Button
                  onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
                  variant="ghost"
                  size="sm"
                >
                  ← Précédent
                </Button>
                <Button onClick={next} disabled={!isCurrentStepValid} size="lg">
                  {currentIdx === DISC_BLOCKS.length - 1 ? 'Voir mon profil' : 'Suivant'}
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}

export default DISCTool
