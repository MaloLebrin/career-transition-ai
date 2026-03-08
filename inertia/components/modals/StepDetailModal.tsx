import React from 'react'
import { ExerciseResult, SupportPlanStep } from '../../types'
import ExerciseResultVisualization from '../exercises/ExerciseResultVisualization'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Card from '../ui/Card'

interface Props {
  step: SupportPlanStep
  result?: ExerciseResult
  onClose: () => void
  userRole: 'advisor' | 'employee'
}

function formatSessionDate(dateStr: string | undefined): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const StepDetailModal: React.FC<Props> = ({ step, result, onClose, userRole }) => {
  const renderResult = () => {
    if (!result) {
      return (
        <div className="py-20 text-center text-slate-400">
          <p className="font-medium italic">Aucun résultat disponible pour cette étape.</p>
        </div>
      )
    }
    return <ExerciseResultVisualization result={result} />
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fadeIn">
      {/* 
        Le Wrapper Principal porte l'arrondi et l'ombre. 
        Le overflow-hidden garantit que rien ne dépasse des coins arrondis.
      */}
      <Card className="w-full max-w-6xl relative animate-slideUp overflow-hidden flex flex-col max-h-[92vh] p-0">
        {/* Bouton de fermeture fixe par rapport au scroll */}
        <Button
          onClick={onClose}
          variant="ghost"
          size="sm"
          className="absolute top-8 right-8 z-[210] bg-slate-50"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          }
        />

        {/* 
          Zone de défilement interne. 
          Le padding est appliqué ici pour que le contenu respire mais ne touche pas les bords extrêmes lors du scroll.
        */}
        <div className="grow overflow-y-auto custom-scrollbar p-12 md:p-16">
          <div className="mb-12 pr-10">
            <div className="flex items-center space-x-3 mb-4">
              <Badge variant={step.completed ? 'lime' : 'slate'}>
                {step.completed ? 'Étape Validée' : 'En attente'}
              </Badge>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
                Dossier #{String(step.id).slice(0, 8)}
              </span>
            </div>
            <h2 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">
              {step.title}
            </h2>
            <p className="text-slate-500 mt-4 text-lg font-medium">{step.description}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-8 space-y-12">
              <section className="space-y-6">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] px-2">
                  Visualisation du Résultat
                </h3>
                {renderResult()}
              </section>

              {result?.qualitativeAnalysis && (
                <section className="space-y-4 pb-10">
                  <h3 className="text-[11px] font-black text-violet-600 uppercase tracking-[0.4em] px-2">
                    Analyse Synthétique Gemini
                  </h3>
                  <div className="bg-violet-50/50 p-10 rounded-[48px] border border-violet-100 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-2 h-full bg-violet-600"></div>
                    <p className="italic text-violet-900 leading-relaxed text-base font-medium relative z-10">
                      "{result.qualitativeAnalysis}"
                    </p>
                  </div>
                </section>
              )}
            </div>

            <div className="lg:col-span-4 space-y-8">
              <div className="bg-slate-50 p-8 rounded-[48px] border border-slate-100 shadow-sm">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">
                  Informations Session
                </h3>
                <div className="space-y-6">
                  <div>
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      Échéance prévue
                    </div>
                    <div className="text-base font-black text-slate-900">
                      {formatSessionDate(step.dueDate)}
                    </div>
                  </div>
                  {result && (
                    <div>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Passage le
                      </div>
                      <div className="text-base font-black text-slate-900">
                        {formatSessionDate(result.date)}
                      </div>
                    </div>
                  )}
                  {result && (
                    <div>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        Durée totale
                      </div>
                      <div className="text-base font-black text-slate-900">
                        {Math.floor(result.duration / 60)} min {result.duration % 60} s
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {userRole === 'advisor' && (
                <div className="bg-orange-50/50 p-8 rounded-[48px] border border-orange-100 shadow-sm">
                  <h3 className="text-[11px] font-black text-orange-600 uppercase tracking-[0.3em] mb-8">
                    Notes Accompagnateur
                  </h3>
                  <textarea
                    className="w-full bg-white/50 border border-orange-100 rounded-[32px] p-6 text-sm min-h-[200px] outline-none focus:ring-2 focus:ring-orange-500 transition-all resize-none italic font-bold text-orange-900 placeholder:text-orange-200 shadow-inner"
                    placeholder="Saisissez vos observations pour aider le candidat..."
                    defaultValue={step.notes || ''}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default StepDetailModal
