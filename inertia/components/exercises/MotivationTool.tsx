import React, { useEffect, useMemo, useRef, useState } from 'react'
import { MOTIVATIONS_LIST } from '../../constants/motivations'
import { ExerciseDraft } from '../../types'
import Button from '../ui/Button'
import Card from '../ui/Card'

interface Props {
  onSave: (
    results: { ranked: string[]; scores: Record<string, number>; matrix: (number | null)[][] },
    duration: number
  ) => void
  onSaveDraft: (data: any) => void
  initialDraftPromise?: Promise<ExerciseDraft | null>
}

const MotivationTool: React.FC<Props> = ({ onSave, onSaveDraft, initialDraftPromise }) => {
  const [isStarted, setIsStarted] = useState(false)
  const [currentI, setCurrentI] = useState(0)
  const [currentJ, setCurrentJ] = useState(1)
  const startTimeRef = useRef<number | null>(null)
  const [matrix, setMatrix] = useState<(number | null)[][]>(
    Array(22)
      .fill(null)
      .map(() => Array(22).fill(null))
  )

  const totalDuels = (22 * 21) / 2
  const currentDuelNumber = useMemo(() => {
    let count = 0
    for (let i = 0; i < currentI; i++) count += 21 - i
    count += currentJ - currentI
    return count
  }, [currentI, currentJ])

  const progressPercent = Math.round((currentDuelNumber / totalDuels) * 100)

  const encouragementMessage = useMemo(() => {
    if (progressPercent === 0) return "C'est parti !"
    if (progressPercent < 25) return 'Excellent début, continuez !'
    if (progressPercent < 50) return 'Vous y êtes presque à la moitié !'
    if (progressPercent < 75) return "Belle persévérance, votre profil s'affine."
    if (progressPercent < 90) return 'Dernière ligne droite !'
    return 'Encore quelques duels...'
  }, [progressPercent])

  useEffect(() => {
    if (initialDraftPromise) {
      initialDraftPromise.then((draft) => {
        if (draft && draft.data) {
          setMatrix(draft.data.matrix)
          setCurrentI(draft.data.currentI)
          setCurrentJ(draft.data.currentJ)
          setIsStarted(true)
          startTimeRef.current = Date.now()
        }
      })
    }
  }, [])

  useEffect(() => {
    if (isStarted) {
      onSaveDraft({ matrix, currentI, currentJ })
    }
  }, [matrix, currentI, currentJ, isStarted])

  const handleStart = () => {
    setIsStarted(true)
    startTimeRef.current = Date.now()
  }

  const handleDecision = (winnerIdx: number) => {
    const newMatrix = [...matrix]
    newMatrix[currentI][currentJ] = winnerIdx
    setMatrix(newMatrix)

    if (currentJ < 21) {
      setCurrentJ(currentJ + 1)
    } else if (currentI < 20) {
      setCurrentI(currentI + 1)
      setCurrentJ(currentI + 2)
    } else {
      calculateAndSave(newMatrix)
    }
  }

  const calculateAndSave = (finalMatrix: (number | null)[][]) => {
    const duration = startTimeRef.current
      ? Math.floor((Date.now() - startTimeRef.current) / 1000)
      : 0
    const totals: Record<number, number> = {}
    MOTIVATIONS_LIST.forEach((_, idx) => (totals[idx] = 0))

    for (let i = 0; i < 22; i++) {
      for (let j = i + 1; j < 22; j++) {
        const winner = finalMatrix[i][j]
        if (winner !== null) totals[winner]++
      }
    }

    const namedScores: Record<string, number> = {}
    MOTIVATIONS_LIST.forEach((name, idx) => (namedScores[name] = totals[idx]))
    const ranked = [...MOTIVATIONS_LIST].sort((a, b) => namedScores[b] - namedScores[a])

    onSave({ ranked, scores: namedScores, matrix: finalMatrix }, duration)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isStarted) return
      if (e.key === 'ArrowLeft') handleDecision(currentI)
      if (e.key === 'ArrowRight') handleDecision(currentJ)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isStarted, currentI, currentJ])

  if (!isStarted) {
    return (
      <Card className="max-w-2xl mx-auto text-center animate-fadeIn p-16">
        <div className="w-20 h-20 bg-brand-sage/10 rounded-[32px] flex items-center justify-center text-brand-sage mx-auto mb-8 shadow-inner">
          <svg
            className="w-10 h-10 stroke-[1.5]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <h3 className="text-4xl font-bold text-brand-navy mb-4 tracking-tighter">
          Matrice des Motivations
        </h3>
        <p className="text-brand-navy/60 mb-10 leading-relaxed font-medium">
          Comparez les 22 leviers d'engagement un par un. Cette méthode élimine les biais et révèle
          vos priorités réelles.
        </p>
        <Button onClick={handleStart} className="w-full" size="lg" variant="emphasis">
          Commencer l'analyse
        </Button>
      </Card>
    )
  }

  return (
    <div className="mx-auto animate-fadeIn grid grid-cols-1 lg:grid-cols-4 gap-8">
      <div className="lg:col-span-1 space-y-6">
        <Card className="p-8 text-center sticky top-24">
          <div className="text-4xl font-bold text-brand-sage mb-1">{progressPercent}%</div>
          <div className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest mb-6">
            Progression
          </div>

          <div className="h-1 bg-brand-navy/5 w-full rounded-full overflow-hidden mb-6">
            <div
              className="h-full bg-brand-sage transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>

          <p className="text-xs font-bold text-brand-navy/40 italic animate-pulse">
            "{encouragementMessage}"
          </p>
        </Card>

        <div className="hidden lg:block bg-brand-navy p-6 rounded-[32px] text-white/50 text-center">
          <div className="flex justify-center space-x-2 mb-3">
            <div className="w-8 h-8 rounded-lg border border-white/20 flex items-center justify-center text-[10px] font-bold">
              ←
            </div>
            <div className="w-8 h-8 rounded-lg border border-white/20 flex items-center justify-center text-[10px] font-bold">
              →
            </div>
          </div>
          <p className="text-[9px] font-bold uppercase tracking-widest">
            Utilisez les flèches du clavier pour aller plus vite !
          </p>
        </div>
      </div>

      <div className="lg:col-span-3">
        <Card className="p-12 text-center flex flex-col justify-center min-h-[550px] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-brand-sage/10">
            <div
              className="h-full bg-brand-sage transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>

          <h3 className="text-2xl font-bold text-brand-navy mb-16 italic tracking-tight">
            Lequel est le plus important pour vous ?
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <button
              onClick={() => handleDecision(currentI)}
              className="group p-10 bg-white border border-brand-navy/5 hover:border-brand-sage hover:bg-brand-sage/5 rounded-[40px] text-2xl font-bold text-brand-navy transition-all hover:scale-[1.02] active:scale-95 shadow-sm hover:shadow-xl cursor-pointer disabled:cursor-not-allowed"
            >
              <div className="text-[10px] font-bold text-brand-navy/20 uppercase tracking-widest mb-4 opacity-0 group-hover:opacity-100 transition-opacity">
                Option A
              </div>
              {MOTIVATIONS_LIST[currentI]}
            </button>
            <button
              onClick={() => handleDecision(currentJ)}
              className="group p-10 bg-white border border-brand-navy/5 hover:border-brand-sage hover:bg-brand-sage/5 rounded-[40px] text-2xl font-bold text-brand-navy transition-all hover:scale-[1.02] active:scale-95 shadow-sm hover:shadow-xl cursor-pointer disabled:cursor-not-allowed"
            >
              <div className="text-[10px] font-bold text-brand-navy/20 uppercase tracking-widest mb-4 opacity-0 group-hover:opacity-100 transition-opacity">
                Option B
              </div>
              {MOTIVATIONS_LIST[currentJ]}
            </button>
          </div>

          <div className="mt-16 text-brand-navy/80 text-[10px] font-bold uppercase tracking-[0.5em]">
            <p>Duel {currentDuelNumber} / {totalDuels}</p>
          </div>
          <div className='mt-4'>
            <p className="text-brand-navy text-[10px] font-bold">
              Vous pouvez utiliser les flèches du clavier pour aller plus vite !
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default MotivationTool
