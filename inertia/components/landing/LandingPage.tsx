
import React from 'react';
import PublicLayout from '../layout/PublicLayout';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Card from '../ui/Card';

interface LandingPageProps {
  onEnterApp: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <PublicLayout
      headerProps={{
        onLogoClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
        onMethodologyClick: () => scrollToSection('methodology'),
        onAiClick: () => scrollToSection('ai-engine'),
        onActionClick: onEnterApp,
      }}
    >
      {/* --- HERO SECTION --- */}
      <section className="relative pt-44 pb-32 px-6 overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1000px] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-sage/5 via-brand-ivory to-transparent -z-10"></div>
        
        <div className="max-w-6xl mx-auto text-center space-y-12 animate-fadeIn">
          <div className="flex justify-center">
            <Badge variant="slate">La plateforme experte des Cabinets de Transition</Badge>
          </div>
          <h1 className="text-5xl md:text-[100px] font-bold tracking-tighter leading-[0.85] text-brand-navy">
            L'IA qui structure le <br/>
            <span className="text-brand-sage italic">Potentiel Humain.</span>
          </h1>
          <p className="text-xl md:text-2xl text-brand-navy/60 max-w-3xl mx-auto leading-relaxed font-medium">
            Fusionnez la rigueur des sciences comportementales avec la puissance d'analyse de Gemini pour des bilans de compétences structurants et premium.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-6">
            <Button 
              onClick={onEnterApp} 
              size="lg" 
              className="w-full md:w-auto px-16 shadow-2xl shadow-brand-sage/10 text-lg"
            >
              Lancer le Portail
            </Button>
            <Button variant="secondary" size="lg" className="w-full md:w-auto">Consulter la Méthodologie</Button>
          </div>
        </div>

        {/* Product Visual Showcase - UI Mockup */}
        <div className="mt-28 max-w-6xl mx-auto relative group">
          <div className="absolute inset-0 bg-brand-sage/5 blur-[120px] rounded-full scale-75 group-hover:scale-90 transition-transform duration-1000"></div>
          
          <div className="relative bg-brand-navy rounded-[48px] p-2 shadow-[0_50px_100px_-20px_rgba(10,15,30,0.3)] border border-white/10 overflow-hidden">
             {/* Browser Header */}
             <div className="h-10 bg-white/5 flex items-center px-6 space-x-2 border-b border-white/5">
                <div className="flex space-x-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-white/20"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-white/20"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-white/20"></div>
                </div>
                <div className="grow flex justify-center"><div className="w-48 h-3 bg-white/10 rounded-full"></div></div>
             </div>
             
             {/* App Content Simulation */}
             <div className="bg-brand-ivory grid grid-cols-12 min-h-[600px]">
                {/* Sidebar */}
                <div className="col-span-3 border-r border-brand-navy/5 p-6 space-y-4 hidden md:block bg-white">
                  <div className="w-10 h-10 bg-brand-sage rounded-xl mb-10"></div>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className={`h-8 rounded-lg ${i === 1 ? 'bg-brand-sage/10 w-full' : 'bg-brand-navy/5 w-3/4'}`}></div>
                  ))}
                </div>
                {/* Main Content Area */}
                <div className="col-span-12 md:col-span-9 p-8 space-y-8">
                  <div className="flex justify-between items-center">
                    <div className="h-8 w-48 bg-brand-navy/5 rounded-lg"></div>
                    <div className="h-10 w-32 bg-brand-sage rounded-xl"></div>
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    {[1,2,3].map(i => (
                      <div key={i} className="bg-white p-6 rounded-3xl border border-brand-navy/5 shadow-sm h-32">
                        <div className="h-3 w-12 bg-brand-navy/5 rounded-full mb-3"></div>
                        <div className="h-6 w-24 bg-brand-navy rounded-md"></div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white p-8 rounded-[32px] border border-brand-navy/5 shadow-sm h-64 flex flex-col justify-end overflow-hidden">
                    <div className="flex items-end gap-2 h-full">
                       {[40, 70, 45, 90, 65, 80, 50, 85].map((h, i) => (
                         <div key={i} className="grow bg-brand-sage/20 rounded-t-lg transition-all group-hover:bg-brand-sage" style={{ height: `${h}%` }}></div>
                       ))}
                    </div>
                  </div>
                </div>
             </div>

             {/* Floating AI Insight Card */}
             <div className="absolute top-1/4 -right-10 w-80 bg-white p-8 rounded-[40px] shadow-2xl border border-brand-navy/5 animate-slideUp hidden lg:block">
               <div className="flex items-center space-x-3 mb-6">
                 <div className="w-10 h-10 rounded-2xl bg-brand-terracotta flex items-center justify-center text-white shadow-lg shadow-brand-terracotta/20">
                    <svg className="w-6 h-6 stroke-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                 </div>
                 <div className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/40">Analyse Gemini 3 Pro</div>
               </div>
               <p className="text-sm font-bold text-brand-navy leading-relaxed italic">
                 "Le candidat présente une synergie rare entre agilité technique et leadership naturel (Score 94%)."
               </p>
             </div>
          </div>
        </div>

      </section>

      <section id="methodology" className="py-32 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24 space-y-4">
            <Badge variant="slate">Rigueur Scientifique</Badge>
            <h2 className="text-5xl md:text-6xl font-bold tracking-tight text-brand-navy leading-tight">
              Plus qu'un outil, <br className="hidden md:block"/> une méthode structurée.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <MethodCard 
              icon="📊" 
              title="Matrice de Pairage" 
              desc="Algorithme de comparaison forcée éliminant les biais de désirabilité sociale pour révéler les motivations profondes."
              color="sage"
            />
            <MethodCard 
              icon="🎯" 
              title="Profil DISC IA" 
              desc="Diagnostic comportemental haute fidélité pour identifier les environnements de travail porteurs."
              color="terracotta"
            />
            <MethodCard 
              icon="🌍" 
              title="Valeurs de Schwartz" 
              desc="Alignement sur les 10 valeurs universelles pour garantir la pérennité de la transition."
              color="sage"
            />
            <MethodCard 
              icon="🔄" 
              title="Systémie du Rebond" 
              desc="Approche globale connectant compétences, besoins et contraintes pour un projet sans faille."
              color="navy"
            />
          </div>
        </div>
      </section>

      {/* --- AI ENGINE SECTION --- */}
      <section id="ai-engine" className="py-40 px-6 bg-brand-navy text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-sage/10 blur-[150px] rounded-full -mr-96 -mt-96"></div>
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <div className="space-y-12 relative z-10">
            <Badge variant="cyan">Intelligence Artificielle de Pointe</Badge>
            <h2 className="text-5xl md:text-7xl font-bold tracking-tighter leading-[0.95]">
              Gemini : <br/>
              L'IA qui comprend <br/>
              le "Pourquoi".
            </h2>
            <p className="text-xl text-white/60 font-medium leading-relaxed">
              Contrairement aux tests classiques qui se limitent à des scores, notre moteur analyse la sémantique de chaque réponse pour détecter la cohérence et l'enthousiasme.
            </p>
            <div className="grid grid-cols-2 gap-8">
               <div className="space-y-2">
                 <div className="text-4xl font-bold text-white">99.2%</div>
                 <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Précision Sémantique</div>
               </div>
               <div className="space-y-2">
                 <div className="text-4xl font-bold text-white">-65%</div>
                 <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Temps de Synthèse</div>
               </div>
            </div>
          </div>

          <div className="relative group">
             <div className="absolute inset-0 bg-brand-sage/20 blur-[120px] rounded-full scale-110"></div>
             <div className="bg-white/5 p-1 rounded-[64px] backdrop-blur-3xl border border-white/10 relative overflow-hidden">
                <div className="p-12 space-y-8">
                   <div className="flex items-center space-x-4">
                      <div className="w-3 h-3 rounded-full bg-brand-terracotta"></div>
                      <div className="w-3 h-3 rounded-full bg-brand-sage"></div>
                      <div className="w-3 h-3 rounded-full bg-brand-ivory/20"></div>
                   </div>
                   <div className="space-y-6">
                      <div className="h-4 w-3/4 bg-white/10 rounded-full animate-pulse"></div>
                      <div className="h-4 w-1/2 bg-white/10 rounded-full animate-pulse [animation-delay:200ms]"></div>
                      <div className="h-20 w-full bg-brand-sage/10 border border-brand-sage/20 rounded-3xl p-6">
                         <p className="text-xs font-mono text-brand-sage">
                           {">"} ANALYSING MOTIVATION_MATRIX...<br/>
                           {">"} CORRELATION DETECTED: AUTO_MANAGEMENT + RSE_VALUES<br/>
                           {">"} GENERATING SYNERGY_REPORT...
                         </p>
                      </div>
                      <div className="h-4 w-5/6 bg-white/10 rounded-full animate-pulse [animation-delay:400ms]"></div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>


      {/* --- TRUST SECTION --- */}
      <section className="py-24 border-b border-brand-navy/5">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-[10px] font-bold text-brand-navy/40 uppercase tracking-[0.4em] mb-12">Ils nous font confiance pour leurs transitions</p>
          <div className="flex flex-wrap justify-center items-center gap-16 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
             <span className="text-2xl font-bold tracking-tighter">AFPA</span>
             <span className="text-2xl font-bold tracking-tighter">TRANSITION PRO</span>
             <span className="text-2xl font-bold tracking-tighter">POLE EMPLOI</span>
             <span className="text-2xl font-bold tracking-tighter">APEC</span>
             <span className="text-2xl font-bold tracking-tighter italic text-brand-sage">CABINETS EXPERTS</span>
          </div>
        </div>
      </section>

      {/* --- FINAL CTA --- */}
      <section className="py-40 px-6 relative">
        <div className="max-w-4xl mx-auto bg-brand-navy rounded-[64px] p-16 md:p-24 text-center space-y-12 shadow-[0_50px_100px_-20px_rgba(10,15,30,0.4)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-brand-sage/20 via-transparent to-transparent opacity-50"></div>
          <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tighter leading-none relative z-10">
            Prêt à passer <br/> à la vitesse supérieure ?
          </h2>
          <p className="text-white/60 text-xl font-medium max-w-xl mx-auto relative z-10">
            Rejoignez les coachs et experts qui ont déjà automatisé leurs bilans avec FTC Portal.
          </p>
          <div className="relative z-10 flex justify-center">
            <Button 
              onClick={onEnterApp} 
              size="lg" 
              className="group bg-brand-sage text-white hover:bg-brand-sage/90 hover:scale-[1.05] hover:-translate-y-1.5 border-none px-20 py-7 text-lg transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-xl shadow-brand-sage/20 relative"
            >
              <span className="relative z-10">Accéder au Portail</span>
            </Button>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/20">
            Sécurisé • RGPD • Sans Engagement
          </p>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-24 px-6 border-t border-brand-navy/5 bg-brand-ivory">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-brand-navy rounded-2xl flex items-center justify-center text-white shadow-xl">
              <svg className="w-6 h-6 stroke-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-2xl font-bold tracking-tighter text-brand-navy">FTC <span className="text-brand-sage">Portal</span></span>
          </div>
          <div className="text-[11px] font-bold text-brand-navy/40 uppercase tracking-[0.3em]">
            France Transition Carrière &copy; 2026 • Design High-Fidelity
          </div>
          <div className="flex space-x-10">
            <a href="#" className="text-[10px] font-bold uppercase text-brand-navy/40 hover:text-brand-sage transition-colors">Mentions Légales</a>
            <a href="#" className="text-[10px] font-bold uppercase text-brand-navy/40 hover:text-brand-sage transition-colors">RGPD</a>
            <a href="#" className="text-[10px] font-bold uppercase text-brand-navy/40 hover:text-brand-sage transition-colors">Support</a>
          </div>
        </div>
      </footer>

    </PublicLayout>
  );
};

const MethodCard: React.FC<{ icon: string, title: string, desc: string, color: string }> = ({ icon, title, desc, color }) => {
  const colors = {
    sage: "bg-brand-sage/10 text-brand-sage border-brand-sage/20",
    terracotta: "bg-brand-terracotta/10 text-brand-terracotta border-brand-terracotta/20",
    navy: "bg-brand-navy/10 text-brand-navy border-brand-navy/20",
    ivory: "bg-brand-ivory text-brand-navy/40 border-brand-navy/10"
  };

  return (
    <Card className="p-10 space-y-6 hover:scale-[1.05] transition-all duration-500 cursor-default group border-brand-navy/5 shadow-sm hover:shadow-2xl hover:border-brand-sage/30">
      <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center text-3xl shadow-lg shadow-brand-navy/5 ${colors[color as keyof typeof colors]}`}>
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-brand-navy leading-none">{title}</h3>
      <p className="text-brand-navy/60 font-medium leading-relaxed text-sm">{desc}</p>
    </Card>
  );
};


export default LandingPage;
