import { Link } from '@inertiajs/react'
import React, { memo } from 'react'

const CURSOR_CLASS = 'cursor-pointer'

function isExternalHref(href: string): boolean {
  return href.startsWith('http:') || href.startsWith('https:') || href.startsWith('//')
}

export interface AppLinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: string
  children: React.ReactNode
  /** Set to true for external links to open in new tab with rel="noopener noreferrer" */
  external?: boolean
}

/**
 * Generic link component that always applies cursor-pointer.
 * Uses Inertia Link for same-origin navigation, native <a> for external URLs.
 */
const AppLink = memo(function AppLink({
  href,
  className = '',
  children,
  external,
  ...props
}: AppLinkProps) {
  const isExternal = external ?? isExternalHref(href)
  const resolvedClassName = className.includes(CURSOR_CLASS)
    ? className
    : `${CURSOR_CLASS} ${className}`.trim()

  if (isExternal) {
    return (
      <a
        href={href}
        className={resolvedClassName}
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    )
  }

  return (
    <Link href={href} className={resolvedClassName} {...props}>
      {children}
    </Link>
  )
})

AppLink.displayName = 'AppLink'

export default AppLink
