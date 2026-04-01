import { ArrowRight, ShieldCheck } from 'lucide-react'
import { motion } from 'motion/react'
import React from 'react'
import PublicLayout from '../layout/PublicLayout'
import Badge from '../ui/Badge'
import Button from '../ui/Button'

interface LegalNoticePageProps {
  onEnterApp: () => void
  onBackToHome?: () => void
  onOffer?: () => void
  onTarifs?: () => void
  onMethodology?: () => void
}

export default function LegalNoticePage({
  onEnterApp,
  onBackToHome,
  onOffer,
  onTarifs,
  onMethodology,
}: LegalNoticePageProps) {
  return (
    <PublicLayout
      headerProps={{
        onLogoClick: onBackToHome ?? (() => {}),
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
        footerLine: 'France Transition Carrière © 2026 • Mentions légales',
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
              <Badge variant="slate">Légal</Badge>
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-navy/40">
                Mentions légales
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold tracking-tighter leading-[0.95] text-brand-navy">
              Mentions légales
            </h1>

            <p className="text-lg text-brand-navy/60 font-medium leading-relaxed">
              Cette page fournit les informations légales relatives à l&apos;éditeur du site et au
              traitement des contenus. Les informations ci-dessous sont à compléter avec les données
              exactes de l&apos;entité éditrice et de l&apos;hébergeur.
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
          <LegalBlock title="Éditeur du site">
            <ul className="space-y-2">
              <li>
                <span className="font-bold text-brand-navy">Dénomination</span>:{' '}
                <span className="text-brand-navy/60">[à compléter]</span>
              </li>
              <li>
                <span className="font-bold text-brand-navy">Forme juridique</span>:{' '}
                <span className="text-brand-navy/60">[à compléter]</span>
              </li>
              <li>
                <span className="font-bold text-brand-navy">Adresse</span>:{' '}
                <span className="text-brand-navy/60">[à compléter]</span>
              </li>
              <li>
                <span className="font-bold text-brand-navy">Email</span>:{' '}
                <span className="text-brand-navy/60">contact@francetransitioncarriere.fr</span>
              </li>
              <li>
                <span className="font-bold text-brand-navy">SIRET</span>:{' '}
                <span className="text-brand-navy/60">[à compléter]</span>
              </li>
              <li>
                <span className="font-bold text-brand-navy">Directeur de la publication</span>:{' '}
                <span className="text-brand-navy/60">[à compléter]</span>
              </li>
            </ul>
          </LegalBlock>

          <LegalBlock title="Hébergement">
            <p className="text-brand-navy/60 font-medium leading-relaxed">
              <span className="font-bold text-brand-navy">Hébergeur</span>: [à compléter]
              <br />
              <span className="font-bold text-brand-navy">Adresse</span>: [à compléter]
              <br />
              <span className="font-bold text-brand-navy">Téléphone</span>: [à compléter]
            </p>
          </LegalBlock>

          <LegalBlock title="Propriété intellectuelle">
            <p className="text-brand-navy/60 font-medium leading-relaxed">
              L&apos;ensemble du site, sa structure et ses contenus (textes, images, marques, éléments
              graphiques, bases de données, etc.) sont protégés par le droit de la propriété
              intellectuelle. Toute reproduction, représentation ou exploitation non autorisée est
              interdite.
            </p>
          </LegalBlock>

          <LegalBlock title="Responsabilité">
            <p className="text-brand-navy/60 font-medium leading-relaxed">
              Les informations fournies sur le site sont données à titre indicatif. L&apos;éditeur ne
              saurait être tenu responsable d&apos;une mauvaise utilisation du service ou d&apos;une
              interruption temporaire.
            </p>
          </LegalBlock>

          <div className="p-8 rounded-[32px] bg-brand-ivory/50 border border-brand-navy/5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand-sage/10 flex items-center justify-center text-brand-sage shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-brand-navy">Données personnelles</h3>
                <p className="text-sm text-brand-navy/55 font-medium leading-relaxed">
                  Pour plus d&apos;informations sur le traitement des données, consultez la page{' '}
                  <span className="font-bold text-brand-navy">Politique de confidentialité</span>{' '}
                  (à créer).
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}

function LegalBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-10 rounded-[40px] bg-white border border-brand-navy/5 shadow-sm">
      <h2 className="text-xl font-bold text-brand-navy mb-4">{title}</h2>
      <div className="text-sm">{children}</div>
    </div>
  )
}

