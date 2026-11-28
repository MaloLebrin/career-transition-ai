/**
 * Contrat commun des outils d'exercice (`inertia/components/exercises/*Tool.tsx`, #170).
 *
 * `TResult` : données envoyées à la complétion (`onSave`).
 * `TDraft`  : état enregistré automatiquement en brouillon (`onSaveDraft`, différé par
 * `useExerciseDraft`), relu au montage via `initialDraftPromise`.
 */

/** Brouillon relu au montage : seul `data` est exploité, et il peut être incomplet. */
export type ExerciseDraftSnapshot<TDraft> = { data?: Partial<TDraft> | null }

export type InitialDraftPromise<TDraft> = Promise<ExerciseDraftSnapshot<TDraft> | null>

export interface ExerciseToolProps<TResult, TDraft = TResult> {
  onSave: (data: TResult, duration: number) => void | Promise<void>
  onSaveDraft: (data: TDraft) => void | Promise<void>
  initialDraftPromise?: InitialDraftPromise<TDraft>
}

/* ----------------------------------------------------------------- Valeurs */

export type ValuesPerson = { name: string; values: string }

export type ValuesResult = { selectedValues: string[]; peopleExercise: ValuesPerson[] }

export type ValuesDraft = ValuesResult & { step: 1 | 2 }

/* -------------------------------------------------- Cartographie de compétences */

export type SkillMappingRow = { id: string; mission: string; activity: string; proof: string }

export type SkillMappingResult = {
  mapping: SkillMappingRow[]
  experienceId: string
  jobTitle: string
}

export type SkillMappingDraft = {
  rows: SkillMappingRow[]
  selectedExpId: string
  step: 1 | 2
  narrative: string
}

/* -------------------------------------------------------- Cercle de contrôle */

export type CircleOfControlDecision = 'inside' | 'outside'

export type CircleOfControlGameState = 'intro' | 'playing' | 'summary'

export type CircleOfControlResult = { inControl: string[]; outControl: string[] }

export type CircleOfControlDraft = {
  decisions: Record<string, CircleOfControlDecision>
  currentIndex: number
  gameState: CircleOfControlGameState
}

/* ------------------------------------------------------------ Courbe de vie */

export type LifeCurvePoint = { year: number; satisfaction: number; label: string }

export type LifeCurveReflection = {
  form: string
  mostlySatisfied: string
  amplitude: string
  explanation: string
  surprise: string
  coherence: string
}

export type LifeCurveResult = { points: LifeCurvePoint[]; reflection: LifeCurveReflection }

export type LifeCurveDraft = LifeCurveResult & { step: 1 | 2 }

/* -------------------------------------------------------------- Motivations */

export type MotivationResult = {
  ranked: string[]
  scores: Record<string, number>
  matrix: (number | null)[][]
}

export type MotivationDraft = {
  matrix: (number | null)[][]
  currentI: number
  currentJ: number
}

/* --------------------------------------------------------------------- DISC */

/**
 * Brouillon DISC. Les types de sélection et de calcul vivent avec le questionnaire
 * (`inertia/components/exercises/disc/disc_scoring.ts`) : ils sont passés en paramètres.
 */
export type DiscDraft<TSelection, TComputation> = {
  selections: Record<number, TSelection>
  currentIdx: number
  resultPreview: TComputation | null
}
