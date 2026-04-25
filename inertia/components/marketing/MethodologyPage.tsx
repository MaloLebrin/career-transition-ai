import { ArrowRight, CheckCircle2, ShieldCheck, Users } from 'lucide-react'
import { motion } from 'motion/react'
import React from 'react'
import PublicLayout from '../layout/PublicLayout'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import { ContactDemoForm } from './ContactDemoForm'

interface MethodologyPageProps {
  onEnterApp: () => void
  onBackToHome?: () => void
  onOffer?: () => void
  onTarifs?: () => void
}

export default function MethodologyPage({ onEnterApp, onBackToHome, onOffer, onTarifs }: MethodologyPageProps) {
  return (
    <PublicLayout
      headerProps={{
        onOfferClick: onOffer,
        onTarifsClick: onTarifs,
        showAction: true,
        actionLabel: 'Accès Expert',
        onActionClick: onEnterApp,
      }}
      footerProps={{
        variant: 'marketing',
        onEnterApp,
        footerLine: 'France Transition Carrière © 2026 • Rigueur & accompagnement',
      }}
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
              <Badge variant="slate">Cadre scientifique</Badge>
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

      <section id="contact" className="px-6 py-24 bg-brand-ivory/30 border-y border-brand-navy/5">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div className="space-y-6">
            <Badge variant="slate">Demande de démo</Badge>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-brand-navy leading-tight">
              Intéressé par la méthodologie ?
            </h2>
            <p className="text-brand-navy/60 font-medium leading-relaxed">
              Demandez une démo ou posez vos questions : nous revenons vers vous sous 48h ouvrées.
            </p>
          </div>
          <div className="bg-white border border-brand-navy/5 rounded-[40px] p-10">
            <ContactDemoForm variant="contact" title="" description="" />
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
