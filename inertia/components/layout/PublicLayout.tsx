import React from 'react'
import PublicHeader, { PublicHeaderProps } from './PublicHeader'

interface PublicLayoutProps {
  headerProps: PublicHeaderProps
  children: React.ReactNode
  className?: string
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ headerProps, children, className }) => {
  return (
    <div
      className={
        'min-h-screen bg-brand-ivory text-brand-navy selection:bg-brand-sage/20 overflow-x-hidden font-sans ' +
        (className ?? '')
      }
    >
      <PublicHeader {...headerProps} />
      {children}
    </div>
  )
}

export default PublicLayout

