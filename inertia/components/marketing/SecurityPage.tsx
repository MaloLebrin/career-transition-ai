import { ArrowRight, CheckCircle2, Lock, ShieldCheck } from 'lucide-react'
import { motion } from 'motion/react'
import React from 'react'
import PublicLayout from '../layout/PublicLayout'
import Badge from '../ui/Badge'
import Button from '../ui/Button'

interface SecurityPageProps {
  onEnterApp: () => void
  onBackToHome?: () => void
  onOffer?: () => void
  onMethodology?: () => void
}

export default function SecurityPage({ onEnterApp, onBackToHome, onOffer, onMethodology }: SecurityPageProps) {
  return (
    <PublicLayout
      headerProps={{
        onLogoClick: onBackToHome ?? (() => {}),
        onOfferClick: onOffer,
        onMethodologyClick: onMethodology,
        showAction: true,
        actionLabel: 'Accès Expert',
        onActionClick: onEnterApp,
      }}
      footerProps={{
        variant: 'marketing',
        onEnterApp,
        footerLine: 'France Transition Carrière © 2026 • Sécurité',
      }}
      className="pb-24"
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
              <Badge variant="slate">Sécurité</Badge>
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/40">
                Sécurité & confidentialité
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold tracking-tighter leading-[0.95] text-brand-navy">
              Sécurité & confidentialité
            </h1>

            <p className="text-lg text-brand-navy/60 font-medium leading-relaxed">
              Cette page résume les pratiques de sécurité et de confidentialité. Les points ci-dessous
              sont à compléter selon votre infrastructure et vos procédures internes.
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
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card
            icon={<Lock className="text-brand-sage" />}
            title="Contrôle d’accès"
            desc="Rôles, permissions et séparation des espaces (cabinet / collaborateurs / candidats) selon le modèle."
          />
          <Card
            icon={<ShieldCheck className="text-brand-terracotta" />}
            title="Protection des données"
            desc="Chiffrement en transit (HTTPS) et pratiques de stockage à détailler (au repos, sauvegardes)."
          />
          <Card
            icon={<CheckCircle2 className="text-brand-navy" />}
            title="Traçabilité"
            desc="Journalisation et supervision pour détecter les anomalies et investiguer en cas d’incident."
          />
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="max-w-5xl mx-auto space-y-10">
          <Block title="Hébergement & localisation">
            <p className="text-brand-navy/60 font-medium leading-relaxed">
              Hébergement, localisation des données et mesures associées. <span className="text-brand-navy/60">[à compléter]</span>
            </p>
          </Block>
          <Block title="Gestion des accès">
            <ul className="space-y-2 text-brand-navy/60 font-medium">
              <li>- Principe du moindre privilège</li>
              <li>- Accès administrateurs encadrés</li>
              <li>- Révocation / rotation selon procédures internes</li>
            </ul>
          </Block>
          <Block title="Sauvegardes & continuité">
            <p className="text-brand-navy/60 font-medium leading-relaxed">
              Politique de sauvegarde, tests de restauration, objectifs RPO/RTO. <span className="text-brand-navy/60">[à compléter]</span>
            </p>
          </Block>
          <Block title="Gestion des incidents">
            <p className="text-brand-navy/60 font-medium leading-relaxed">
              Process de notification, analyse, remédiation et communication. <span className="text-brand-navy/60">[à compléter]</span>
            </p>
          </Block>
        </div>
      </section>
    </PublicLayout>
  )
}

function Card({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
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

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-10 rounded-[40px] bg-white border border-brand-navy/5 shadow-sm">
      <h2 className="text-xl font-bold text-brand-navy mb-4">{title}</h2>
      <div className="text-sm">{children}</div>
    </div>
  )
}

