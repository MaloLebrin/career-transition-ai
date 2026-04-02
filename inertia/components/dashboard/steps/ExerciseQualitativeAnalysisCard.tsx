import { memo } from 'react'
import MarkdownContent from '~/components/ui/MarkdownContent'

export interface ExerciseQualitativeAnalysisCardProps {
  markdown: string
  /** Affiché au-dessus du contenu quand plusieurs exercices ont une analyse sur la même étape */
  exerciseTitle?: string
}

/**
 * Bloc « Analyse IA » (markdown) pour un résultat d’exercice.
 */
const ExerciseQualitativeAnalysisCard = memo(function ExerciseQualitativeAnalysisCard({
  markdown,
  exerciseTitle,
}: ExerciseQualitativeAnalysisCardProps) {
  return (
    <div className="bg-violet-50/50 p-8 rounded-[32px] border border-violet-100 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-2 h-full bg-violet-600" aria-hidden />
      <p className="text-[10px] font-black text-violet-600 uppercase tracking-widest mb-2">
        Analyse IA
      </p>
      {exerciseTitle ? (
        <p className="text-xs font-bold text-violet-800 mb-3">{exerciseTitle}</p>
      ) : null}
      <MarkdownContent>{markdown}</MarkdownContent>
    </div>
  )
})

ExerciseQualitativeAnalysisCard.displayName = 'ExerciseQualitativeAnalysisCard'

export default ExerciseQualitativeAnalysisCard
