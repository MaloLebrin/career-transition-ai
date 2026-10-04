import React, { useEffect, useRef, useState } from 'react'

export interface RevealProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  children: React.ReactNode
  /** Retard d'entrée en millisecondes (cascade entre cartes voisines). */
  delay?: number
}

/**
 * Apparition en fondu et glissement quand le bloc entre dans la fenêtre. Sans
 * `IntersectionObserver` le contenu reste visible ; `prefers-reduced-motion` réduit la
 * transition à néant (couche base de `app.css`).
 */
export const Reveal: React.FC<RevealProps> = ({
  children,
  delay = 0,
  className = '',
  ...props
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const supported = typeof IntersectionObserver !== 'undefined'
  const [shown, setShown] = useState(!supported)

  useEffect(() => {
    const node = ref.current
    if (shown || !node) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [shown])

  return (
    <div
      ref={ref}
      data-revealed={shown}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={`transition duration-700 ease-out ${
        shown ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      } ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  )
}
