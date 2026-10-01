import { BarChart3, Clock, ShieldCheck } from 'lucide-react'
import React from 'react'
import PublicLayout from '../layout/PublicLayout'
import AppLink from '../ui/AppLink'
import { buttonClassName } from '../ui/Button'
import Card from '../ui/Card'
import { SectionHeading } from '../ui/SectionHeading'
import { BulletList } from './BulletList'
import { CtaBand } from './CtaBand'
import { FeatureCard } from './FeatureCard'
import { MarketingDemoSection } from './MarketingDemoSection'
import { MarketingSection } from './MarketingSection'

const DELIVERABLES = [
  { title: 'Profil & objectifs', value: 'Clairs, traçables, partagés' },
  { title: 'Outils', value: 'Valeurs, motivation, DISC, ciblage' },
  { title: 'Synthèse', value: 'Argumentée, nuancée, actionnable' },
  { title: 'Suivi', value: 'Progression par étapes, révisions' },
]

const FEATURES = [
  {
    icon: <BarChart3 size={20} />,
    title: 'Qualité des livrables',
    description:
      'Une structure claire pour des restitutions premium : moins d’approximation, plus d’alignement.',
  },
  {
    icon: <Clock size={20} />,
    title: 'Gain de temps',
    description:
      'Standardisation des étapes et synthèse assistée : vous passez plus de temps sur l’écoute.',
  },
  {
    icon: <ShieldCheck size={20} />,
    title: 'Traçabilité & conformité',
    description:
      'Des traces utiles au suivi cabinet et un cadre RGPD documenté (politique de confidentialité, sécurité).',
  },
]

const BENEFITS = [
  {
    title: 'Parcours guidé par étapes',
    description:
      'Une progression claire, avec des points de passage et des livrables standardisés.',
  },
  {
    title: 'Outils comportementaux intégrés',
    description:
      'Des supports structurés (valeurs, motivation, comportements) pour alimenter l’entretien et la décision.',
  },
  {
    title: 'Synthèses actionnables',
    description:
      'Une restitution qui distingue faits, hypothèses et recommandations, pour construire un plan concret.',
  },
]

const AI_PRINCIPLES = [
  {
    title: 'IA = copilote',
    description:
      'La plateforme assiste l’analyse et la mise en forme, mais la décision reste humaine.',
  },
  {
    title: 'Rigueur & limites',
    description:
      'On cherche des tendances, pas des étiquettes ; le conseiller contextualise en entretien.',
  },
  {
    title: 'Données maîtrisées',
    description: 'Accès contrôlés et minimisation. Les pages légales détaillent le cadre complet.',
  },
]

const LEGAL_LINKS = [
  { href: '/methodologie', label: 'Lire la méthodologie' },
  { href: '/confidentialite', label: 'Politique de confidentialité' },
  { href: '/mentions-legales', label: 'Mentions légales' },
]

const LINK_CLASS = 'text-sm font-medium text-primary hover:underline'

export default function OfferPage() {
  return (
    <PublicLayout>
      <MarketingSection tone="canvas">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="space-y-8 lg:col-span-7">
            <SectionHeading
              level={1}
              size="display-lg"
              eyebrow="Offre pour les cabinets"
              title="Un portail expert pour structurer vos bilans, sans perdre la nuance."
              description="Standardisez votre méthode, améliorez la qualité des livrables et gagnez du temps sur la synthèse. L’IA vous assiste comme copilote, le conseiller reste le décideur."
            />
            <div className="flex flex-col gap-3 sm:flex-row">
              <a href="#demo" className={buttonClassName({ variant: 'primary', size: 'lg' })}>
                Demander une démo
              </a>
              <AppLink
                href="/methodologie"
                className={buttonClassName({ variant: 'outline', size: 'lg' })}
              >
                Voir la méthodologie
              </AppLink>
            </div>
          </div>

          <Card padding="md" className="lg:col-span-5">
            <p className="text-eyebrow text-primary">Livrables structurés</p>
            <p className="mt-1 text-title-md text-ink">Synthèse + plan d’action</p>
            <dl className="mt-6 divide-y divide-hairline">
              {DELIVERABLES.map((row) => (
                <div
                  key={row.title}
                  className="flex items-start justify-between gap-6 py-3 text-sm first:pt-0 last:pb-0"
                >
                  <dt className="text-muted">{row.title}</dt>
                  <dd className="text-right font-medium text-ink">{row.value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </MarketingSection>

      <MarketingSection tone="surface">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </MarketingSection>

      <MarketingSection tone="canvas">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="space-y-8">
            <SectionHeading
              eyebrow="Ce que vous obtenez"
              title="Une méthode cabinet, industrialisée proprement."
              description="Le produit structure votre accompagnement, sans le remplacer. Vous gardez la main sur le sens, le rythme et la restitution."
            />
            <BulletList items={BENEFITS} />
          </div>

          <Card variant="flat" padding="lg" className="space-y-8">
            <h3 className="text-title-lg">L’IA comme copilote, pas comme verdict.</h3>
            <BulletList items={AI_PRINCIPLES} />
            <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-hairline pt-6">
              {LEGAL_LINKS.map((link) => (
                <AppLink key={link.href} href={link.href} className={LINK_CLASS}>
                  {link.label}
                </AppLink>
              ))}
            </div>
          </Card>
        </div>
      </MarketingSection>

      <MarketingDemoSection
        id="demo"
        tone="surface"
        title="Voyons si c’est un fit pour votre cabinet."
        description="Décrivez votre organisation et vos attentes : nous revenons vers vous sous 48h ouvrées avec une proposition adaptée."
      />

      <CtaBand
        title="Prêt à passer en mode cabinet ?"
        description="Faites une démo, puis déployez une méthode traçable et actionnable pour vos accompagnements."
        actions={
          <>
            <a href="#demo" className={buttonClassName({ variant: 'primary', size: 'lg' })}>
              Demander une démo
            </a>
            <AppLink
              href="/tarifs"
              className={buttonClassName({
                variant: 'outline',
                size: 'lg',
                className: 'border-on-ink/30 bg-transparent text-on-ink hover:bg-on-ink/10',
              })}
            >
              Voir les tarifs
            </AppLink>
          </>
        }
      />
    </PublicLayout>
  )
}
