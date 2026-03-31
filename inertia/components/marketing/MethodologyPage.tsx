import { ArrowRight, CheckCircle2, ShieldCheck, Users } from 'lucide-react'
import { motion } from 'motion/react'
import React from 'react'
import PublicLayout from '../layout/PublicLayout'
import AppLink from '../ui/AppLink'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Logo from '../ui/Logo'

interface MethodologyPageProps {
  onEnterApp: () => void
  onBackToHome?: () => void
}

export default function MethodologyPage({ onEnterApp, onBackToHome }: MethodologyPageProps) {
  return (
    <PublicLayout
      headerProps={{
        onLogoClick: onBackToHome ?? (() => {}),
        showAction: true,
        actionLabel: 'Accès Expert',
        onActionClick: onEnterApp,
      }}
      className="pb-24"
    >
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="space-y-8"
          >
            <div className="flex justify-center">
              <Badge variant="slate">Méthodologie • Rigueur & accompagnement</Badge>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-[0.95] text-brand-navy">
              Une méthode d&apos;accompagnement <br />
              <span className="text-brand-sage italic">scientifique</span>, pilotée par l&apos;humain.
            </h1>

            <p className="text-lg md:text-xl text-brand-navy/60 font-medium leading-relaxed max-w-3xl mx-auto">
              France Transition Carrière structure le bilan autour d&apos;outils issus des sciences
              comportementales et de l&apos;entretien, avec une IA utilisée comme copilote de synthèse
              (pas comme juge). L&apos;objectif: réduire les biais, augmenter la qualité, et rendre le
              travail du conseiller plus fluide et traçable.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={onEnterApp}
              size="lg"
              className="w-full sm:w-auto px-10 py-6 bg-brand-navy text-white hover:bg-brand-navy/90 shadow-xl shadow-brand-navy/10 group"
            >
              Accès Expert
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>

            {onBackToHome && (
              <button
                type="button"
                onClick={onBackToHome}
                className="w-full sm:w-auto px-10 py-6 text-brand-navy font-bold hover:bg-brand-navy/5 rounded-2xl transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                Retour à l&apos;accueil
              </button>
            )}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-6 py-20 bg-white border-y border-brand-navy/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div className="space-y-8">
            <div className="space-y-3">
              <Badge variant="slate">Cadre scientifique (références légères)</Badge>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-brand-navy leading-tight">
                Standardiser, trianguler, limiter les biais.
              </h2>
              <p className="text-brand-navy/60 font-medium leading-relaxed">
                La méthode combine questionnaires structurés, verbalisation guidée et synthèse
                actionnable. Le cadre vise la cohérence interne, la comparabilité, et une restitution
                utile à la décision.
              </p>
            </div>

            <ul className="space-y-6">
              <Bullet
                title="Psychométrie & validité (usage prudent)"
                desc="Les outils servent de repères: on cherche des tendances, pas des étiquettes. Les résultats sont contextualisés en entretien."
              />
              <Bullet
                title="Réduction des biais de désirabilité"
                desc="Certaines séquences privilégient la comparaison (choix forcés) et des formulations qui limitent les réponses ‘socialement attendues’."
              />
              <Bullet
                title="Triangulation des signaux"
                desc="On croise valeurs, motivations, comportements et expériences concrètes pour éviter une décision basée sur un seul indicateur."
              />
            </ul>
          </div>

          <div className="bg-brand-ivory/50 border border-brand-navy/5 rounded-[40px] p-10 space-y-8">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-brand-navy/40">
                  Principes de restitution
                </p>
                <p className="text-lg font-bold text-brand-navy">Clarté, nuance, action</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card
                icon={<CheckCircle2 className="text-brand-sage" size={20} />}
                title="Hypothèses explicites"
                desc="Les synthèses séparent faits observés, interprétations et recommandations."
              />
              <Card
                icon={<Users className="text-brand-terracotta" size={20} />}
                title="Décision humaine"
                desc="Le conseiller garde la main sur le sens, le rythme et la conclusion."
              />
              <Card
                icon={<ShieldCheck className="text-brand-navy" size={20} />}
                title="Confidentialité"
                desc="Conception orientée RGPD et minimisation: utile au suivi, sans collecte superflue."
              />
              <Card
                icon={<CheckCircle2 className="text-brand-sage" size={20} />}
                title="Traçabilité"
                desc="Chaque étape produit des éléments réutilisables en restitution et en plan d’action."
              />
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div className="space-y-8">
              <Badge variant="slate">Pour le conseiller</Badge>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-brand-navy leading-tight">
                Un accompagnement plus fluide, sans perdre la nuance.
              </h2>
              <p className="text-brand-navy/60 font-medium leading-relaxed">
                La plateforme n&apos;automatise pas la relation. Elle standardise la mécanique (étapes,
                supports, restitutions) pour libérer du temps d&apos;écoute et améliorer la qualité de
                sortie.
              </p>
            </div>

            <div className="space-y-6">
              <Step
                label="Avant"
                title="Préparer les séances"
                desc="Cadre clair, progression par étapes, supports prêts à l’emploi: le conseiller entre en séance avec une structure, pas une page blanche."
              />
              <Step
                label="Pendant"
                title="Conduire l’entretien"
                desc="Questions guidées, relances, et consolidation des informations: l’outil aide à rester sur les objectifs sans rigidifier l’échange."
              />
              <Step
                label="Après"
                title="Synthétiser et restituer"
                desc="Synthèses structurées et actionnables, avec un fil logique et des éléments directement réutilisables dans le plan d’action."
              />
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-24 bg-white border-y border-brand-navy/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div className="space-y-6">
            <Badge variant="slate">Éthique & limites</Badge>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-brand-navy leading-tight">
              L&apos;IA comme copilote, pas comme verdict.
            </h2>
            <p className="text-brand-navy/60 font-medium leading-relaxed">
              La valeur vient de l&apos;alliance: outils structurés + expertise du conseiller + synthèse
              accélérée. La page “méthodologie” n&apos;est pas une promesse d&apos;infaillibilité, mais un
              cadre de qualité et de transparence.
            </p>
          </div>

          <div className="bg-brand-ivory/40 border border-brand-navy/5 rounded-[40px] p-10 space-y-6">
            <Bullet
              title="Transparence"
              desc="Les résultats sont expliqués, discutés et contextualisés, sans ‘boîte noire’ imposée."
            />
            <Bullet
              title="Sûreté"
              desc="Gestion des données et droits d’accès alignés sur les usages cabinet (accès contrôlés, traçabilité)."
            />
            <Bullet
              title="Responsabilité"
              desc="Les recommandations restent des propositions: le conseiller arbitre avec la personne accompagnée."
            />
          </div>
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="max-w-5xl mx-auto bg-brand-navy rounded-[64px] p-12 md:p-16 text-center space-y-8 shadow-[0_50px_100px_-20px_rgba(30,47,63,0.35)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_left,var(--tw-gradient-stops))] from-brand-sage/20 via-transparent to-transparent opacity-50" />
          <div className="relative z-10 space-y-8">
            <h3 className="text-4xl md:text-5xl font-bold text-white tracking-tighter leading-none">
              Prêt à structurer vos accompagnements ?
            </h3>
            <p className="text-white/60 text-lg font-medium max-w-2xl mx-auto">
              Transformez vos bilans en parcours premium: rigueur, clarté, et livrables actionnables
              pour vos clients.
            </p>
            <div className="flex justify-center">
              <Button
                onClick={onEnterApp}
                size="lg"
                className="group bg-brand-sage text-white hover:bg-brand-sage/90 hover:scale-[1.03] hover:-translate-y-1 border-none px-14 py-7 text-lg transition-all duration-500 shadow-2xl shadow-brand-sage/20"
              >
                Accès Expert
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </section>

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
                  <AppLink
                    href="/methodologie"
                    className="text-sm font-bold text-brand-navy/60 hover:text-brand-sage transition-colors"
                  >
                    Méthodologie
                  </AppLink>
                </li>
                <li>
                  <AppLink
                    href="/"
                    className="text-sm font-bold text-brand-navy/60 hover:text-brand-sage transition-colors"
                  >
                    Accueil
                  </AppLink>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onEnterApp}
                    className="text-sm font-bold text-brand-navy/60 hover:text-brand-sage transition-colors cursor-pointer disabled:cursor-not-allowed"
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
              France Transition Carrière &copy; 2026 • Rigueur & accompagnement
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

function Bullet({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl bg-brand-sage/10 flex items-center justify-center text-brand-sage shrink-0">
        <CheckCircle2 size={20} />
      </div>
      <div className="space-y-1">
        <h4 className="font-bold text-brand-navy">{title}</h4>
        <p className="text-sm text-brand-navy/55 font-medium leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

function Step({ label, title, desc }: { label: string; title: string; desc: string }) {
  return (
    <div className="p-8 bg-brand-ivory/50 rounded-[32px] border border-brand-navy/5 hover:border-brand-sage/30 hover:bg-white transition-all duration-500">
      <p className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/40">{label}</p>
      <h3 className="mt-2 text-xl font-bold text-brand-navy">{title}</h3>
      <p className="mt-3 text-sm text-brand-navy/55 font-medium leading-relaxed">{desc}</p>
    </div>
  )
}

function Card({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode
  title: string
  desc: string
}) {
  return (
    <div className="p-6 bg-white rounded-[28px] border border-brand-navy/5 hover:border-brand-sage/30 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-brand-ivory/60 flex items-center justify-center">
          {icon}
        </div>
        <h4 className="font-bold text-brand-navy">{title}</h4>
      </div>
      <p className="mt-3 text-sm text-brand-navy/55 font-medium leading-relaxed">{desc}</p>
    </div>
  )
}
