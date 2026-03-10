import { usePage } from '@inertiajs/react'
import React from 'react'

const FLASH_PROP = 'flash' as const

type FlashProps = {
  error?: string
  success?: string
}

export default function FlashMessages() {
  const { props } = usePage<{ [FLASH_PROP]?: FlashProps }>()
  const flash = props[FLASH_PROP]
  const error = flash?.error
  const success = flash?.success

  if (!error && !success) return null

  return (
    <div className="space-y-3">
      {error && (
        <div
          className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl animate-shake"
          role="alert"
        >
          <svg
            className="w-5 h-5 text-rose-500 shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm font-bold text-rose-600">{error}</p>
        </div>
      )}
      {success && (
        <div
          className="flex items-start gap-3 p-4 bg-brand-sage/10 border border-brand-sage/20 rounded-2xl"
          role="status"
        >
          <svg
            className="w-5 h-5 text-brand-sage shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm font-bold text-brand-navy">{success}</p>
        </div>
      )}
    </div>
  )
}
