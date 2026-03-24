import { EXERCISE_LIST, EXERCICE_RESULTS_TYPES } from '#shared/constants/exercises'

type ResultLike = {
  type: string
  status?: string | null
  data?: any
  date?: { toISO: () => string | null } | null
  updatedAt?: { toISO: () => string | null } | null
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0
  if (value < 0) return 0
  if (value > 100) return 100
  return Math.round(value)
}

function isFilled(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'number') return true
  if (typeof value === 'boolean') return value
  if (typeof value === 'object') return Object.keys(value as Record<string, unknown>).length > 0
  return false
}

function ratioPercent(done: number, total: number): number {
  if (total <= 0) return 0
  return clampPercent((done / total) * 100)
}

function motivationProgress(data: any): number {
  const matrix = Array.isArray(data?.matrix) ? data.matrix : []
  const total = 231 // 22 * 21 / 2
  let answered = 0
  for (let i = 0; i < matrix.length; i++) {
    const row = Array.isArray(matrix[i]) ? matrix[i] : []
    for (let j = i + 1; j < row.length; j++) {
      if (row[j] !== null && row[j] !== undefined) answered += 1
    }
  }
  if (answered > 0) return ratioPercent(answered, total)

  const currentI = typeof data?.currentI === 'number' ? data.currentI : 0
  const currentJ = typeof data?.currentJ === 'number' ? data.currentJ : 1
  const duelIndex = Math.max(0, (21 * currentI) - ((currentI - 1) * currentI) / 2 + (currentJ - currentI))
  return ratioPercent(duelIndex, total)
}

function valuesProgress(data: any): number {
  const selectedValues = Array.isArray(data?.selectedValues) ? data.selectedValues : []
  const valuesPart = Math.min(selectedValues.length, 10) / 10
  const people = Array.isArray(data?.peopleExercise) ? data.peopleExercise : []
  const peopleFields = people
    .slice(0, 3)
    .reduce((acc: number, p: any) => acc + (isFilled(p?.name) ? 1 : 0) + (isFilled(p?.values) ? 1 : 0), 0)
  const peoplePart = peopleFields / 6
  return clampPercent((valuesPart * 70) + (peoplePart * 30))
}

function lifeCurveProgress(data: any): number {
  const points = Array.isArray(data?.points) ? data.points : []
  const pointsPart = Math.min(points.length, 5) / 5
  const reflection = data?.reflection ?? {}
  const reflectionKeys = ['form', 'mostlySatisfied', 'amplitude', 'explanation', 'surprise', 'coherence']
  const reflectionDone = reflectionKeys.filter((k) => isFilled(reflection?.[k])).length
  const reflectionPart = reflectionDone / reflectionKeys.length
  return clampPercent((pointsPart * 60) + (reflectionPart * 40))
}

function personalityProgress(data: any): number {
  const keys = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism']
  const done = keys.filter((k) => typeof data?.[k] === 'number').length
  return ratioPercent(done, keys.length)
}

function targetingProgress(data: any): number {
  const targets = Array.isArray(data?.targets) ? data.targets : []
  if (targets.length === 0) return 0
  let units = 0
  let total = 0
  for (const target of targets.slice(0, 10)) {
    total += 3
    units += isFilled(target?.name) ? 1 : 0
    units += isFilled(target?.type) ? 1 : 0
    units += isFilled(target?.comment) ? 1 : 0
  }
  return ratioPercent(units, total)
}

function discProgress(data: any): number {
  const selections = data?.selections ?? {}
  const entries = Object.values(selections) as Array<{ most?: string; least?: string }>
  const done = entries.filter((e) => isFilled(e?.most) && isFilled(e?.least)).length
  if (done > 0) return ratioPercent(done, 15)
  const hasScores = ['D', 'I', 'S', 'C'].every((k) => typeof data?.[k] === 'number')
  return hasScores ? 100 : 0
}

function skillMappingProgress(data: any): number {
  const narrativePart = isFilled(data?.narrative) ? 1 : 0
  const rows = Array.isArray(data?.rows) ? data.rows : Array.isArray(data?.mapping) ? data.mapping : []
  const cappedRows = rows.slice(0, 5)
  let rowUnits = 0
  let rowTotal = 0
  for (const row of cappedRows) {
    rowTotal += 3
    rowUnits += isFilled(row?.mission) ? 1 : 0
    rowUnits += isFilled(row?.activity) ? 1 : 0
    rowUnits += isFilled(row?.proof) ? 1 : 0
  }
  const rowPart = rowTotal > 0 ? rowUnits / rowTotal : 0
  return clampPercent((narrativePart * 30) + (rowPart * 70))
}

function circleOfControlProgress(data: any): number {
  if (Array.isArray(data?.inControl) || Array.isArray(data?.outControl)) {
    const inCount = Array.isArray(data?.inControl) ? data.inControl.length : 0
    const outCount = Array.isArray(data?.outControl) ? data.outControl.length : 0
    return ratioPercent(inCount + outCount, 20)
  }
  const decisions = data?.decisions ?? {}
  const done = Object.values(decisions).filter((v) => v === 'inside' || v === 'outside').length
  return ratioPercent(done, 20)
}

export function getExerciseProgress(type: string, data: any, status?: string | null): number {
  if (String(status ?? '').toLowerCase() === 'completed') return 100

  switch (String(type).toLowerCase()) {
    case EXERCICE_RESULTS_TYPES.MOTIVATION:
      return motivationProgress(data)
    case EXERCICE_RESULTS_TYPES.VALUES:
      return valuesProgress(data)
    case EXERCICE_RESULTS_TYPES.LIFE_CURVE:
      return lifeCurveProgress(data)
    case EXERCICE_RESULTS_TYPES.PERSONALITY:
      return personalityProgress(data)
    case EXERCICE_RESULTS_TYPES.TARGETING:
      return targetingProgress(data)
    case EXERCICE_RESULTS_TYPES.DISC:
      return discProgress(data)
    case EXERCICE_RESULTS_TYPES.SKILL_MAPPING:
      return skillMappingProgress(data)
    case EXERCICE_RESULTS_TYPES.CIRCLE_OF_CONTROL:
      return circleOfControlProgress(data)
    default:
      return isFilled(data) ? 100 : 0
  }
}

export function getExerciseProgressByType(results: ResultLike[]): Record<string, number> {
  const latestByType = new Map<string, ResultLike & { ts: string }>()

  for (const result of results || []) {
    const type = String(result.type).toLowerCase()
    const ts = result.date?.toISO?.() ?? result.updatedAt?.toISO?.() ?? ''
    const current = latestByType.get(type)
    if (!current || ts > current.ts) {
      latestByType.set(type, { ...result, ts })
    }
  }

  const progressByType: Record<string, number> = {}
  for (const exercise of EXERCISE_LIST) {
    const latest = latestByType.get(exercise.slug)
    progressByType[exercise.slug] = latest
      ? getExerciseProgress(exercise.slug, latest.data ?? {}, latest.status)
      : 0
  }

  return progressByType
}

