import { ArrowRight, ShieldCheck } from 'lucide-react'
import { motion } from 'motion/react'
import React from 'react'
import PublicLayout from '../layout/PublicLayout'
import Badge from '../ui/Badge'
import Button from '../ui/Button'

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
              réalisés via le site et la plateforme. Les éléments ci-dessous sont à adapter aux
              pratiques exactes (finalités, durées, sous-traitants, hébergement, DPO, etc.).
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
              <span className="font-bold text-brand-navy">France Transition Carrière</span> (ou entité
              éditrice) — <span className="text-brand-navy/60">[coordonnées à compléter]</span>.
            </p>
          </PolicyBlock>

          <PolicyBlock title="Données collectées">
            <ul className="space-y-2 text-brand-navy/60 font-medium">
              <li>- Données d&apos;identification (nom, email) selon les formulaires</li>
              <li>- Données liées au compte (rôles, accès, organisation)</li>
              <li>- Contenus saisis dans le cadre de l&apos;accompagnement (réponses, notes, livrables)</li>
              <li>- Données techniques (logs, sécurité, prévention fraude) selon configuration</li>
            </ul>
          </PolicyBlock>

          <PolicyBlock title="Finalités et bases légales">
            <ul className="space-y-2 text-brand-navy/60 font-medium">
              <li>- Fourniture du service (exécution du contrat)</li>
              <li>- Support, amélioration du service (intérêt légitime)</li>
              <li>- Sécurité, prévention des abus (intérêt légitime)</li>
              <li>- Prospection B2B (intérêt légitime / consentement selon cas)</li>
            </ul>
          </PolicyBlock>

          <PolicyBlock title="Durées de conservation">
            <p className="text-brand-navy/60 font-medium leading-relaxed">
              Les durées de conservation dépendent du type de données et du contexte (compte actif,
              obligations légales, archivage cabinet). <span className="text-brand-navy/60">[à compléter]</span>.
            </p>
          </PolicyBlock>

          <PolicyBlock title="Sous-traitants et transferts">
            <p className="text-brand-navy/60 font-medium leading-relaxed">
              Des prestataires peuvent intervenir (hébergement, emailing, analytics, etc.). La liste
              et les lieux d&apos;hébergement doivent être détaillés. <span className="text-brand-navy/60">[à compléter]</span>.
            </p>
          </PolicyBlock>

          <div className="p-8 rounded-[32px] bg-brand-ivory/50 border border-brand-navy/5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand-sage/10 flex items-center justify-center text-brand-sage shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-brand-navy">Vos droits</h3>
                <p className="text-sm text-brand-navy/55 font-medium leading-relaxed">
                  Vous disposez notamment des droits d&apos;accès, rectification, effacement, opposition,
                  limitation et portabilité. Pour exercer vos droits: <span className="font-bold text-brand-navy">[contact à compléter]</span>.
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

