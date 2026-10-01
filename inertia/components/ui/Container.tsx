import React from 'react'

export type ContainerSize = 'marketing' | 'narrow' | 'prose'

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** `marketing` 1200px (défaut), `narrow` 768px (documents), `prose` 65ch. */
  size?: ContainerSize
  as?: 'div' | 'section' | 'header' | 'footer' | 'nav' | 'main'
  children: React.ReactNode
}

const SIZES: Record<ContainerSize, string> = {
  marketing: 'max-w-marketing',
  narrow: 'max-w-3xl',
  prose: 'max-w-prose',
}

/** Largeur de contenu centrée avec gouttières latérales de 24px. */
export const Container: React.FC<ContainerProps> = ({
  size = 'marketing',
  as: Tag = 'div',
  className = '',
  children,
  ...props
}) => (
  <Tag className={`${SIZES[size]} mx-auto w-full px-6 ${className}`.trim()} {...props}>
    {children}
  </Tag>
)
