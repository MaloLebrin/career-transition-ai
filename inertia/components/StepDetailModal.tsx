
import React from 'react';
import { SupportPlanStep, ExerciseResult, ExerciseType } from '../types';
import MotivationResultView from './MotivationResultView';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { MOTIVATIONS_LIST } from '../constants/motivations';
import Button from './ui/Button';
import Card from './ui/Card';
import Badge from './ui/Badge';

interface Props {
  step: SupportPlanStep;
  result?: ExerciseResult;
  onClose: () => void;
  userRole: 'advisor' | 'employee';
}

const StepDetailModal: React.FC<Props> = ({ step, result, onClose, userRole }) => {
  const renderResult = () => {
    if (!result) {
      return (
        <div className="py-20 text-center text-slate-400">
          <p className="font-medium italic">Aucun résultat disponible pour cette étape.</p>
        </div>
      );
    }

    switch (result.type) {
      case ExerciseType.SKILL_MAPPING:
        return (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-slate-900 p-10 rounded-[48px] text-white shadow-2xl mb-8 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
               <div className="relative z-10">
                 <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Poste analysé</div>
                 <div className="text-3xl font-black tracking-tight">{result.data.jobTitle}</div>
               </div>
            </div>
            <div className="bg-white border border-slate-100 rounded-[48px] shadow-sm overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="p-8 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest w-1/4">Mission</th>
                        <th className="p-8 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest w-1/4">Activité</th>
                        <th className="p-8 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest w-1/2">Preuve / Réalisation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {result.data.mapping.map((row: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-8 text-xs font-black text-slate-900 align-top">{row.mission}</td>
                          <td className="p-8 text-xs font-bold text-slate-500 align-top">{row.activity}</td>
                          <td className="p-8 text-xs font-medium text-slate-600 align-top italic">"{row.proof || "Non documenté"}"</td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
               </div>
            </div>
          </div>
        );
      case ExerciseType.MOTIVATION:
        return <MotivationResultView data={result.data} date={result.date} duration={result.duration} />;
      case ExerciseType.LIFE_CURVE:
        return (
          <div className="space-y-8 animate-fadeIn">
            <div className="h-[400px] bg-slate-50 p-8 rounded-[48px] border border-slate-100">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={result.data.points} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#64748b'}} />
                  <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#64748b'}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontWeight: 900}}
                    itemStyle={{color: '#6366f1'}}
                  />
                  <ReferenceLine y={5} stroke="#cbd5e1" strokeDasharray="5 5" />
                  <Line type="monotone" dataKey="satisfaction" stroke="#6366f1" strokeWidth={4} dot={{ r: 6, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(result.data.reflection || {}).map(([key, value]: [string, any]) => (
                <div key={key} className="p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{key}</div>
                  <div className="text-sm font-bold text-slate-700 leading-relaxed">{value}</div>
                </div>
              ))}
            </div>
          </div>
        );
      case ExerciseType.DISC:
        const discData = [
          { trait: 'D', value: result.data.D, full: 100 },
          { trait: 'I', value: result.data.I, full: 100 },
          { trait: 'S', value: result.data.S, full: 100 },
          { trait: 'C', value: result.data.C, full: 100 },
        ];
        return (
          <div className="flex justify-center h-[350px] bg-slate-50 rounded-[48px] p-8 border border-slate-100">
             <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={discData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="trait" tick={{fontSize: 14, fontWeight: 900, fill: '#1e293b'}} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} axisLine={false} tick={false} />
                <Radar
                  name="DISC"
                  dataKey="value"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        );
      case ExerciseType.CIRCLE_OF_CONTROL:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 bg-violet-50 rounded-[48px] border border-violet-100 shadow-sm">
              <h4 className="text-sm font-black text-violet-600 uppercase mb-6 flex items-center">
                <span className="w-2 h-2 bg-violet-500 rounded-full mr-2"></span>
                Sous contrôle
              </h4>
              <div className="flex flex-wrap gap-2">
                {result.data.inControl?.map((item: string, i: number) => (
                  <span key={i} className="text-[10px] bg-white px-4 py-2 rounded-xl border border-violet-100 font-black text-slate-700 uppercase tracking-widest">{item}</span>
                ))}
              </div>
            </div>
            <div className="p-8 bg-pink-50 rounded-[48px] border border-pink-100 shadow-sm">
              <h4 className="text-sm font-black text-pink-600 uppercase mb-6 flex items-center">
                <span className="w-2 h-2 bg-pink-500 rounded-full mr-2"></span>
                Hors contrôle
              </h4>
              <div className="flex flex-wrap gap-2">
                {result.data.outControl?.map((item: string, i: number) => (
                  <span key={i} className="text-[10px] bg-white px-4 py-2 rounded-xl border border-pink-100 font-black text-slate-700 uppercase tracking-widest">{item}</span>
                ))}
              </div>
            </div>
          </div>
        );
      default:
        return <pre className="text-xs bg-slate-50 p-6 rounded-[32px] overflow-auto border border-slate-100">{JSON.stringify(result.data, null, 2)}</pre>;
    }
  };

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
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>}
        />

        {/* 
          Zone de défilement interne. 
          Le padding est appliqué ici pour que le contenu respire mais ne touche pas les bords extrêmes lors du scroll.
        */}
        <div className="flex-grow overflow-y-auto custom-scrollbar p-12 md:p-16">
          <div className="mb-12 pr-10">
            <div className="flex items-center space-x-3 mb-4">
              <Badge variant={step.completed ? 'lime' : 'slate'}>
                {step.completed ? 'Étape Validée' : 'En attente'}
              </Badge>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Dossier #{step.id.substr(0, 4)}</span>
            </div>
            <h2 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">{step.title}</h2>
            <p className="text-slate-500 mt-4 text-lg font-medium">{step.description}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-8 space-y-12">
              <section className="space-y-6">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] px-2">Visualisation du Résultat</h3>
                {renderResult()}
              </section>

              {result?.qualitativeAnalysis && (
                <section className="space-y-4 pb-10">
                  <h3 className="text-[11px] font-black text-violet-600 uppercase tracking-[0.4em] px-2">Analyse Synthétique Gemini</h3>
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
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">Informations Session</h3>
                <div className="space-y-6">
                  <div>
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Échéance prévue</div>
                    <div className="text-base font-black text-slate-900">{step.dueDate}</div>
                  </div>
                  {result && (
                    <div>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Passage le</div>
                      <div className="text-base font-black text-slate-900">{result.date}</div>
                    </div>
                  )}
                  {result && (
                    <div>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Durée totale</div>
                      <div className="text-base font-black text-slate-900">{Math.floor(result.duration / 60)} min {result.duration % 60} s</div>
                    </div>
                  )}
                </div>
              </div>

              {userRole === 'advisor' && (
                <div className="bg-orange-50/50 p-8 rounded-[48px] border border-orange-100 shadow-sm">
                  <h3 className="text-[11px] font-black text-orange-600 uppercase tracking-[0.3em] mb-8">Notes Accompagnateur</h3>
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
  );
};

export default StepDetailModal;
