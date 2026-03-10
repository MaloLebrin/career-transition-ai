import React from 'react'
import FlashMessages from '../ui/FlashMessages'
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
      <div className="px-4 pt-4 max-w-2xl mx-auto">
        <FlashMessages />
      </div>
      {children}
    </div>
  )
}

export default PublicLayout
