import { ArrowRight, BarChart3, CheckCircle2, ShieldCheck, Sparkles, Users } from 'lucide-react'
import { motion } from 'motion/react'
import React, { useMemo, useState } from 'react'
import PublicLayout from '../layout/PublicLayout'
import AppLink from '../ui/AppLink'
import Badge from '../ui/Badge'
import Button from '../ui/Button'

interface OfferPageProps {
  onEnterApp: () => void
  onBackToHome?: () => void
  onOffer?: () => void
  onTarifs?: () => void
  onMethodology?: () => void
}

export default function OfferPage({
  onEnterApp,
  onBackToHome,
  onOffer,
  onTarifs,
  onMethodology,
}: OfferPageProps) {
  const [demoName, setDemoName] = useState('')
  const [demoEmail, setDemoEmail] = useState('')
  const [demoOrg, setDemoOrg] = useState('')
  const [demoMessage, setDemoMessage] = useState('')

  const mailtoHref = useMemo(() => {
    const subject = encodeURIComponent('Demande de démo — France Transition Carrière')
    const body = encodeURIComponent(
      [
        `Nom: ${demoName || '-'}`,
        `Email: ${demoEmail || '-'}`,
        `Cabinet/Organisation: ${demoOrg || '-'}`,
        '',
        demoMessage || '',
      ].join('\n')
    )
    return `mailto:contact@francetransitioncarriere.fr?subject=${subject}&body=${body}`
  }, [demoEmail, demoMessage, demoName, demoOrg])

  return (
    <PublicLayout
      headerProps={{
        onLogoClick: onBackToHome ?? (() => {}),
        onActionClick: onEnterApp,
        actionLabel: 'Accès Expert',
        showAction: true,
        onOfferClick: onOffer,
        onTarifsClick: onTarifs,
        onMethodologyClick: onMethodology,
      }}
      footerProps={{
        variant: 'marketing',
        onEnterApp,
        footerLine: 'France Transition Carrière © 2026 • Offre cabinets',
      }}
    >
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="space-y-8"
            >
              <div className="flex items-center gap-3">
                <Badge variant="slate">Offre • Pour les cabinets</Badge>
              </div>

              <h1 className="text-5xl md:text-6xl font-bold tracking-tighter leading-[0.95] text-brand-navy">
                Un portail expert pour structurer vos bilans <br />
                <span className="text-brand-sage italic">sans perdre la nuance.</span>
              </h1>

              <p className="text-lg text-brand-navy/60 font-medium leading-relaxed">
                Standardisez votre méthode, améliorez la qualité des livrables et gagnez du temps sur
                la synthèse. L&apos;IA vous assiste comme copilote, le conseiller reste le décideur.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="#demo"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-10 py-6 rounded-2xl bg-brand-sage text-white font-bold hover:bg-brand-sage/90 transition-colors shadow-xl shadow-brand-sage/15"
                >
                  Demander une démo
                  <ArrowRight className="ml-2 w-5 h-5" />
                </a>
                <Button
                  onClick={onEnterApp}
                  size="lg"
                  className="w-full sm:w-auto px-10 py-6 bg-brand-navy text-white hover:bg-brand-navy/90 shadow-xl shadow-brand-navy/10 group"
                >
                  Accès Expert
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-2">
                <MiniProof icon={<ShieldCheck size={16} className="text-brand-sage" />} text="Approche RGPD (résumé + pages légales)" />
                <MiniProof icon={<Users size={16} className="text-brand-terracotta" />} text="Pensé pour les cabinets et conseillers" />
                <MiniProof icon={<Sparkles size={16} className="text-brand-navy" />} text="Rigueur + livrables actionnables" />
              </div>
            </motion.div>

            <div className="bg-white rounded-[40px] border border-brand-navy/5 shadow-[0_40px_90px_-35px_rgba(30,47,63,0.25)] overflow-hidden">
              <div className="p-8 border-b border-brand-navy/5 bg-brand-ivory/30">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/40">
                      Livrables structurés
                    </p>
                    <p className="text-lg font-bold text-brand-navy">Synthèse + plan d’action</p>
                  </div>
                </div>
              </div>
              <div className="p-8 space-y-5">
                <MockRow title="Profil & objectifs" value="Clairs, traçables, partagés" />
                <MockRow title="Outils" value="Valeurs, motivation, DISC, ciblage" />
                <MockRow title="Synthèse" value="Argumentée, nuancée, actionnable" />
                <MockRow title="Suivi" value="Progression par étapes, révisions" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 bg-white border-y border-brand-navy/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <OfferCard
              icon={<BarChart3 className="text-brand-sage" />}
              title="Qualité des livrables"
              desc="Une structure claire pour des restitutions premium: moins d’approximation, plus d’alignement."
            />
            <OfferCard
              icon={<CheckCircle2 className="text-brand-terracotta" />}
              title="Gain de temps"
              desc="Standardisation des étapes et synthèse assistée: vous passez plus de temps sur l’écoute."
            />
            <OfferCard
              icon={<ShieldCheck className="text-brand-navy" />}
              title="Traçabilité & conformité"
              desc="Des traces utiles au suivi cabinet et un cadre RGPD (à compléter par les pages légales)."
            />
          </div>
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div className="space-y-8">
            <Badge variant="slate">Ce que vous obtenez</Badge>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-brand-navy leading-tight">
              Une méthode cabinet, industrialisée proprement.
            </h2>
            <p className="text-brand-navy/60 font-medium leading-relaxed">
              Le produit structure votre accompagnement, sans le remplacer. Vous gardez la main sur
              le sens, le rythme et la restitution.
            </p>

            <ul className="space-y-6">
              <Bullet
                title="Parcours guidé par étapes"
                desc="Une progression claire, avec des points de passage et des livrables standardisés."
              />
              <Bullet
                title="Outils comportementaux intégrés"
                desc="Des supports structurés (valeurs, motivation, comportements) pour alimenter l’entretien et la décision."
              />
              <Bullet
                title="Synthèses actionnables"
                desc="Une restitution qui distingue faits, hypothèses et recommandations, pour construire un plan concret."
              />
            </ul>
          </div>

          <div className="bg-brand-ivory/50 border border-brand-navy/5 rounded-[40px] p-10 space-y-8">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-brand-navy leading-tight">
                L&apos;IA comme copilote, pas comme verdict.
              </h2>
            <div className="space-y-6">
              <Bullet
                title="IA = copilote"
                desc="La plateforme assiste l’analyse et la mise en forme, mais la décision reste humaine."
              />
              <Bullet
                title="Rigueur & limites"
                desc="On cherche des tendances, pas des étiquettes; le conseiller contextualise en entretien."
              />
              <Bullet
                title="Données maîtrisées"
                desc="Accès contrôlés et minimisation. Les pages légales seront le référentiel complet."
              />
            </div>

            <div className="pt-6 border-t border-brand-navy/5">
              <div className="flex flex-wrap gap-4 text-sm font-bold">
                <AppLink href="/methodologie" className="text-brand-sage hover:underline">
                  Lire la méthodologie →
                </AppLink>
                <AppLink href="#" className="text-brand-navy/50 hover:text-brand-sage transition-colors">
                  RGPD (à compléter)
                </AppLink>
                <AppLink href="#" className="text-brand-navy/50 hover:text-brand-sage transition-colors">
                  Mentions légales (à compléter)
                </AppLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="demo" className="px-6 py-24 bg-white border-y border-brand-navy/5">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div className="space-y-8">
            <Badge variant="slate">Demander une démo</Badge>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-brand-navy leading-tight">
              Voyons si c&apos;est un fit pour votre cabinet.
            </h2>
            <p className="text-brand-navy/60 font-medium leading-relaxed">
              Version légère: ce formulaire prépare un email. Quand vous voudrez industrialiser, on
              branchera une soumission Inertia + validation (flash message).
            </p>
          </div>

          <div className="bg-brand-ivory/50 border border-brand-navy/5 rounded-[40px] p-10">
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <Field label="Nom">
                <input
                  value={demoName}
                  onChange={(e) => setDemoName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-brand-navy/10 bg-white focus:outline-none focus:ring-2 focus:ring-brand-sage/30"
                  placeholder="Votre nom"
                />
              </Field>
              <Field label="Email">
                <input
                  value={demoEmail}
                  onChange={(e) => setDemoEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-brand-navy/10 bg-white focus:outline-none focus:ring-2 focus:ring-brand-sage/30"
                  placeholder="prenom@cabinet.fr"
                />
              </Field>
              <Field label="Cabinet / Organisation">
                <input
                  value={demoOrg}
                  onChange={(e) => setDemoOrg(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-brand-navy/10 bg-white focus:outline-none focus:ring-2 focus:ring-brand-sage/30"
                  placeholder="Nom du cabinet"
                />
              </Field>
              <Field label="Message (optionnel)">
                <textarea
                  value={demoMessage}
                  onChange={(e) => setDemoMessage(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-brand-navy/10 bg-white focus:outline-none focus:ring-2 focus:ring-brand-sage/30 min-h-[120px]"
                  placeholder="Contexte, volume, attentes…"
                />
              </Field>

              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <a
                  href={mailtoHref}
                  className="inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-brand-sage text-white font-bold hover:bg-brand-sage/90 transition-colors"
                >
                  Envoyer la demande de démo
                  <ArrowRight className="ml-2 w-5 h-5" />
                </a>
                <Button
                  onClick={onEnterApp}
                  variant="dark"
                  className="px-8 py-4 rounded-2xl"
                >
                  Accès Expert
                </Button>
              </div>

              <p className="pt-2 text-xs font-bold uppercase tracking-widest text-brand-navy/30">
                Pas de spam • Réponse sous 48h ouvrées
              </p>
            </form>
          </div>
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="max-w-5xl mx-auto bg-brand-navy rounded-[64px] p-12 md:p-16 text-center space-y-8 shadow-[0_50px_100px_-20px_rgba(30,47,63,0.35)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_left,var(--tw-gradient-stops))] from-brand-sage/20 via-transparent to-transparent opacity-50" />
          <div className="relative z-10 space-y-8">
            <h3 className="text-4xl md:text-5xl font-bold text-white tracking-tighter leading-none">
              Prêt à passer en mode cabinet ?
            </h3>
            <p className="text-white/60 text-lg font-medium max-w-2xl mx-auto">
              Faites une démo, puis déployez une méthode premium, traçable et actionnable pour vos
              accompagnements.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
              <a
                href="#demo"
                className="inline-flex items-center justify-center px-12 py-6 rounded-2xl bg-brand-sage text-white font-bold hover:bg-brand-sage/90 transition-colors shadow-2xl shadow-brand-sage/20"
              >
                Demander une démo
                <ArrowRight className="ml-2 w-5 h-5" />
              </a>
              <Button
                onClick={onEnterApp}
                size="lg"
                className="bg-white/10 text-white hover:bg-white/15 border border-white/10 px-12 py-6"
              >
                Accès Expert
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}

function MiniProof({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-brand-navy/5 border border-brand-navy/10">
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/50">
        {text}
      </span>
    </div>
  )
}

function MockRow({ title, value }: { title: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <div className="text-sm font-bold text-brand-navy/60">{title}</div>
      <div className="text-sm font-bold text-brand-navy">{value}</div>
    </div>
  )
}

function OfferCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode
  title: string
  desc: string
}) {
  return (
    <div className="p-8 bg-brand-ivory/50 rounded-[32px] border border-brand-navy/5 hover:border-brand-sage/30 hover:bg-white hover:shadow-2xl hover:shadow-brand-navy/5 transition-all duration-500">
      <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-brand-navy mb-2">{title}</h3>
      <p className="text-sm text-brand-navy/55 font-medium leading-relaxed">{desc}</p>
    </div>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/40">
        {label}
      </span>
      {children}
    </label>
  )
}
