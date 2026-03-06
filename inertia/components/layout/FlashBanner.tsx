import React, { useState, useEffect } from 'react'
import { usePage } from '@inertiajs/react'

interface FlashProps {
  success?: string
  error?: string
}

export default function FlashBanner() {
  const { props } = usePage<{ flash?: FlashProps }>()
  const flash = props.flash
  const [dismissed, setDismissed] = useState(false)

  const message = flash?.success ?? flash?.error
  const isSuccess = Boolean(flash?.success)

  // Reset dismissed when a new flash appears (e.g. after navigation)
  useEffect(() => {
    setDismissed(false)
  }, [message])

  // Auto-dismiss after 5s
  useEffect(() => {
    if (!message) return
    const t = setTimeout(() => setDismissed(true), 5000)
    return () => clearTimeout(t)
  }, [message])

  if (!message || dismissed) return null

  return (
    <div
      role="alert"
      className={
        isSuccess
          ? 'bg-brand-sage/10 border-brand-sage/30 text-brand-sage border'
          : 'bg-rose-50 border-rose-200 text-rose-800 border'
      }
    >
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
        <p className="text-sm font-medium">{message}</p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className={
            isSuccess
              ? 'text-brand-sage/70 hover:text-brand-sage p-1 rounded-lg transition-colors'
              : 'text-rose-500/70 hover:text-rose-600 p-1 rounded-lg transition-colors'
          }
          aria-label="Fermer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
