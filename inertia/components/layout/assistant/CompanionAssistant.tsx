import { usePage } from '@inertiajs/react'
import { X } from 'lucide-react'
import React, { useEffect, useId, useState } from 'react'
import AppLink from '~/components/ui/AppLink'
import { Companion } from '~/components/ui/Companion'
import { useScrolled } from '~/hooks/use_scrolled'
import { normalizePath, PAGES_WITH_HERO_COMPANION, tipFor } from './assistant_tips'

/** Clé de session : le visiteur a replié l'assistant (préférence de confort, jamais critique). */
export const ASSISTANT_COLLAPSED_KEY = 'jumpujob.assistant.collapsed'

/** Sous cette largeur (`sm`), la bulle cacherait trop de contenu : le robot démarre replié. */
const COMPACT_QUERY = '(max-width: 639px)'

function isCompactScreen(): boolean {
  try {
    return window.matchMedia(COMPACT_QUERY).matches
  } catch {
    return false
  }
}

/** Défilement au-delà duquel le compagnon du héros est sorti de l'écran. */
const HERO_SCROLL_THRESHOLD = 640

function readCollapsed(): boolean {
  try {
    return window.sessionStorage.getItem(ASSISTANT_COLLAPSED_KEY) === '1'
  } catch {
    return false
  }
}

function writeCollapsed(collapsed: boolean): void {
  try {
    if (collapsed) window.sessionStorage.setItem(ASSISTANT_COLLAPSED_KEY, '1')
    else window.sessionStorage.removeItem(ASSISTANT_COLLAPSED_KEY)
  } catch {
    // Stockage indisponible (navigation privée) : l'assistant reste simplement ouvert.
  }
}

/**
 * Le compagnon en assistant des pages publiques : fixé en bas à droite, il affiche un conseil
 * propre à la page (`assistant_tips.ts`) dans une bulle qu'on replie ; replié, il reste un
 * bouton pour la rouvrir, et ce choix vaut pour la session. Sur mobile, il démarre replié.
 * Jamais deux compagnons à l'écran : sur une page dont le héros en montre déjà un, il
 * n'apparaît qu'une fois ce héros dépassé.
 */
export const CompanionAssistant: React.FC = () => {
  const { url } = usePage()
  const tip = tipFor(url)
  const bubbleId = useId()
  const [open, setOpen] = useState(true)
  const waitsForHero = PAGES_WITH_HERO_COMPANION.includes(normalizePath(url))
  const pastHero = useScrolled(HERO_SCROLL_THRESHOLD)

  useEffect(() => {
    setOpen(!readCollapsed() && !isCompactScreen())
  }, [])

  if (waitsForHero && !pastHero) return null

  const toggle = (next: boolean) => {
    setOpen(next)
    writeCollapsed(!next)
  }

  return (
    <aside
      aria-label="Assistant jumpUjob"
      className="fixed right-4 bottom-4 z-40 flex max-w-[calc(100vw-2rem)] animate-fade-in items-end gap-2 sm:right-6 sm:bottom-6"
    >
      {open && (
        <div
          id={bubbleId}
          className="relative mb-6 w-72 max-w-full rounded-2xl border border-hairline bg-surface p-4 pr-10 shadow-raised"
        >
          <p className="text-title-sm text-ink">{tip.title}</p>
          <p className="mt-1 text-sm text-muted">{tip.text}</p>
          {tip.link && (
            <AppLink
              href={tip.link.href}
              className="mt-2 inline-block text-sm font-bold text-accent hover:underline"
            >
              {tip.link.label}
            </AppLink>
          )}
          <button
            type="button"
            onClick={() => toggle(false)}
            className="absolute top-2 right-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-muted hover:bg-surface-soft hover:text-ink"
            aria-label="Masquer le conseil"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={() => toggle(!open)}
        aria-expanded={open}
        aria-controls={open ? bubbleId : undefined}
        aria-label={
          open ? 'Masquer le conseil de l’assistant' : 'Afficher le conseil de l’assistant'
        }
        className="shrink-0 cursor-pointer rounded-full transition-transform hover:-translate-y-0.5"
      >
        <Companion
          pose={tip.pose ?? 'wave'}
          size="sm"
          animated
          className="h-16 w-16 sm:h-20 sm:w-20"
        />
      </button>
    </aside>
  )
}
