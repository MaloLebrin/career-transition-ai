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
          ? 'bg-success-soft border-success/30 text-success border'
          : 'bg-danger-soft border-danger/30 text-danger border'
      }
    >
      <div className="max-w-7xl 2xl:max-w-[var(--width-app-container)] mx-auto px-6 py-3 flex items-center justify-between gap-4">
        <p className="text-sm font-medium">{message}</p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className={
            isSuccess
              ? 'text-success/70 hover:text-success p-1 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed'
              : 'text-danger/70 hover:text-danger p-1 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed'
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
