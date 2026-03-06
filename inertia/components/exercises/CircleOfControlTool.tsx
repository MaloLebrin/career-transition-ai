import React, { useState, useRef, useEffect } from 'react'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import Card from '../ui/Card'
import { ExerciseDraft } from '../../types'

interface Props {
  onSave: (data: any, duration: number) => void
  // Added missing draft props
  onSaveDraft: (data: any) => void
  initialDraftPromise?: Promise<ExerciseDraft | null>
}

const CONTROL_ITEMS = [
  { id: '1', label: "L'opinion des autres" },
  { id: '2', label: 'Le futur' },
  { id: '3', label: 'Mes limites' },
  { id: '4', label: 'Mes réponses' },
  { id: '5', label: 'Mon énergie' },
  { id: '6', label: 'Le comportement des autres' },
  { id: '7', label: 'Les résultats' },
  { id: '8', label: 'Le passé' },
  { id: '9', label: "La façon de m'exprimer" },
  { id: '10', label: 'Avec qui je passe du temps' },
  { id: '11', label: 'Vieillir' },
  { id: '12', label: 'Mon attitude' },
  { id: '13', label: 'Mes émotions' },
  { id: '14', label: 'Le temps qui passe' },
  { id: '15', label: 'Ce que disent les gens de moi' },
  { id: '16', label: 'Ma façon de traiter les autres' },
  { id: '17', label: 'Événements extérieurs' },
  { id: '18', label: 'Mon discours interne' },
  { id: '19', label: 'La façon dont on me traite' },
  { id: '20', label: 'Ce que pensent les gens de moi' },
]

const CircleOfControlTool: React.FC<Props> = ({ onSave, onSaveDraft, initialDraftPromise }) => {
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'summary'>('intro')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [decisions, setDecisions] = useState<Record<string, 'inside' | 'outside'>>({})
  const [animationDir, setAnimationDir] = useState<'left' | 'right' | null>(null)
  const startTimeRef = useRef<number>(Date.now())

  // Load draft on mount
  useEffect(() => {
    if (initialDraftPromise) {
      initialDraftPromise.then((draft) => {
        if (draft && draft.data) {
          setDecisions(draft.data.decisions || {})
          setCurrentIndex(draft.data.currentIndex || 0)
          setGameState(draft.data.gameState || 'intro')
        }
      })
    }
  }, [initialDraftPromise])

  // Auto-save draft
  useEffect(() => {
    onSaveDraft({ decisions, currentIndex, gameState })
  }, [decisions, currentIndex, gameState, onSaveDraft])

  const handleStart = () => {
    startTimeRef.current = Date.now()
    setGameState('playing')
  }

  const handleDecision = (type: 'inside' | 'outside') => {
    if (animationDir) return

    setAnimationDir(type === 'outside' ? 'left' : 'right')

    setTimeout(() => {
      const item = CONTROL_ITEMS[currentIndex]
      setDecisions((prev) => ({ ...prev, [item.id]: type }))

      if (currentIndex < CONTROL_ITEMS.length - 1) {
        setCurrentIndex(currentIndex + 1)
        setAnimationDir(null)
      } else {
        setGameState('summary')
      }
    }, 350)
  }

  const handleSave = () => {
    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000)
    const inControl = CONTROL_ITEMS.filter((i) => decisions[i.id] === 'inside').map((i) => i.label)
    const outControl = CONTROL_ITEMS.filter((i) => decisions[i.id] === 'outside').map(
      (i) => i.label
    )
    onSave({ inControl, outControl }, duration)
  }

  if (gameState === 'intro') {
    return (
      <Card className="max-w-2xl mx-auto text-center space-y-10 animate-fadeIn py-12">
        <div className="w-24 h-24 bg-violet-600 text-white rounded-[32px] flex items-center justify-center mx-auto shadow-2xl shadow-violet-200">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
              d="M11 4a2 2 0 114 0v1a2 2 0 01-2 2 2 2 0 01-2-2V4zm3 11l3 1 1-4-3-1-1 4zM10 11l-3-1-1 4 3 1 1-4zM4 17l1 4 4-1-1-4-4 1z"
            />
          </svg>
        </div>
        <div className="space-y-4">
          <Badge variant="violet">Module 04</Badge>
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter italic">
            Cercle de Contrôle
          </h2>
          <p className="text-slate-500 text-lg font-medium leading-relaxed">
            Dans une transition, l'énergie est votre ressource la plus précieuse. <br />
            Identifions ensemble ce qui mérite votre attention et ce que vous devez apprendre à
            lâcher.
          </p>
        </div>
        <Card variant="flat" className="text-left p-6 flex items-start space-x-4">
          <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center shrink-0 font-black text-xs">
            !
          </div>
          <p className="text-xs text-slate-600 font-bold leading-relaxed">
            Vous allez voir 20 situations. Triez-les selon votre ressenti actuel. Il n'y a pas de
            mauvaise réponse, seulement votre réalité.
          </p>
        </Card>
        <Button size="lg" className="w-full" onClick={handleStart}>
          Commencer le tri
        </Button>
      </Card>
    )
  }

  const progress = ((currentIndex + (gameState === 'summary' ? 1 : 0)) / CONTROL_ITEMS.length) * 100

  return (
    <div className="max-w-6xl mx-auto pb-24 px-4 overflow-hidden min-h-[700px]">
      <style>{`
        @keyframes slideOutLeft {
          0% { transform: translateX(0) rotate(0deg); opacity: 1; }
          100% { transform: translateX(-150%) rotate(-25deg); opacity: 0; }
        }
        @keyframes slideOutRight {
          0% { transform: translateX(0) rotate(0deg); opacity: 1; }
          100% { transform: translateX(150%) rotate(25deg); opacity: 0; }
        }
        .animate-card-left { animation: slideOutLeft 0.4s ease-in forwards; }
        .animate-card-right { animation: slideOutRight 0.4s ease-in forwards; }
      `}</style>

      <div className="mb-16 text-center space-y-4">
        <div className="w-full max-w-md mx-auto h-2 bg-slate-100 rounded-full overflow-hidden mb-8">
          <div
            className="h-full bg-violet-600 transition-all duration-700"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight italic">
          Positionnez cet élément
        </h2>
      </div>

      {gameState === 'playing' ? (
        <div className="flex flex-col items-center justify-center space-y-16">
          <div className="relative w-full max-w-sm aspect-[4/5]">
            <div className="absolute inset-0 bg-slate-100 rounded-[48px] rotate-3 translate-x-2 translate-y-2"></div>
            <div
              className={`absolute inset-0 bg-white p-12 rounded-[48px] border-2 border-slate-100 shadow-2xl flex flex-col items-center justify-center text-center space-y-8 transition-all ${animationDir === 'left' ? 'animate-card-left border-pink-200' : animationDir === 'right' ? 'animate-card-right border-violet-200' : ''}`}
            >
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] mb-4">
                Item {currentIndex + 1} / 20
              </span>
              <h3 className="text-4xl font-black text-slate-900 leading-tight tracking-tighter">
                {CONTROL_ITEMS[currentIndex].label}
              </h3>
              <div className="w-10 h-1 bg-slate-100 rounded-full"></div>
            </div>
          </div>

          <div className="flex gap-6 w-full max-w-2xl">
            <Button
              onClick={() => handleDecision('outside')}
              disabled={!!animationDir}
              variant="danger"
              size="lg"
              className="flex-1 py-8 rounded-[40px] flex flex-col items-center space-y-4"
              icon={
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      d="M20 12H4"
                    />
                  </svg>
                </div>
              }
            >
              <span className="text-[10px] font-black uppercase tracking-widest">
                C'est extérieur
              </span>
            </Button>

            <Button
              onClick={() => handleDecision('inside')}
              disabled={!!animationDir}
              variant="primary"
              size="lg"
              className="flex-1 py-8 rounded-[40px] flex flex-col items-center space-y-4"
              icon={
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shadow-sm">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="3"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </div>
              }
            >
              <span className="text-[10px] font-black uppercase tracking-widest">
                C'est sous mon contrôle
              </span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-12 animate-fadeIn">
          <Card className="p-16 text-center space-y-10">
            <div className="w-24 h-24 bg-emerald-500 text-white rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-100">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-4xl font-black text-slate-900 tracking-tight">
              Analyse terminée !
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="p-10 bg-violet-50 rounded-[48px] border-2 border-violet-100">
                <div className="text-5xl font-black text-violet-600 mb-2">
                  {Object.values(decisions).filter((v) => v === 'inside').length}
                </div>
                <div className="text-[11px] font-black text-violet-400 uppercase tracking-widest">
                  Zones d'Influence
                </div>
              </div>
              <div className="p-10 bg-pink-50 rounded-[48px] border-2 border-pink-100">
                <div className="text-5xl font-black text-pink-600 mb-2">
                  {Object.values(decisions).filter((v) => v === 'outside').length}
                </div>
                <div className="text-[11px] font-black text-pink-400 uppercase tracking-widest">
                  Zones de Lâcher-prise
                </div>
              </div>
            </div>

            <Button size="lg" className="px-24" onClick={handleSave}>
              Transmettre le diagnostic
            </Button>
          </Card>
        </div>
      )}
    </div>
  )
}

export default CircleOfControlTool
