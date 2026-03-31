import React, { useMemo } from 'react'
import {
  DISC_TRAIT_COLORS,
  DISC_TRAIT_LABELS,
  DISC_TRAITS,
  type DiscScores,
} from './disc_scoring'
import { DISC_PROFILE_COPY } from './discProfileCopy'
import type { DiscTrait } from './discQuestionnaire'

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
        <div className="rounded-[32px] border border-slate-100 bg-slate-50 p-8">
          <p className="text-slate-600 font-medium">
            Modèle DISC (comportements & communication). Outil pédagogique, non-diagnostique.
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Référence modèle/couleurs: <span className="font-bold">Profil4</span> —{' '}
            <a
              className="underline hover:text-slate-600"
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
        <div className="lg:col-span-2 rounded-[40px] border border-slate-100 bg-white p-8">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 ring-1 ${DISC_TRAIT_COLORS[dom].bg} ${DISC_TRAIT_COLORS[dom].text} ${DISC_TRAIT_COLORS[dom].ring}`}
            >
              <span className="font-black">Dominante</span>
              <span className="font-black">{dom}</span>
              <span className="text-xs font-bold opacity-70">({DISC_TRAIT_LABELS[dom]})</span>
            </span>
            <span className="text-slate-300 font-black">+</span>
            <span
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 ring-1 ${DISC_TRAIT_COLORS[sec].bg} ${DISC_TRAIT_COLORS[sec].text} ${DISC_TRAIT_COLORS[sec].ring}`}
            >
              <span className="font-black">Secondaire</span>
              <span className="font-black">{sec}</span>
              <span className="text-xs font-bold opacity-70">({DISC_TRAIT_LABELS[sec]})</span>
            </span>
          </div>

          <div className="mt-8 space-y-4">
            {(DISC_TRAITS as DiscTrait[]).map((t) => {
              const value = clampPercent(percent[t])
              const color = DISC_TRAIT_COLORS[t]
              console.log(color, 'color')
              return (
                <div key={t} className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`font-black ${color.text}`}>{t}</span>
                      <span className="text-xs font-bold text-slate-500">{DISC_TRAIT_LABELS[t]}</span>
                    </div>
                    <span className="text-xs font-black text-slate-700">{value}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full ${color.fill} transition-all duration-700`} style={{ width: `${value}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-[40px] border border-slate-100 bg-white p-8">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Lecture rapide</h4>
          <div className="mt-4 space-y-4">
            <div>
              <div className="font-black text-slate-900">{dominantCopy.title}</div>
              <p className="text-sm text-slate-600 mt-1">{dominantCopy.subtitle}</p>
            </div>
            {sec !== dom && (
              <div className="pt-4 border-t border-slate-100">
                <div className="font-black text-slate-900">{secondaryCopy.title}</div>
                <p className="text-sm text-slate-600 mt-1">{secondaryCopy.subtitle}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showSections && dominantCopy && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[
            dominantCopy.strengths,
            dominantCopy.watchouts,
            dominantCopy.prefers,
            dominantCopy.underStress,
          ].map((section) => (
            <div key={section.title} className="rounded-[40px] border border-slate-100 bg-white p-8">
              <h4 className="text-sm font-black text-slate-900">{section.title}</h4>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                {section.bullets.map((b) => (
                  <li key={b} className="flex gap-2">
                    <span className="text-slate-300 font-black" aria-hidden="true">
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

