import React, { useMemo } from 'react'
import { DISC_TRAIT_COLORS, DISC_TRAIT_LABELS, DISC_TRAITS, type DiscScores } from './disc_scoring'
import { DISC_PROFILE_COPY } from './disc_profile_copy'
import type { DiscTrait } from './disc_questionnaire'
import { DiscWheel } from './DiscWheel'

type DiscPercent = DiscScores

interface Props {
  percent: DiscPercent
  dominant?: DiscTrait
  secondary?: DiscTrait
  /** Affiche les sections (forces, vigilance, etc.) basées sur la dominante. */
  showSections?: boolean
  /** Affiche le bloc “à propos / référence”. */
  showAbout?: boolean
  /** Contenu optionnel en pied de bloc (actions). */
  footer?: React.ReactNode
}

function clampPercent(value: any): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.max(0, Math.min(100, Math.round(n)))
}

function computeTopTwo(percent: DiscPercent): { dominant: DiscTrait; secondary: DiscTrait } {
  const sorted = [...DISC_TRAITS].sort((a, b) => {
    const byValue = clampPercent(percent[b]) - clampPercent(percent[a])
    if (byValue !== 0) return byValue
    return 0
  })
  return { dominant: sorted[0], secondary: sorted[1] ?? sorted[0] }
}

export default function DiscResultSummary({
  percent,
  dominant,
  secondary,
  showSections = true,
  showAbout = true,
  footer,
}: Props) {
  const computedTop = useMemo(() => computeTopTwo(percent), [percent])
  const dom = dominant ?? computedTop.dominant
  const sec = secondary ?? computedTop.secondary

  const dominantCopy = DISC_PROFILE_COPY[dom]
  const secondaryCopy = DISC_PROFILE_COPY[sec]

  return (
    <div className="space-y-10">
      {showAbout && (
        <div className="rounded-2xl border border-hairline bg-surface-soft p-6 sm:p-8">
          <p className="font-medium text-ink-soft">
            Modèle DISC (comportements & communication). Outil pédagogique, non-diagnostique.
          </p>
          <p className="mt-2 text-caption text-muted">
            Référence modèle/couleurs: <span className="font-bold">Profil4</span> —{' '}
            <a
              className="text-accent underline hover:text-ink"
              href="https://profil4.com/fr/documentation"
              target="_blank"
              rel="noreferrer"
            >
              documentation
            </a>
            .
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-hairline bg-surface p-6 shadow-card sm:p-8 lg:col-span-2">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 ring-1 ${DISC_TRAIT_COLORS[dom].bg} ${DISC_TRAIT_COLORS[dom].text} ${DISC_TRAIT_COLORS[dom].ring}`}
            >
              <span className="font-bold">Dominante</span>
              <span className="font-extrabold">{dom}</span>
              <span className="text-caption font-bold">({DISC_TRAIT_LABELS[dom]})</span>
            </span>
            <span className="font-extrabold text-muted-soft" aria-hidden="true">
              +
            </span>
            <span
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 ring-1 ${DISC_TRAIT_COLORS[sec].bg} ${DISC_TRAIT_COLORS[sec].text} ${DISC_TRAIT_COLORS[sec].ring}`}
            >
              <span className="font-bold">Secondaire</span>
              <span className="font-extrabold">{sec}</span>
              <span className="text-caption font-bold">({DISC_TRAIT_LABELS[sec]})</span>
            </span>
          </div>

          <div className="mt-8 space-y-4">
            {(DISC_TRAITS as DiscTrait[]).map((t) => {
              const value = clampPercent(percent[t])
              const color = DISC_TRAIT_COLORS[t]
              return (
                <div key={t} className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`font-extrabold ${color.text}`}>{t}</span>
                      <span className="text-caption font-bold text-muted">
                        {DISC_TRAIT_LABELS[t]}
                      </span>
                    </div>
                    <span className="text-caption font-extrabold text-ink">{value}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-surface-soft">
                    <div
                      className={`h-full ${color.fill} transition-all duration-700`}
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-hairline bg-surface p-6 shadow-card sm:p-8">
          <h4 className="text-title-md text-ink">Lecture rapide</h4>
          <div className="mt-4 space-y-4">
            <div>
              <div className="text-title-sm text-ink">{dominantCopy.title}</div>
              <p className="mt-1 text-sm text-muted">{dominantCopy.subtitle}</p>
            </div>
            {sec !== dom && (
              <div className="border-t border-hairline pt-4">
                <div className="text-title-sm text-ink">{secondaryCopy.title}</div>
                <p className="mt-1 text-sm text-muted">{secondaryCopy.subtitle}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <section
        aria-labelledby="disc-wheel-title"
        className="rounded-2xl border border-hairline bg-surface p-6 shadow-card sm:p-8"
      >
        <h4 id="disc-wheel-title" className="text-title-md text-ink">
          Votre position sur la roue
        </h4>
        <p className="mt-1 text-sm text-muted">
          Huit styles de comportement entre les quatre couleurs DISC. Le point montre votre style
          naturel ; plus il est loin du centre, plus ce style est marqué.
        </p>
        <div className="mt-6">
          <DiscWheel percent={percent} />
        </div>
      </section>

      {showSections && dominantCopy && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[
            dominantCopy.strengths,
            dominantCopy.watchouts,
            dominantCopy.prefers,
            dominantCopy.underStress,
          ].map((section) => (
            <div
              key={section.title}
              className="rounded-2xl border border-hairline bg-surface p-6 shadow-card sm:p-8"
            >
              <h4 className="text-title-sm text-ink">{section.title}</h4>
              <ul className="mt-4 space-y-2 text-sm text-ink-soft">
                {section.bullets.map((b) => (
                  <li key={b} className="flex gap-2">
                    <span className="font-extrabold text-muted-soft" aria-hidden="true">
                      •
                    </span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {footer ? <div>{footer}</div> : null}
    </div>
  )
}
