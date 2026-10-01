import React, { useCallback, memo } from 'react'

export type NavButtonIcon = 'dashboard' | 'users' | 'settings' | 'palette'

export interface NavButtonProps {
  'active': boolean
  'onClick': () => void
  'icon': NavButtonIcon
  'label': string
  /** Accessible name overrides label for screen readers when different */
  'aria-label'?: string
}

const ICONS: Record<NavButtonIcon, React.ReactNode> = {
  dashboard: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
      />
    </svg>
  ),
  settings: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  ),
  users: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  ),
  palette: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
      />
    </svg>
  ),
}

const NavButton = memo(function NavButton({
  active,
  onClick,
  icon,
  label,
  'aria-label': ariaLabel,
}: NavButtonProps) {
  const handleClick = useCallback(() => onClick(), [onClick])

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group cursor-pointer disabled:cursor-not-allowed ${
        active
          ? 'bg-accent-soft text-accent font-bold'
          : 'text-muted hover:bg-surface-soft hover:text-ink'
      }`}
      aria-current={active ? 'page' : undefined}
      aria-label={ariaLabel ?? label}
    >
      <div
        className={`transition-colors duration-200 ${
          active ? 'text-accent' : 'text-muted-soft group-hover:text-muted'
        }`}
      >
        {ICONS[icon]}
      </div>
      <span
        className={`text-[11px] uppercase tracking-wider transition-colors duration-200 ${
          active ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'
        }`}
      >
        {label}
      </span>
      {active && <div className="ml-auto w-1 h-4 bg-accent rounded-full" aria-hidden />}
    </button>
  )
})

NavButton.displayName = 'NavButton'

export default NavButton
