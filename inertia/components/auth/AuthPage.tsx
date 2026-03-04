
import React, { useState } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import PublicHeader from '../layout/PublicHeader';

interface AuthPageProps {
  onAuthSuccess: () => void;
  onBackToLanding: () => void;
  login: (email: string, password: string) => Promise<any>;
  register: (email: string, password: string, name: string, role: 'advisor' | 'employee') => Promise<any>;
  error: string | null;
}

const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess, onBackToLanding, login, register, error }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'employee' as 'advisor' | 'employee'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (mode === 'login') {
        await login(formData.email, formData.password);
      } else {
        await register(formData.email, formData.password, formData.name, formData.role);
      }
      onAuthSuccess();
    } catch (err) {
      // Erreur gérée par le hook et affichée via la prop error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-ivory flex flex-col lg:flex-row overflow-hidden">
      <PublicHeader onLogoClick={onBackToLanding} showAction={false} />

      {/* Côté Gauche - Visuel & Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-navy relative items-center justify-center p-20 overflow-hidden pt-32">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-sage/10 blur-[120px] rounded-full -mr-96 -mt-96"></div>
        
        <div className="relative z-10 max-w-lg space-y-12">
          <div className="space-y-6">
            <h1 className="text-5xl font-bold text-white leading-tight tracking-tighter">
              {mode === 'login' ? 'Heureux de vous revoir.' : 'Commencez votre nouvelle étape.'}
            </h1>
            <p className="text-brand-ivory/40 text-lg font-medium leading-relaxed">
              Accédez à vos diagnostics, suivez vos progrès et pilotez votre transition avec l'appui de l'IA.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-8">
            <div className="p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
              <div className="text-brand-sage font-bold text-2xl mb-1">2.5k+</div>
              <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Talents Accompagnés</div>
            </div>
            <div className="p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
              <div className="text-brand-terracotta font-bold text-2xl mb-1">98%</div>
              <div className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Taux de Satisfaction</div>
            </div>
          </div>
        </div>
      </div>

      {/* Côté Droit - Formulaire */}
      <div className="flex-grow flex items-center justify-center p-6 md:p-12 lg:p-24 relative pt-32 lg:pt-32">
        <Card className="w-full max-w-md border-none shadow-none bg-transparent lg:bg-white lg:p-12 lg:shadow-2xl lg:shadow-brand-navy/5 lg:border lg:border-brand-navy/5">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-brand-navy tracking-tight mb-2">
              {mode === 'login' ? 'Connexion' : 'Création de compte'}
            </h2>
            <p className="text-brand-navy/40 font-medium">
              {mode === 'login' ? 'Saisissez vos identifiants pour continuer.' : 'Remplissez les champs pour créer votre espace.'}
            </p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start space-x-3 animate-shake">
              <svg className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-xs font-bold text-rose-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === 'register' && (
              <Input 
                label="Nom complet" 
                placeholder="Jean Dupont" 
                required
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            )}
            
            <Input 
              label="Email" 
              type="email" 
              placeholder="votre@email.fr" 
              required
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />

            <Input 
              label="Mot de passe" 
              type="password" 
              placeholder="••••••••" 
              required
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
            />

            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest px-2">Type de compte</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, role: 'employee'})}
                    className={`py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest border-2 transition-all active:scale-95 ${formData.role === 'employee' ? 'bg-brand-sage/10 border-brand-sage text-brand-sage' : 'bg-white border-brand-navy/5 text-brand-navy/20'}`}
                  >
                    Salarié
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, role: 'advisor'})}
                    className={`py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest border-2 transition-all active:scale-95 ${formData.role === 'advisor' ? 'bg-brand-sage/10 border-brand-sage text-brand-sage' : 'bg-white border-brand-navy/5 text-brand-navy/20'}`}
                  >
                    Conseiller
                  </button>
                </div>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              size="lg" 
              isLoading={isLoading}
            >
              {mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
            </Button>
          </form>

          <div className="mt-10 pt-8 border-t border-brand-navy/5 text-center">
            <p className="text-sm text-brand-navy/60 font-medium">
              {mode === 'login' ? "Vous n'avez pas encore de compte ?" : "Vous avez déjà un compte ?"}
              <button 
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="ml-2 text-brand-sage font-bold uppercase text-[10px] tracking-widest hover:underline"
              >
                {mode === 'login' ? "S'inscrire gratuitement" : "Se connecter"}
              </button>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;
