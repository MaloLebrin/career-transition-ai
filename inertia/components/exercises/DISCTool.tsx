
import React, { useEffect, useRef, useState } from 'react';
import { ExerciseDraft } from '../../types';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Card from '../ui/Card';

interface Props {
  onSave: (data: any, duration: number) => void;
  onSaveDraft: (data: any) => void;
  initialDraftPromise?: Promise<ExerciseDraft | null>;
}

const DISC_GROUPS = [
  { id: 1, options: [
    { label: "Enthousiaste, optimiste", trait: "I" },
    { label: "Audacieux, direct", trait: "D" },
    { label: "Diplomate, précis", trait: "C" },
    { label: "Satisfait, calme", trait: "S" }
  ]},
  { id: 2, options: [
    { label: "Prudent, réfléchi", trait: "C" },
    { label: "Décidé, déterminé", trait: "D" },
    { label: "Encourageant, amical", trait: "I" },
    { label: "Pacifique, patient", trait: "S" }
  ]},
  { id: 3, options: [
    { label: "Amical, coopératif", trait: "S" },
    { label: "Précis, analytique", trait: "C" },
    { label: "Déterminé, fonceur", trait: "D" },
    { label: "Convaincant, dynamique", trait: "I" }
  ]},
  { id: 4, options: [
    { label: "Respectueux, poli", trait: "C" },
    { label: "Aventureux, courageux", trait: "D" },
    { label: "Joyeux, sociable", trait: "I" },
    { label: "Serviable, modeste", trait: "S" }
  ]},
  { id: 5, options: [
    { label: "Autoritaire, exigeant", trait: "D" },
    { label: "Stimulant, éloquent", trait: "I" },
    { label: "Constant, prévisible", trait: "S" },
    { label: "Logique, rigoureux", trait: "C" }
  ]},
  { id: 6, options: [
    { label: "Persuasif, rayonnant", trait: "I" },
    { label: "Indépendant, ferme", trait: "D" },
    { label: "Doux, compréhensif", trait: "S" },
    { label: "Méthodique, ordonné", trait: "C" }
  ]},
  { id: 7, options: [
    { label: "Discipliné, réservé", trait: "C" },
    { label: "Compétitif, combatif", trait: "D" },
    { label: "Chaleureux, expressif", trait: "I" },
    { label: "Loyal, dévoué", trait: "S" }
  ]},
  { id: 8, options: [
    { label: "Obstiné, énergique", trait: "D" },
    { label: "Ludique, insouciant", trait: "I" },
    { label: "Discret, effacé", trait: "S" },
    { label: "Perfectionniste, exigeant", trait: "C" }
  ]},
  { id: 9, options: [
    { label: "Accommodant, docile", trait: "S" },
    { label: "Systématique, structuré", trait: "C" },
    { label: "Vigoureux, franc", trait: "D" },
    { label: "Sociable, loquace", trait: "I" }
  ]},
  { id: 10, options: [
    { label: "Agréable, consensuel", trait: "S" },
    { label: "Prudent, circonspect", trait: "C" },
    { label: "Audacieux, initiateur", trait: "D" },
    { label: "Vif, exubérant", trait: "I" }
  ]},
  { id: 11, options: [
    { label: "Calme, maître de soi", trait: "S" },
    { label: "Précis, factuel", trait: "C" },
    { label: "Directif, décisif", trait: "D" },
    { label: "Charmant, populaire", trait: "I" }
  ]},
  { id: 12, options: [
    { label: "Assuré, dominant", trait: "D" },
    { label: "Inspirant, confiant", trait: "I" },
    { label: "Sincère, tolérant", trait: "S" },
    { label: "Analytique, sérieux", trait: "C" }
  ]},
  { id: 13, options: [
    { label: "Indépendant, autonome", trait: "D" },
    { label: "Optimiste, positif", trait: "I" },
    { label: "Stable, équilibré", trait: "S" },
    { label: "Factuel, objectif", trait: "C" }
  ]},
  { id: 14, options: [
    { label: "Persévérant, tenace", trait: "S" },
    { label: "Consciencieux, scrupuleux", trait: "C" },
    { label: "Actif, impatient", trait: "D" },
    { label: "Amical, disert", trait: "I" }
  ]},
  { id: 15, options: [
    { label: "Docile, obéissant", trait: "C" },
    { label: "Brave, hardi", trait: "D" },
    { label: "Spirituel, amusant", trait: "I" },
    { label: "Paisible, tranquille", trait: "S" }
  ]}
];

const DISCTool: React.FC<Props> = ({ onSave, onSaveDraft, initialDraftPromise }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selections, setSelections] = useState<Record<number, { most: string, least: string }>>({});
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (initialDraftPromise) {
      initialDraftPromise.then(draft => {
        if (draft && draft.data) {
          setSelections(draft.data.selections);
          setCurrentIdx(draft.data.currentIdx);
        }
      });
    }
  }, []);

  useEffect(() => {
    onSaveDraft({ selections, currentIdx });
  }, [selections, currentIdx]);

  const handleSelect = (trait: string, type: 'most' | 'least') => {
    const currentSelection = selections[currentIdx] || { most: '', least: '' };
    if (type === 'most' && currentSelection.least === trait) return;
    if (type === 'least' && currentSelection.most === trait) return;
    setSelections({ ...selections, [currentIdx]: { ...currentSelection, [type]: trait } });
  };

  const isCurrentStepValid = selections[currentIdx]?.most && selections[currentIdx]?.least;

  const next = () => {
    if (currentIdx < DISC_GROUPS.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      finalize();
    }
  };

  const finalize = () => {
    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const scores = { D: 0, I: 0, S: 0, C: 0 };
    (Object.values(selections) as Array<{ most: string, least: string }>).forEach(sel => {
      if (sel.most) scores[sel.most as keyof typeof scores] += 1;
    });
    const normalized = {
      D: Math.round((scores.D / 15) * 100),
      I: Math.round((scores.I / 15) * 100),
      S: Math.round((scores.S / 15) * 100),
      C: Math.round((scores.C / 15) * 100)
    };
    onSave(normalized, duration);
  };

  const currentGroup = DISC_GROUPS[currentIdx];

  return (
    <div className="max-w-5xl mx-auto animate-fadeIn pb-20">
      <Card className="overflow-hidden p-0">
        <div className="h-3 bg-slate-100 w-full">
          <div className="h-full bg-violet-600 transition-all duration-700" style={{ width: `${((currentIdx + 1) / DISC_GROUPS.length) * 100}%` }} />
        </div>
        
        <div className="p-12 md:p-16">
          <div className="flex justify-between items-center mb-12">
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter italic">Diagnostic Comportemental</h3>
            <Badge variant="violet">Étape {currentIdx + 1} / {DISC_GROUPS.length}</Badge>
          </div>

          <p className="text-slate-500 mb-10 font-medium">Choisissez l'adjectif qui vous ressemble <span className="text-violet-600 font-black">LE PLUS</span> et celui qui vous ressemble <span className="text-rose-500 font-black">LE MOINS</span>.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentGroup.options.map((option, i) => {
              const isMost = selections[currentIdx]?.most === option.trait;
              const isLeast = selections[currentIdx]?.least === option.trait;
              
              return (
                <div key={i} className={`p-8 rounded-[40px] border-2 transition-all flex flex-col justify-between h-56 ${isMost ? 'border-violet-600 bg-violet-50' : isLeast ? 'border-rose-500 bg-rose-50' : 'border-slate-100 bg-slate-50'}`}>
                  <span className="text-xl font-black text-slate-900 leading-tight">{option.label}</span>
                  
                  <div className="flex gap-4 mt-6">
                    <Button 
                      onClick={() => handleSelect(option.trait, 'most')} 
                      className="grow"
                      variant={isMost ? 'primary' : 'outline'}
                      size="md"
                    >
                      C'est moi
                    </Button>
                    <Button 
                      onClick={() => handleSelect(option.trait, 'least')} 
                      className="grow"
                      variant={isLeast ? 'danger' : 'outline'}
                      size="md"
                    >
                      Pas du tout
                    </Button>
                  </div>
                </div>
              );
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
               {currentIdx === DISC_GROUPS.length - 1 ? "Voir mon profil" : "Suivant"}
             </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DISCTool;
