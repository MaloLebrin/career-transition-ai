import React from 'react'
import AppLink from '../ui/AppLink'
import { Logo } from '../ui/Logo'

export type PublicFooterVariant = 'landing' | 'marketing'

export interface PublicFooterProps {
  variant: PublicFooterVariant
  onEnterApp: () => void
  /** Landing only: scroll to #ai-engine */
  onAiClick?: () => void
  /** Full copyright line (suffix after brand + year) */
  footerLine: string
}

const PublicFooter: React.FC<PublicFooterProps> = ({ variant, onEnterApp, onAiClick, footerLine }) => {
  return (
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
                  href="/offre"
                  className="text-sm font-bold text-brand-navy/60 hover:text-brand-sage transition-colors"
                >
                  Offre
                </AppLink>
              </li>
              <li>
                <AppLink
                  href="/tarifs"
                  className="text-sm font-bold text-brand-navy/60 hover:text-brand-sage transition-colors"
                >
                  Tarifs
                </AppLink>
              </li>
              <li>
                <AppLink
                  href="/methodologie"
                  className="text-sm font-bold text-brand-navy/60 hover:text-brand-sage transition-colors"
                >
                  Méthodologie
                </AppLink>
              </li>
              {variant === 'landing' ? (
                <li>
                  <button
                    type="button"
                    onClick={onAiClick}
                    className="text-sm font-bold text-brand-navy/60 hover:text-brand-sage transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    Intelligence Artificielle
                  </button>
                </li>
              ) : (
                <li>
                  <AppLink
                    href="/"
                    className="text-sm font-bold text-brand-navy/60 hover:text-brand-sage transition-colors"
                  >
                    Accueil
                  </AppLink>
                </li>
              )}
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
                  href="/mentions-legales"
                  className="text-sm font-bold text-brand-navy/60 hover:text-brand-sage transition-colors"
                >
                  Mentions Légales
                </AppLink>
              </li>
              <li>
                <AppLink
                  href="/confidentialite"
                  className="text-sm font-bold text-brand-navy/60 hover:text-brand-sage transition-colors"
                >
                  Confidentialité (RGPD)
                </AppLink>
              </li>
              <li>
                <AppLink
                  href="/securite"
                  className="text-sm font-bold text-brand-navy/60 hover:text-brand-sage transition-colors"
                >
                  Sécurité
                </AppLink>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-12 border-t border-brand-navy/5 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-[11px] font-bold text-brand-navy/30 uppercase tracking-[0.3em]">{footerLine}</div>
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
  )
}

export default PublicFooter
