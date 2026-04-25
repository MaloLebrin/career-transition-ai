import { ArrowRight, CheckCircle2, HelpCircle } from 'lucide-react'
import { motion } from 'motion/react'
import React from 'react'
import { ContactDemoForm } from './ContactDemoForm'
import PublicLayout from '../layout/PublicLayout'
import AppLink from '../ui/AppLink'
import Badge from '../ui/Badge'
import Button from '../ui/Button'

interface PricingPageProps {
  onEnterApp: () => void
  onBackToHome?: () => void
  onOffer?: () => void
  onTarifs?: () => void
  onMethodology?: () => void
}

export default function PricingPage({
  onEnterApp,
  onBackToHome,
  onOffer,
  onTarifs,
  onMethodology,
}: PricingPageProps) {
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
        footerLine: 'France Transition Carrière © 2026 • Tarifs',
      }}
    >
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="space-y-6"
          >
            <div className="flex justify-center">
              <Badge variant="slate">Tarifs • Cabinets &amp; organismes</Badge>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tighter leading-[0.95] text-brand-navy">
              Des offres claires,{' '}
              <span className="text-brand-sage italic">adaptées à votre volume.</span>
            </h1>
            <p className="text-lg text-brand-navy/60 font-medium leading-relaxed max-w-2xl mx-auto">
              Prix indicatifs hors taxes, facturation au choix (mensuelle ou annuelle). Le devis
              final intègre vos besoins en sièges conseiller, bilans actifs et options.
            </p>
            <p className="text-sm font-bold text-brand-navy/40 uppercase tracking-widest">
              Montants indicatifs — devis personnalisé sous 48h ouvrées
            </p>
          </motion.div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          <PricingTierCard
            name="Essentiel"
            tagline="Démarrer ou petit cabinet"
            priceLabel="À partir de 149 €"
            priceSuffix="/ mois HT"
            footnote="Jusqu’à 2 sièges conseiller • bilans actifs limités"
            features={[
              'Exercices et parcours candidat',
              'Tableau de bord conseiller',
              'Support email',
            ]}
            ctaHref="#demo"
            ctaLabel="Demander un devis"
            highlighted={false}
          />
          <PricingTierCard
            name="Professionnel"
            tagline="Le plus choisi par les cabinets"
            priceLabel="À partir de 349 €"
            priceSuffix="/ mois HT"
            footnote="Jusqu’à 8 sièges • volume bilans élargi"
            features={[
              'Tout Essentiel',
              'Rapports et synthèses avancés',
              'Onboarding équipe (1 session)',
              'Support prioritaire',
            ]}
            ctaHref="#demo"
            ctaLabel="Demander un devis"
            highlighted
          />
          <PricingTierCard
            name="Cabinet+"
            tagline="Volume, multi-sites, intégrations"
            priceLabel="Sur mesure"
            priceSuffix="nous contacter"
            footnote="Sièges illimités ou forfait bilan — conditions sur devis"
            features={[
              'Tout Professionnel',
              'SSO / provisioning (selon besoin)',
              'SLA et référent dédié',
              'Formation et accompagnement renforcés',
            ]}
            ctaHref="#demo"
            ctaLabel="Parler à un conseiller"
            highlighted={false}
          />
        </div>
      </section>

      <section className="px-6 py-16 bg-white border-y border-brand-navy/5">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-sage/10 flex items-center justify-center text-brand-sage">
              <HelpCircle size={22} />
            </div>
            <h2 className="text-2xl font-bold text-brand-navy tracking-tight">Questions fréquentes</h2>
          </div>
          <ul className="space-y-6">
            <FaqItem
              q="Y a-t-il une période d’essai ?"
              a="Nous privilégions une démo cadrée puis un pilote court selon votre contexte. Indiquez-le dans votre message : nous adaptons la proposition."
            />
            <FaqItem
              q="Comment sont comptés les sièges ?"
              a="Un siège correspond à un conseiller actif sur la plateforme. Les candidats / salariés accompagnés ne sont pas facturés comme sièges."
            />
            <FaqItem
              q="Puis-je résilier ou changer d’offre ?"
              a="Oui, les conditions d’engagement et de résiliation sont précisées au devis (souvent engagement annuel avec flexibilité à l’échéance)."
            />
            <FaqItem
              q="La TVA s’applique-t-elle ?"
              a="Selon votre statut et le lieu de facturation. Les montants affichés sont HT ; la TVA éventuelle est indiquée sur le devis."
            />
          </ul>
        </div>
      </section>

      <section id="demo" className="px-6 py-24 bg-brand-ivory/30 border-y border-brand-navy/5">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div className="space-y-8">
            <Badge variant="slate">Devis personnalisé</Badge>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-brand-navy leading-tight">
              Affinons le bon niveau pour votre cabinet.
            </h2>
            <p className="text-brand-navy/60 font-medium leading-relaxed">
              Décrivez votre organisation et votre volume : nous revenons vers vous avec une grille
              tarifaire adaptée (sièges, bilans, options).
            </p>
            <p className="text-sm text-brand-navy/45 font-medium">
              <AppLink href="/offre" className="text-brand-sage font-bold hover:underline">
                Voir l’offre détaillée →
              </AppLink>
            </p>
          </div>

          <div className="bg-brand-ivory/50 border border-brand-navy/5 rounded-[40px] p-10">
            <ContactDemoForm
              variant="demo"
              title=""
              description=""
            />
          </div>
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="max-w-5xl mx-auto bg-brand-navy rounded-[64px] p-12 md:p-16 text-center space-y-8 shadow-[0_50px_100px_-20px_rgba(30,47,63,0.35)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_left,var(--tw-gradient-stops))] from-brand-sage/20 via-transparent to-transparent opacity-50" />
          <div className="relative z-10 space-y-8">
            <h3 className="text-4xl md:text-5xl font-bold text-white tracking-tighter leading-none">
              Une question sur la facturation ?
            </h3>
            <p className="text-white/60 text-lg font-medium max-w-2xl mx-auto">
              Écrivez-nous ou demandez une démo : nous vous proposons une grille claire, sans
              surprise.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
              <a
                href="#demo"
                className="inline-flex items-center justify-center px-12 py-6 rounded-2xl bg-brand-sage text-white font-bold hover:bg-brand-sage/90 transition-colors shadow-2xl shadow-brand-sage/20"
              >
                Demander un devis
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

function PricingTierCard({
  name,
  tagline,
  priceLabel,
  priceSuffix,
  footnote,
  features,
  ctaHref,
  ctaLabel,
  highlighted,
}: {
  name: string
  tagline: string
  priceLabel: string
  priceSuffix: string
  footnote: string
  features: string[]
  ctaHref: string
  ctaLabel: string
  highlighted: boolean
}) {
  return (
    <div
      className={
        'relative flex flex-col rounded-[40px] border p-10 transition-all duration-500 ' +
        (highlighted
          ? 'border-brand-sage/40 bg-white shadow-2xl shadow-brand-navy/10 scale-[1.02] lg:scale-105 z-10'
          : 'border-brand-navy/5 bg-brand-ivory/40 hover:border-brand-sage/25 hover:bg-white hover:shadow-xl')
      }
    >
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-block px-4 py-1 rounded-full bg-brand-sage text-white text-[10px] font-bold uppercase tracking-widest">
            Recommandé
          </span>
        </div>
      )}
      <div className="space-y-2 mb-8">
        <h3 className="text-2xl font-bold text-brand-navy">{name}</h3>
        <p className="text-sm text-brand-navy/50 font-medium">{tagline}</p>
      </div>
      <div className="mb-8">
        <p className="text-4xl font-bold text-brand-navy tracking-tight">{priceLabel}</p>
        <p className="text-sm font-bold text-brand-navy/45 mt-1">{priceSuffix}</p>
        <p className="text-xs text-brand-navy/40 font-medium mt-4 leading-relaxed">{footnote}</p>
      </div>
      <ul className="space-y-4 flex-1 mb-10">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-3">
            <span className="mt-0.5 text-brand-sage shrink-0">
              <CheckCircle2 size={20} />
            </span>
            <span className="text-sm font-medium text-brand-navy/70 leading-relaxed">{f}</span>
          </li>
        ))}
      </ul>
      <a
        href={ctaHref}
        className={
          'inline-flex items-center justify-center w-full py-4 rounded-2xl font-bold transition-colors ' +
          (highlighted
            ? 'bg-brand-sage text-white hover:bg-brand-sage/90 shadow-lg shadow-brand-sage/15'
            : 'bg-brand-navy/5 text-brand-navy hover:bg-brand-navy/10')
        }
      >
        {ctaLabel}
        <ArrowRight className="ml-2 w-5 h-5" />
      </a>
    </div>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <li className="border-b border-brand-navy/5 pb-6 last:border-0 last:pb-0">
      <p className="font-bold text-brand-navy mb-2">{q}</p>
      <p className="text-sm text-brand-navy/55 font-medium leading-relaxed">{a}</p>
    </li>
  )
}

