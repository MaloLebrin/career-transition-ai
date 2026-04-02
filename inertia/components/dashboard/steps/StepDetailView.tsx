import { formatDateTimeFR, formatSessionDate } from '#shared/helpers/date'
import { getExerciseTitle } from '#shared/helpers/exercises'
import React, { memo } from 'react'
import ExerciseResultVisualization from '~/components/exercises/ExerciseResultVisualization'
import AppLink from '~/components/ui/AppLink'
import Badge from '~/components/ui/Badge'
import Breadcrumb from '~/components/ui/Breadcrumb'
import ExerciseQualitativeAnalysisCard from './ExerciseQualitativeAnalysisCard'
import type { ExerciseResult, SupportPlanStep } from '~/types'

export interface StepDetailViewProps {
  breadcrumbItems: { label: string; href?: string }[]
  stepTitle: string
  step: SupportPlanStep
  results: ExerciseResult[]
  /** Optional small badge on header (e.g. dossier id) */
  headerMeta?: React.ReactNode
  /** Extra content to render under the header (e.g. dossier id line) */
  headerAfterTitle?: React.ReactNode
  /** Optional node rendered under the location/link value */
  locationOrLinkActions?: React.ReactNode
  /** Optional extra sidebar blocks appended at the end (inside the session card) */
  sidebarExtras?: React.ReactNode
  /** Optional node rendered after the session card (sidebar column) */
  afterSidebarCard?: React.ReactNode
  /** Optional content rendered below results column */
  belowResults?: React.ReactNode
  /**
   * When true (candidate view), render associated exercises as links to fill the exercise
   * (and disable them when the step is locked).
   */
  exerciseLinksEnabled?: boolean
}

const StepDetailView = memo(function StepDetailView({
  breadcrumbItems,
  stepTitle,
  step,
  results,
  headerMeta,
  headerAfterTitle,
  locationOrLinkActions,
  sidebarExtras,
  afterSidebarCard,
  belowResults,
  exerciseLinksEnabled = false,
}: StepDetailViewProps) {
  const renderResults = () => {
    if (!results || results.length === 0) {
      return (
        <div className="py-20 text-center text-slate-400">
          <p className="font-medium italic">Aucun résultat disponible pour cette étape.</p>
        </div>
      )
    }

    return (
      <div className="space-y-12">
        {results.map((result) => (
          <div key={result.id} className="space-y-6">
            <h4 className="text-lg font-bold text-slate-800">{getExerciseTitle(result.type)}</h4>
            <ExerciseResultVisualization result={result} />
            {result.qualitativeAnalysis && (
              <div className="lg:hidden">
                <ExerciseQualitativeAnalysisCard
                  markdown={result.qualitativeAnalysis}
                  exerciseTitle={results.length > 1 ? getExerciseTitle(result.type) : undefined}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="animate-fadeIn">
      <Breadcrumb items={breadcrumbItems} className="mb-6" />

      <div className="mb-12">
        <div className="flex items-center space-x-3 mb-4">
          <Badge variant={step.completed ? 'lime' : 'slate'}>
            {step.completed ? 'Étape Validée' : 'En attente'}
          </Badge>
          {headerMeta}
        </div>

        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none">
          {stepTitle}
        </h1>
        {headerAfterTitle}

        {step.scheduledAt && (
          <p className="text-brand-terracotta mt-2 text-lg font-medium">
            {formatDateTimeFR(step.scheduledAt)}
          </p>
        )}
        {step.instructions && (
          <p className="text-slate-500 mt-4 text-lg font-medium">{step.instructions}</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-12">
          <section className="space-y-6">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] px-2">
              {results.length > 1 ? 'Résultats des exercices' : 'Visualisation du Résultat'}
            </h3>
            {renderResults()}
          </section>
          {belowResults}
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="bg-slate-50 p-8 rounded-[48px] border border-slate-100 shadow-sm">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">
              Informations Session
            </h3>
            <div className="space-y-6">
              {step.scheduledAt && (
                <div>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Date du RDV
                  </div>
                  <div className="text-base font-black text-slate-900">
                    {formatSessionDate(step.scheduledAt)}
                  </div>
                </div>
              )}

              {step.locationOrLink && (
                <div>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Lieu / Lien
                  </div>
                  {locationOrLinkActions ? (
                    <div className="space-y-2">
                      <div className="text-base font-medium text-slate-900 wrap-break-word">
                        {step.locationOrLink}
                      </div>
                      {locationOrLinkActions}
                    </div>
                  ) : (
                    <div className="text-base font-medium text-slate-900 wrap-break-word">
                      {step.locationOrLink}
                    </div>
                  )}
                </div>
              )}

              {step.associatedExercises && step.associatedExercises.length > 0 && (
                <div>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    Exercices associés
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {step.associatedExercises.map((exerciseType) => (
                      <span
                        key={exerciseType}
                        className="text-xs font-bold bg-brand-sage/10 px-3 py-1 rounded-full"
                      >
                        {exerciseLinksEnabled && !step.isLocked && !step.completed ? (
                          <AppLink
                            href={`/dashboard/candidat/exercises/${exerciseType.toLowerCase()}`}
                            className="text-brand-sage"
                          >
                            {getExerciseTitle(exerciseType)}
                          </AppLink>
                        ) : (
                          <span
                            className={
                              step.isLocked
                                ? 'text-slate-400 cursor-not-allowed'
                                : 'text-brand-sage'
                            }
                            aria-disabled={step.isLocked}
                          >
                            {getExerciseTitle(exerciseType)}
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {sidebarExtras}
            </div>
          </div>
          {results.map((r) =>
            r.qualitativeAnalysis ? (
              <div key={`sidebar-analysis-${r.id}`} className="hidden lg:block">
                <ExerciseQualitativeAnalysisCard
                  markdown={r.qualitativeAnalysis}
                  exerciseTitle={results.length > 1 ? getExerciseTitle(r.type) : undefined}
                />
              </div>
            ) : null
          )}
          {afterSidebarCard}
        </div>
      </div>
    </div>
  )
})

StepDetailView.displayName = 'StepDetailView'

export default StepDetailView

