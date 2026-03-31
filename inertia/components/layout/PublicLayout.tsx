import React from 'react'
import PublicFooter, { type PublicFooterProps } from './PublicFooter'
import PublicHeader, { PublicHeaderProps } from './PublicHeader'

interface PublicLayoutProps {
  headerProps: PublicHeaderProps
  footerProps?: PublicFooterProps
  children: React.ReactNode
  className?: string
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ headerProps, footerProps, children, className }) => {
  return (
    <div
      className={
        'min-h-screen bg-brand-ivory text-brand-navy selection:bg-brand-sage/20 overflow-x-hidden font-sans ' +
        (className ?? '')
      }
    >
      <PublicHeader {...headerProps} />
      {children}
      {footerProps ? <PublicFooter {...footerProps} /> : null}
    </div>
  )
}

export default PublicLayout
