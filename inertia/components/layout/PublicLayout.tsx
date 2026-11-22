import React from 'react'
import { CompanionAssistant } from './assistant/CompanionAssistant'
import PublicFooter from './PublicFooter'
import PublicHeader, { type PublicHeaderProps } from './PublicHeader'

interface PublicLayoutProps {
  /** Options de l'en-tête ; omis = navigation marketing complète. */
  header?: PublicHeaderProps
  /** Pied de page sombre (défaut : affiché). */
  footer?: boolean
  /**
   * Compagnon-assistant en bas à droite (défaut : affiché). `false` sur les écrans qui
   * montrent déjà un compagnon (auth) : jamais deux par écran.
   */
  assistant?: boolean
  children: React.ReactNode
  className?: string
}

/** Coquille des pages publiques : en-tête collant, contenu, footer ink, compagnon-assistant. */
const PublicLayout: React.FC<PublicLayoutProps> = ({
  header,
  footer = true,
  assistant = true,
  children,
  className,
}) => {
  return (
    <div className={`min-h-screen flex flex-col bg-canvas text-ink-soft ${className ?? ''}`.trim()}>
      <PublicHeader {...header} />
      <main className="flex-1">{children}</main>
      {footer && <PublicFooter />}
      {assistant && <CompanionAssistant />}
    </div>
  )
}

export default PublicLayout
