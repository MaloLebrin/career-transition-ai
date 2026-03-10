import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Compass,
  Cpu,
  ShieldCheck,
  Target,
  Users,
  Zap
} from 'lucide-react'
import { motion, useScroll, useTransform } from 'motion/react'
import React from 'react'
import { AiAnalisys, Appointnement, Certification, CoachFeedback, Disc, Matching, Purposes, Skills, SoftSkills } from '~/components/landing/floating-popups'
import PublicLayout from '../layout/PublicLayout'
import AppLink from '../ui/AppLink'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Logo from '../ui/Logo'

interface LandingPageProps {
  onEnterApp: () => void
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {
  const { scrollYProgress } = useScroll()
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -200])
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -500])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

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
      <section className="relative pt-32 pb-64 overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden">
          <motion.div
            style={{ y: y1 }}
            className="absolute -top-20 -right-20 w-[600px] h-[600px] bg-brand-sage/10 rounded-full blur-[120px]"
          />
          <motion.div
            style={{ y: y2 }}
            className="absolute top-1/2 -left-40 w-[800px] h-[800px] bg-brand-terracotta/5 rounded-full blur-[150px]"
          />
        </div>

        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="space-y-8 flex flex-col items-center"
          >
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-navy/5 border border-brand-navy/10">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-sage opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-sage" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/60">
                Disponible pour les Cabinets Experts
              </span>
            </div>

            <h1 className="text-6xl md:text-[120px] font-bold tracking-tighter leading-[0.85] text-brand-navy">
              L&apos;IA qui structure le <br />
              <span className="text-brand-sage italic">Potentiel Travail.</span>
            </h1>

            <p className="text-xl md:text-2xl text-brand-navy/60 max-w-3xl leading-relaxed font-medium">
              France Transition Travail fusionne la rigueur des sciences comportementales avec la
              puissance d&apos;analyse de Gemini pour des bilans de compétences structurants et
              premium.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button
                onClick={onEnterApp}
                size="lg"
                className="w-full sm:w-auto px-10 py-6 bg-brand-navy text-white hover:bg-brand-navy/90 shadow-xl shadow-brand-navy/10 group"
              >
                Lancer le Portail
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <button
                type="button"
                onClick={() => scrollToSection('methodology')}
                className="w-full sm:w-auto px-10 py-6 text-brand-navy font-bold hover:bg-brand-navy/5 rounded-2xl transition-colors"
              >
                Découvrir la méthode
              </button>
            </div>

            <div className="flex items-center space-x-8 pt-8 border-t border-brand-navy/5">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    // eslint-disable-next-line react/no-array-index-key
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-brand-ivory bg-brand-sage/20 overflow-hidden"
                  >
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`}
                      alt="user"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs font-bold text-brand-navy/40 uppercase tracking-widest text-left">
                Utilisé par +50 cabinets <br /> de transition en France
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="relative mt-24 w-full max-w-5xl perspective-1000"
          >
            {/* App Preview Mockup */}
            <div className="relative bg-white rounded-[40px] p-2 shadow-[0_50px_100px_-20px_rgba(30,47,63,0.2)] border border-brand-navy/5 overflow-hidden">
              <div className="h-8 bg-brand-ivory/50 flex items-center px-6 space-x-2 border-b border-brand-navy/5">
                <div className="flex space-x-1.5">
                  <div className="w-2 h-2 rounded-full bg-brand-navy/10" />
                  <div className="w-2 h-2 rounded-full bg-brand-navy/10" />
                  <div className="w-2 h-2 rounded-full bg-brand-navy/10" />
                </div>
              </div>

              <div className="bg-white grid grid-cols-12 min-h-[500px]">
                <div className="col-span-3 border-r border-brand-navy/5 p-6 space-y-6 hidden md:block">
                  <Logo size="sm" />
                  <div className="space-y-3">
                    <div className="h-2 w-full bg-brand-navy/5 rounded-full" />
                    <div className="h-2 w-2/3 bg-brand-navy/5 rounded-full" />
                    <div className="h-2 w-3/4 bg-brand-sage/20 rounded-full" />
                  </div>
                </div>
                <div className="col-span-12 md:col-span-9 p-8 space-y-8 text-left">
                  <div className="flex justify-between items-center">
                    <div className="h-6 w-32 bg-brand-navy/5 rounded-lg" />
                    <div className="h-8 w-8 rounded-full bg-brand-sage/10" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="h-24 bg-brand-ivory/30 rounded-3xl border border-brand-navy/5 p-4">
                      <div className="h-2 w-8 bg-brand-navy/10 rounded-full mb-2" />
                      <div className="h-4 w-16 bg-brand-navy/20 rounded-md" />
                    </div>
                    <div className="h-24 bg-brand-ivory/30 rounded-3xl border border-brand-navy/5 p-4">
                      <div className="h-2 w-8 bg-brand-navy/10 rounded-full mb-2" />
                      <div className="h-4 w-16 bg-brand-sage/20 rounded-md" />
                    </div>
                  </div>
                  <div className="h-40 bg-brand-navy/5 rounded-[32px] p-6 flex items-end gap-2">
                    {[40, 70, 45, 90, 65, 80, 50, 85, 60, 75].map((h, i) => (
                      // eslint-disable-next-line react/no-array-index-key
                      <div
                        key={i}
                        className="grow bg-brand-sage/30 rounded-t-lg"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div className="h-4 w-32 bg-brand-navy/5 rounded-full" />
                    <div className="grid grid-cols-1 gap-3">
                      {[1, 2].map((i) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <div
                          key={i}
                          className="flex items-center justify-between p-4 bg-brand-ivory/20 rounded-2xl border border-brand-navy/5"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-brand-sage/10" />
                            <div className="space-y-1">
                              <div className="h-2 w-24 bg-brand-navy/10 rounded-full" />
                              <div className="h-2 w-16 bg-brand-navy/5 rounded-full" />
                            </div>
                          </div>
                          <div className="h-6 w-12 bg-brand-sage/10 rounded-lg" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Popups */}
            <AiAnalisys />
            <Purposes />
            <Matching />
            <Certification />
            <SoftSkills />
            <Disc />  
            <CoachFeedback />
            <Appointnement />
            <Skills />
          </motion.div>
        </div>
      </section>

      {/* --- TRUST LOGOS --- */}
      <section className="py-20 border-y border-brand-navy/5 bg-white/50">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-[10px] font-bold text-brand-navy/30 uppercase tracking-[0.4em] mb-12">
            Ils transforment des carrières avec nous
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-40 grayscale">
            <span className="text-xl font-black tracking-tighter">AFPA</span>
            <span className="text-xl font-black tracking-tighter">TRANSITION PRO</span>
            <span className="text-xl font-black tracking-tighter">POLE EMPLOI</span>
            <span className="text-xl font-black tracking-tighter">APEC</span>
            <span className="text-xl font-black tracking-tighter italic text-brand-sage">
              CABINETS EXPERTS
            </span>
          </div>
        </div>
      </section>

      {/* --- METHODOLOGY SECTION --- */}
      <section id="methodology" className="py-64 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div className="space-y-8">
              <Badge variant="slate">Rigueur Scientifique</Badge>
              <h2 className="text-5xl md:text-6xl font-bold tracking-tight text-brand-navy leading-tight">
                Plus qu&apos;un outil, <br className="hidden md:block" /> une méthode structurée.
              </h2>
              <p className="text-lg text-brand-navy/60 font-medium leading-relaxed">
                Nous avons digitalisé les meilleurs outils du bilan de compétences pour offrir une
                expérience fluide, structurante et hautement qualitative.
              </p>

              <div className="space-y-6 pt-4">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-sage/10 flex items-center justify-center text-brand-sage shrink-0">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-brand-navy">Zéro Biais Cognitif</h4>
                    <p className="text-sm text-brand-navy/50">
                      Algorithmes de comparaison forcée pour révéler les motivations réelles.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-sage/10 flex items-center justify-center text-brand-sage shrink-0">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-brand-navy">Conformité RGPD</h4>
                    <p className="text-sm text-brand-navy/50">
                      Données sécurisées et hébergées en Europe pour une confidentialité totale.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <FeatureCard
                icon={<BarChart3 className="text-brand-sage" />}
                title="Matrice de Pairage"
                desc="Élimine les biais de désirabilité sociale par comparaison forcée."
                delay={0.1}
                className="sm:col-span-2"
              />
              <FeatureCard
                icon={<Users className="text-brand-terracotta" />}
                title="Profil DISC"
                desc="Diagnostic comportemental haute fidélité."
                delay={0.2}
              />
              <FeatureCard
                icon={<Compass className="text-brand-navy" />}
                title="Valeurs"
                desc="Alignement sur les leviers universels."
                delay={0.3}
              />
              <FeatureCard
                icon={<Target className="text-brand-sage" />}
                title="Ciblage Stratégique"
                desc="Connecte compétences et opportunités réelles."
                delay={0.4}
                className="sm:col-span-2"
              />
            </div>
          </div>
        </div>
      </section>

      {/* --- AI ENGINE SECTION --- */}
      <section
        id="ai-engine"
        className="py-64 px-6 bg-brand-navy text-white relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-brand-sage/10 blur-[150px] rounded-full -mr-96 -mt-96 opacity-50" />
        <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-brand-terracotta/5 blur-[150px] rounded-full -ml-96 -mb-96 opacity-30" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-24 items-center relative z-10">
          <div className="space-y-12">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
              <Zap size={12} className="text-brand-sage" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">
                Propulsé par Gemini 3 Pro
              </span>
            </div>

            <h2 className="text-5xl md:text-7xl font-bold tracking-tighter leading-[0.95]">
              L&apos;IA qui comprend <br />
              le <span className="text-brand-sage italic">&quot;Pourquoi&quot;</span>.
            </h2>

            <p className="text-xl text-white/60 font-medium leading-relaxed max-w-xl">
              Contrairement aux tests classiques qui se limitent à des scores, notre moteur analyse
              la sémantique de chaque réponse pour détecter la cohérence et l&apos;enthousiasme.
            </p>

            <div className="grid grid-cols-2 gap-12 pt-8">
              <div className="space-y-2">
                <div className="text-5xl font-bold text-white">99.2%</div>
                <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  Précision Sémantique
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-5xl font-bold text-white">-65%</div>
                <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  Temps de Synthèse
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-brand-sage/20 blur-[120px] rounded-full scale-110" />
            <div className="bg-white/5 p-1 rounded-[48px] backdrop-blur-3xl border border-white/10 relative overflow-hidden">
              <div className="p-12 space-y-10">
                <div className="flex items-center space-x-4">
                  <div className="w-3 h-3 rounded-full bg-brand-terracotta" />
                  <div className="w-3 h-3 rounded-full bg-brand-sage" />
                  <div className="w-3 h-3 rounded-full bg-white/10" />
                </div>

                <div className="space-y-8">
                  <div className="space-y-3">
                    <div className="h-3 w-3/4 bg-white/10 rounded-full animate-pulse" />
                    <div className="h-3 w-1/2 bg-white/10 rounded-full animate-pulse [animation-delay:200ms]" />
                  </div>

                  <div className="bg-brand-sage/10 border border-brand-sage/20 rounded-3xl p-8 font-mono text-sm space-y-2">
                    <p className="text-brand-sage flex items-center">
                      <span className="mr-3 opacity-50">01</span>
                      <span className="animate-pulse">_</span> ANALYSING MOTIVATION_MATRIX...
                    </p>
                    <p className="text-brand-sage/80 flex items-center">
                      <span className="mr-3 opacity-50">02</span>
                      CORRELATION: AUTO_MANAGEMENT + RSE
                    </p>
                    <p className="text-white flex items-center">
                      <span className="mr-3 opacity-50">03</span>
                      GENERATING SYNERGY_REPORT...
                    </p>
                  </div>

                  <div className="flex items-center space-x-4 pt-4">
                    <div className="w-12 h-12 rounded-2xl bg-brand-sage/20 flex items-center justify-center text-brand-sage">
                      <Cpu size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text:white/40">
                        Statut du moteur
                      </p>
                      <p className="text-sm font-bold text-white">Analyse en temps réel active</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- FINAL CTA --- */}
      <section className="py-40 px-6 relative bg-brand-ivory">
        <div className="max-w-5xl mx-auto bg-brand-navy rounded-[64px] p-16 md:p-24 text-center space-y-12 shadow-[0_50px_100px_-20px_rgba(30,47,63,0.4)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_left,var(--tw-gradient-stops))] from-brand-sage/20 via-transparent to-transparent opacity-50" />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-8 relative z-10"
          >
            <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tighter leading-none">
              Prêt à passer <br /> à la vitesse supérieure ?
            </h2>
            <p className="text-white/60 text-xl font-medium max-w-xl mx-auto">
              Rejoignez les coachs et experts qui ont déjà automatisé leurs bilans avec France
              Transition Travail.
            </p>
            <div className="flex justify-center pt-6">
              <Button
                onClick={onEnterApp}
                size="lg"
                className="group bg-brand-sage text-white hover:bg-brand-sage/90 hover:scale-[1.05] hover:-translate-y-1.5 border-none px-20 py-7 text-lg transition-all duration-500 shadow-2xl shadow-brand-sage/20"
              >
                Accéder au Portail
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
            <div className="flex justify-center items-center space-x-8 pt-8">
              <div className="flex items-center space-x-2">
                <ShieldCheck size={16} className="text-brand-sage" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                  RGPD Compliant
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap size={16} className="text-brand-sage" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                  Setup Instantané
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-24 px-6 border-t border-brand-navy/5 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
            <div className="col-span-1 md:col-span-2 space-y-8">
              <Logo size="md" />
              <p className="text-brand-navy/50 max-w-sm leading-relaxed font-medium">
                Plateforme d&apos;accompagnement à la transition professionnelle, alliant expertise
                humaine et analyse qualitative par IA pour une clarté stratégique.
              </p>
            </div>
            <div className="space-y-6">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/40">
                Plateforme
              </h4>
              <ul className="space-y-4">
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection('methodology')}
                    className="text-sm font-bold text-brand-navy/60 hover:text-brand-sage transition-colors"
                  >
                    Méthodologie
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection('ai-engine')}
                    className="text-sm font-bold text-brand-navy/60 hover:text-brand-sage transition-colors"
                  >
                    Intelligence Artificielle
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onEnterApp}
                    className="text-sm font-bold text-brand-navy/60 hover:text-brand-sage transition-colors"
                  >
                    Accès Expert
                  </button>
                </li>
              </ul>
            </div>
            <div className="space-y-6">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/40">
                Légal
              </h4>
              <ul className="space-y-4">
                <li>
                  <AppLink
                    href="#"
                    className="text-sm font-bold text-brand-navy/60 hover:text-brand-sage transition-colors"
                  >
                    Mentions Légales
                  </AppLink>
                </li>
                <li>
                  <AppLink
                    href="#"
                    className="text-sm font-bold text-brand-navy/60 hover:text-brand-sage transition-colors"
                  >
                    RGPD
                  </AppLink>
                </li>
                <li>
                  <AppLink
                    href="#"
                    className="text-sm font-bold text-brand-navy/60 hover:text-brand-sage transition-colors"
                  >
                    Support
                  </AppLink>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-12 border-t border-brand-navy/5 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-[11px] font-bold text-brand-navy/30 uppercase tracking-[0.3em]">
              France Transition Travail &copy; 2026 • Design High-Fidelity
            </div>
            <div className="flex space-x-6">
              <div className="w-8 h-8 rounded-lg bg-brand-navy/5 flex items-center justify-center text-brand-navy/40 hover:text-brand-sage transition-colors cursor-pointer">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.761 0 5-2.239 5-5v-14c0-2.761-2.239-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </div>
              <div className="w-8 h-8 rounded-lg bg-brand-navy/5 flex items-center justify-center text-brand-navy/40 hover:text-brand-sage transition-colors cursor-pointer">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </PublicLayout>
  )
}

const FeatureCard: React.FC<{
  icon: React.ReactNode
  title: string
  desc: string
  delay: number
  className?: string
}> = ({ icon, title, desc, delay, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className={`p-8 bg-brand-ivory/50 rounded-[32px] border border-brand-navy/5 hover:border-brand-sage/30 hover:bg-white hover:shadow-2xl hover:shadow-brand-navy/5 transition-all duration-500 group ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-brand-navy mb-2">{title}</h3>
      <p className="text-sm text-brand-navy/50 font-medium leading-relaxed">{desc}</p>
    </motion.div>
  )
}

export default LandingPage
