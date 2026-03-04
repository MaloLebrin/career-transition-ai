
import React, { useState, useRef, useEffect } from 'react';
import { SCHWARTZ_VALUES } from '../../constants/values';
import { ExerciseDraft } from '../../types';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Input from '../ui/Input';

interface Props {
  onSave: (data: { selectedValues: string[], peopleExercise: { name: string, values: string }[] }, duration: number) => void;
  // Added missing draft props
  onSaveDraft: (data: any) => void;
  initialDraftPromise?: Promise<ExerciseDraft | null>;
}

const ValuesTool: React.FC<Props> = ({ onSave, onSaveDraft, initialDraftPromise }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [rankedValues, setRankedValues] = useState<string[]>([]);
  const [people, setPeople] = useState([{ name: '', values: '' }, { name: '', values: '' }, { name: '', values: '' }]);
  const startTimeRef = useRef<number>(Date.now());

  // Load draft on mount
  useEffect(() => {
    if (initialDraftPromise) {
      initialDraftPromise.then(draft => {
        if (draft && draft.data) {
          setRankedValues(draft.data.selectedValues || []);
          setPeople(draft.data.peopleExercise || [{ name: '', values: '' }, { name: '', values: '' }, { name: '', values: '' }]);
          setStep(draft.data.step || 1);
        }
      });
    }
  }, [initialDraftPromise]);

  // Auto-save draft whenever relevant state changes
  useEffect(() => {
    onSaveDraft({ selectedValues: rankedValues, peopleExercise: people, step });
  }, [rankedValues, people, step, onSaveDraft]);

  const unrankedValues = SCHWARTZ_VALUES.filter(v => !rankedValues.includes(v.label));

  const handleRankValue = (label: string) => {
    setRankedValues([...rankedValues, label]);
  };

  const handleRemoveValue = (label: string) => {
    setRankedValues(rankedValues.filter(v => v !== label));
  };

  const updatePerson = (idx: number, field: 'name' | 'values', val: string) => {
    const next = [...people];
    next[idx][field] = val;
    setPeople(next);
  };

  const handleSave = () => {
    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
    onSave({ selectedValues: rankedValues, peopleExercise: people }, duration);
  };

  return (
    <Card className="p-10 max-w-5xl mx-auto animate-fadeIn border-brand-navy/5">
      {step === 1 ? (
        <div className="space-y-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h3 className="text-3xl font-bold text-brand-navy mb-4 tracking-tight">Classement des Valeurs</h3>
            <p className="text-brand-navy/60 leading-relaxed">
              Classez les 10 valeurs universelles de Schwartz par ordre d'importance pour vous. 
              <span className="block mt-2 font-bold text-brand-sage">Cliquez sur les valeurs dans votre ordre de priorité.</span>
              <span className="block mt-1 text-[10px] uppercase font-bold text-brand-navy/20">Chronométrage actif</span>
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest px-2">Valeurs à classer ({unrankedValues.length})</h4>
              <div className="grid grid-cols-1 gap-3">
                {unrankedValues.map(val => (
                  <button
                    key={val.id}
                    onClick={() => handleRankValue(val.label)}
                    className="p-4 text-left rounded-2xl border border-brand-navy/5 bg-white hover:bg-brand-sage/5 hover:border-brand-sage hover:shadow-xl transition-all group"
                  >
                    <div className="font-bold text-brand-navy group-hover:text-brand-sage">{val.label}</div>
                    <p className="text-[10px] text-brand-navy/40 mt-1 line-clamp-1">{val.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-brand-sage/5 p-8 rounded-[32px] border-2 border-dashed border-brand-sage/20 min-h-[500px]">
              <h4 className="text-[10px] font-bold text-brand-sage uppercase tracking-widest mb-6">Votre hiérarchie ({rankedValues.length}/10)</h4>
              <div className="space-y-3">
                {rankedValues.map((label, idx) => (
                  <div key={label} className="flex items-center bg-white p-4 rounded-2xl shadow-sm border border-brand-sage/10 animate-slideUp">
                    <span className="w-8 h-8 rounded-lg bg-brand-sage text-white flex items-center justify-center font-bold text-xs mr-4">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-brand-navy flex-grow">{label}</span>
                    <button 
                      onClick={() => handleRemoveValue(label)}
                      className="text-brand-navy/20 hover:text-rose-500 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>

              {rankedValues.length === 10 && (
                <Button
                  onClick={() => setStep(2)}
                  className="w-full mt-8 animate-bounce"
                  variant="primary"
                  size="lg"
                >
                  Suivant : Figures marquantes
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-fadeIn max-w-3xl mx-auto">
          <div className="mb-12 text-center">
            <h3 className="text-3xl font-bold text-brand-navy mb-4 tracking-tight">Les Figures d'Inspiration</h3>
            <p className="text-brand-navy/60">Identifiez 3 personnes (réelles ou fictives) qui incarnent vos valeurs.</p>
          </div>

          <div className="space-y-6">
            {people.map((p, i) => (
              <div key={i} className="bg-white p-6 rounded-[32px] border border-brand-navy/5 space-y-4">
                <div className="flex items-center space-x-4">
                  <span className="w-10 h-10 rounded-2xl bg-brand-ivory border border-brand-navy/5 flex items-center justify-center font-bold text-brand-navy/40">
                    {i + 1}
                  </span>
                  <Input
                    placeholder="Nom de la personne"
                    value={p.name}
                    onChange={e => updatePerson(i, 'name', e.target.value)}
                  />
                </div>
                <textarea
                  placeholder="Quelles valeurs cette personne représente-t-elle pour vous ?"
                  className="w-full p-4 border border-brand-navy/10 rounded-2xl focus:ring-2 focus:ring-brand-sage focus:border-brand-sage outline-none text-brand-navy/70 bg-white h-24 resize-none transition-all"
                  value={p.values}
                  onChange={e => updatePerson(i, 'values', e.target.value)}
                />
              </div>
            ))}
          </div>

          <div className="mt-12 flex space-x-4">
            <Button onClick={() => setStep(1)} variant="ghost" size="md">Retour au classement</Button>
            <Button
              onClick={handleSave}
              className="flex-grow"
              variant="primary"
              size="lg"
            >
              Enregistrer mon profil de valeurs
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default ValuesTool;
