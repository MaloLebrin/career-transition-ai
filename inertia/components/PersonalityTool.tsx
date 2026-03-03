
import React, { useState, useRef } from 'react';
import { PersonalityData } from '../types';
import Button from './ui/Button';
import Card from './ui/Card';

interface Props {
  onSave: (data: PersonalityData, duration: number) => void;
}

const PersonalityTool: React.FC<Props> = ({ onSave }) => {
  const [scores, setScores] = useState<PersonalityData>({
    openness: 5,
    conscientiousness: 5,
    extraversion: 5,
    agreeableness: 5,
    neuroticism: 5
  });
  const startTimeRef = useRef<number>(Date.now());

  const fields: { key: keyof PersonalityData; label: string; desc: string }[] = [
    { key: 'openness', label: 'Ouverture d\'esprit', desc: 'Curiosité intellectuelle et préférence pour la nouveauté.' },
    { key: 'conscientiousness', label: 'Conscience professionnelle', desc: 'Auto-discipline, organisation et sens du devoir.' },
    { key: 'extraversion', label: 'Extraversion', desc: 'Énergie puisée dans les interactions sociales.' },
    { key: 'agreeableness', label: 'Amabilité', desc: 'Tendance à être compatissant et coopératif.' },
    { key: 'neuroticism', label: 'Névrosisme / Stabilité Émotionnelle', desc: 'Sensibilité au stress et aux émotions négatives.' }
  ];

  const handleSave = () => {
    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
    onSave(scores, duration);
  };

  return (
    <Card variant="amber" className="p-6">
      <h3 className="text-xl font-black mb-6 text-amber-900 uppercase tracking-tight">Questionnaire de Personnalité (Big Five)</h3>
      <div className="flex justify-between items-center mb-8">
        <p className="text-slate-600">Positionnez-vous sur ces 5 traits fondamentaux pour affiner votre profil professionnel.</p>
        <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-50 px-2 py-1 rounded">Chronométré</span>
      </div>
      
      <div className="space-y-8">
        {fields.map(field => (
          // Fixed: Cast field.key to String to avoid symbol key issue
          <div key={String(field.key)} className="space-y-3">
            <div className="flex justify-between items-baseline">
              <label className="text-sm font-bold text-slate-700">{field.label}</label>
              <span className="text-amber-600 font-bold bg-amber-50 px-2 rounded">{scores[field.key]} / 10</span>
            </div>
            <p className="text-xs text-slate-400 italic">{field.desc}</p>
            <input
              type="range"
              min="1"
              max="10"
              value={scores[field.key]}
              onChange={(e) => setScores(prev => ({ ...prev, [field.key]: parseInt(e.target.value) }))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>
        ))}
      </div>

      <Button
        onClick={handleSave}
        className="mt-10 w-full"
        variant="lime"
        size="lg"
      >
        Finaliser le profil de personnalité
      </Button>
    </Card>
  );
};

export default PersonalityTool;