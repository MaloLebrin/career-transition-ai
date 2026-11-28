import type { DiscDraft, ExerciseToolProps } from '#shared/types/exercise/tool'
import React, { useCallback, useMemo, useState } from 'react'
import { useExerciseDraft } from '../../hooks/use_exercise_draft'
import { useExerciseTimer } from '../../hooks/use_exercise_timer'
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

type DiscToolDraft = DiscDraft<DiscSelection, DiscComputation>

type Props = ExerciseToolProps<Record<string, unknown>, DiscToolDraft> & {
  /** Résultat terminé : repris pour réafficher la synthèse quand il contient les sélections. */
  initialResultData?: Partial<DiscToolDraft> | null
}

function isSelections(value: unknown): value is Record<number, DiscSelection> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

const DISCTool: React.FC<Props> = ({
  onSave,
  onSaveDraft,
  initialDraftPromise,
  initialResultData,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selections, setSelections] = useState<Record<number, DiscSelection>>({})
  const [resultPreview, setResultPreview] = useState<DiscComputation | null>(null)
  const timer = useExerciseTimer()

  const blocksCount = DISC_BLOCKS.length

  const applyInitialData = (data: Partial<DiscToolDraft> | null | undefined) => {
    if (isSelections(data?.selections)) setSelections(data.selections)

    const idx = data?.currentIdx
    if (typeof idx === 'number' && Number.isFinite(idx) && idx >= 0) setCurrentIdx(idx)

    if (data?.resultPreview && typeof data.resultPreview === 'object') {
      setResultPreview(data.resultPreview)
    }
  }

  const draft = useExerciseDraft<DiscToolDraft>(
    { selections, currentIdx, resultPreview },
    onSaveDraft,
    {
      initialDraftPromise,
      // Sans brouillon exploitable : on retombe sur le résultat terminé (s'il contient les sélections).
      onHydrate: (data) =>
        applyInitialData(data && isSelections(data.selections) ? data : initialResultData),
    }
  )

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
    draft.cancel()

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
      timer.elapsedSeconds()
    )
  }, [onSave, resultPreview, selections, currentIdx, draft, timer])

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
                          timer.restart()
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
                <span className="text-violet-600 font-black">LE PLUS</span> et celle qui vous
                ressemble <span className="text-rose-500 font-black">LE MOINS</span>.
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
