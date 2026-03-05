
import React, { useRef, useState } from 'react';
import { suggestTargets } from '../../services/geminiService';
import Button from '../ui/Button';
import Card from '../ui/Card';

interface TargetItem {
  id: string;
  name: string;
  type: 'Entreprise' | 'Organisme de formation';
  comment: string;
}

interface Props {
  onSave: (data: { targets: TargetItem[] }, duration: number) => void;
  employeeProfile?: { skills: string[], targetRole: string };
}

const TargetingTool: React.FC<Props> = ({ onSave, employeeProfile }) => {
  const [targets, setTargets] = useState<TargetItem[]>([]);
  const [suggestions, setSuggestions] = useState<{ companies: string[], sectors: string[] } | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const startTimeRef = useRef<number>(Date.now());

  const handleAISuggest = async () => {
    if (!employeeProfile) return;
    setIsSuggesting(true);
    try {
      const res = await suggestTargets(employeeProfile);
      setSuggestions(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSuggesting(false);
    }
  };

  const addTarget = (name: string = '', type: 'Entreprise' | 'Organisme de formation' = 'Entreprise') => {
    const newItem: TargetItem = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      type,
      comment: ''
    };
    setTargets([newItem, ...targets]);
  };

  const updateTarget = (id: string, field: keyof TargetItem, value: string) => {
    setTargets(targets.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const removeTarget = (id: string) => {
    setTargets(targets.filter(t => t.id !== id));
  };

  const handleSave = () => {
    const validTargets = targets.filter(t => t.name.trim() !== '');
    if (validTargets.length === 0) {
      alert("Veuillez ajouter au moins une cible avec un nom.");
      return;
    }
    const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
    onSave({ targets: validTargets }, duration);
  };

  return (
    <Card className="p-10 max-w-5xl mx-auto animate-fadeIn">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Ciblage & Plan d'Action</h3>
        <p className="text-slate-500 leading-relaxed">
          Identifiez les structures qui correspondent à votre projet professionnel.
        </p>
        
        {employeeProfile && (
          <div className="mt-6 flex justify-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleAISuggest} 
              isLoading={isSuggesting}
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
            >
              Faire brainstormer l'IA
            </Button>
          </div>
        )}
      </div>

      {suggestions && (
        <div className="mb-12 p-8 bg-violet-50 rounded-[32px] border border-violet-100 animate-slideUp">
          <h4 className="text-[10px] font-black text-violet-600 uppercase tracking-widest mb-4">Suggestions de Gemini</h4>
          <div className="flex flex-wrap gap-2">
            {suggestions.companies.map((c, i) => (
              <Button 
                key={i} 
                onClick={() => addTarget(c, 'Entreprise')}
                variant="outline"
                size="sm"
                className="bg-white"
              >
                + {c}
              </Button>
            ))}
            {suggestions.sectors.map((s, i) => (
               <span key={i} className="px-4 py-2 bg-indigo-100/50 rounded-xl text-xs font-bold text-indigo-700 border border-indigo-200">
                 Secteur: {s}
               </span>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex justify-between items-center px-4">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ma liste de cibles ({targets.length})</h4>
          <Button 
            onClick={() => addTarget()}
            size="sm"
            variant="primary"
            icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>}
          >
            Ajouter manuellement
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {targets.map((target) => (
            <div key={target.id} className="bg-slate-50 p-8 rounded-[40px] border border-slate-100 relative group animate-slideUp">
              <button 
                onClick={() => removeTarget(target.id)}
                className="absolute top-8 right-8 text-slate-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">Nom de l'entité</label>
                  <input 
                    placeholder="Ex: AFPA, L'Oréal, Startup X..."
                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold transition-all"
                    value={target.name}
                    onChange={(e) => updateTarget(target.id, 'name', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">Type de structure</label>
                  <select 
                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold transition-all h-[54px]"
                    value={target.type}
                    onChange={(e) => updateTarget(target.id, 'type', e.target.value as any)}
                  >
                    <option value="Entreprise">Entreprise</option>
                    <option value="Organisme de formation">Organisme de formation</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">Commentaires / Motivations</label>
                <textarea 
                  placeholder="Pourquoi ciblez-vous cette structure ?"
                  className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-600 h-28 resize-none transition-all"
                  value={target.comment}
                  onChange={(e) => updateTarget(target.id, 'comment', e.target.value)}
                />
              </div>
            </div>
          ))}

          {targets.length === 0 && (
            <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[48px] bg-slate-50/50">
              <p className="text-slate-400 font-bold italic">Utilisez le bouton IA ou ajoutez manuellement vos premières cibles.</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-12 flex flex-col md:flex-row gap-4 border-t border-slate-50 pt-10">
        <Button 
          onClick={handleSave}
          className="grow"
          size="lg"
          variant="dark"
        >
          Valider mon ciblage expert
        </Button>
      </div>
    </Card>
  );
};

export default TargetingTool;
