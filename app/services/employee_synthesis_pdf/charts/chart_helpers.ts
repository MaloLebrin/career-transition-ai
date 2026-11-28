/** Helpers communs aux graphiques d'exercice du PDF de synthèse. */
import { Text as _SvgText } from '@react-pdf/renderer'

// react-pdf SVG Text has a type gap with fontSize + textAnchor — cast to bypass
export const SvgText = _SvgText as any

export function safeNum(v: unknown, fallback = 0): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

export function safeArr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : []
}

export function safeObj(v: unknown): Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {}
}
