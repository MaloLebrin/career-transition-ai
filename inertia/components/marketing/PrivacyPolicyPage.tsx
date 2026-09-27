import { ArrowRight, ShieldCheck } from 'lucide-react'
import { motion } from 'motion/react'
import React from 'react'
import PublicLayout from '../layout/PublicLayout'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import {
  PRIVACY_CONTACT_EMAIL,
  PRIVACY_REQUEST_DELAY,
  RETENTION_PERIODS,
  SUBPROCESSORS,
} from '#shared/constants/legal'

interface PrivacyPolicyPageProps {
  onEnterApp: () => void
  onBackToHome?: () => void
  onOffer?: () => void
  onTarifs?: () => void
  onMethodology?: () => void
}

export default function PrivacyPolicyPage({
  onEnterApp,
  onBackToHome,
  onOffer,
  onTarifs,
  onMethodology,
}: PrivacyPolicyPageProps) {
  return (
    <PublicLayout
      headerProps={{
        onOfferClick: onOffer,
        onTarifsClick: onTarifs,
        onMethodologyClick: onMethodology,
        showAction: true,
        actionLabel: 'Accès Expert',
        onActionClick: onEnterApp,
      }}
      footerProps={{
        variant: 'marketing',
        onEnterApp,
        footerLine: 'France Transition Carrière © 2026 • Politique de confidentialité',
      }}
    >
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="space-y-8"
          >
            <div className="flex items-center gap-3">
              <Badge variant="slate">RGPD</Badge>
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/40">
                Politique de confidentialité
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold tracking-tighter leading-[0.95] text-brand-navy">
              Politique de confidentialité
            </h1>

            <p className="text-lg text-brand-navy/60 font-medium leading-relaxed">
              Cette page décrit, de façon transparente, les traitements de données personnelles
              réalisés via le site et la plateforme : données collectées, finalités, durées de
              conservation, sous-traitants et exercice de vos droits.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
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
        <div className="max-w-5xl mx-auto space-y-10">
          <PolicyBlock title="Responsable de traitement">
            <p className="text-brand-navy/60 font-medium leading-relaxed">
              <span className="font-bold text-brand-navy">France Transition Carrière</span> — contact :{' '}
              <a
                href={`mailto:${PRIVACY_CONTACT_EMAIL}`}
                className="font-bold text-brand-navy underline"
              >
                {PRIVACY_CONTACT_EMAIL}
              </a>
              . Pour les candidats accompagnés, le cabinet ou l&apos;organisation qui vous suit
              agit comme responsable de traitement ; la plateforme intervient pour son compte.
            </p>
          </PolicyBlock>

          <PolicyBlock title="Données collectées">
            <ul className="space-y-2 text-brand-navy/60 font-medium">
              <li>- Données d&apos;identification (nom, email) selon les formulaires</li>
              <li>- Données liées au compte (rôles, accès, organisation)</li>
              <li>
                - Contenus saisis dans le cadre de l&apos;accompagnement (CV, parcours, réponses aux
                exercices, notes, livrables)
              </li>
              <li>- Données techniques (logs, sécurité, prévention des abus)</li>
            </ul>
          </PolicyBlock>

          <PolicyBlock title="Finalités et bases légales">
            <ul className="space-y-2 text-brand-navy/60 font-medium">
              <li>
                - Fourniture du service d&apos;accompagnement (exécution du contrat conclu avec le
                cabinet ou l&apos;organisation)
              </li>
              <li>
                - Analyses assistées par IA des exercices, au service du conseiller (intérêt
                légitime, données pseudonymisées)
              </li>
              <li>- Support et sécurité, prévention des abus (intérêt légitime)</li>
              <li>- Prospection B2B via le formulaire de contact (consentement)</li>
            </ul>
          </PolicyBlock>

          <PolicyBlock title="Durées de conservation">
            <ul className="space-y-2 text-brand-navy/60 font-medium">
              {RETENTION_PERIODS.map((period) => (
                <li key={period.data}>
                  - {period.data} : <span className="font-bold text-brand-navy">{period.duration}</span>
                </li>
              ))}
            </ul>
          </PolicyBlock>

          <PolicyBlock title="Sous-traitants et transferts">
            <p className="text-brand-navy/60 font-medium leading-relaxed mb-4">
              Les données sont hébergées dans l&apos;Union européenne. Les prestataires suivants
              interviennent pour notre compte, dans le cadre d&apos;engagements contractuels de
              confidentialité ; aucune donnée n&apos;est utilisée pour entraîner des modèles
              d&apos;IA.
            </p>
            <ul className="space-y-3 text-brand-navy/60 font-medium">
              {SUBPROCESSORS.map((subprocessor) => (
                <li key={subprocessor.name}>
                  <span className="font-bold text-brand-navy">{subprocessor.name}</span> —{' '}
                  {subprocessor.purpose} <span className="italic">({subprocessor.location})</span>
                </li>
              ))}
            </ul>
          </PolicyBlock>

          <div className="p-8 rounded-[32px] bg-brand-ivory/50 border border-brand-navy/5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand-sage/10 flex items-center justify-center text-brand-sage shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-brand-navy">Vos droits</h3>
                <p className="text-sm text-brand-navy/55 font-medium leading-relaxed">
                  Vous disposez des droits d&apos;accès, rectification, effacement, opposition,
                  limitation et portabilité. Pour les exercer, écrivez à{' '}
                  <a
                    href={`mailto:${PRIVACY_CONTACT_EMAIL}`}
                    className="font-bold text-brand-navy underline"
                  >
                    {PRIVACY_CONTACT_EMAIL}
                  </a>{' '}
                  : nous répondons dans un délai d&apos;{PRIVACY_REQUEST_DELAY}. Vous pouvez aussi
                  introduire une réclamation auprès de la CNIL (cnil.fr).
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}

function PolicyBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-10 rounded-[40px] bg-white border border-brand-navy/5 shadow-sm">
      <h2 className="text-xl font-bold text-brand-navy mb-4">{title}</h2>
      <div className="text-sm">{children}</div>
    </div>
  )
}

