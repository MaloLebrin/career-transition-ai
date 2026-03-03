import React from 'react'
import { Link, usePage } from '@inertiajs/react'

interface NavLinkProps {
  href: string
  icon: 'dashboard' | 'users' | 'settings' | 'palette'
  label: string
}

const renderIcon = (icon: NavLinkProps['icon']) => {
  if (icon === 'dashboard') {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    )
  }
  if (icon === 'settings') {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  }
  if (icon === 'users') {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    )
  }
  if (icon === 'palette') {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    )
  }
  return null
}

const NavLink: React.FC<NavLinkProps> = ({ href, icon, label }) => {
  const { url } = usePage()
  const active =
    href === '/dashboard'
      ? url === '/dashboard' || url === '/dashboard/'
      : url === href || url.startsWith(href + '/')

  return (
    <Link
      href={href}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
        active
          ? 'bg-brand-sage/10 text-brand-sage font-bold'
          : 'text-brand-navy/40 hover:bg-brand-navy/5 hover:text-brand-navy'
      }`}
    >
      <div
        className={`transition-colors duration-200 ${
          active ? 'text-brand-sage' : 'text-brand-navy/20 group-hover:text-brand-navy/40'
        }`}
      >
        {renderIcon(icon)}
      </div>
      <span
        className={`text-[11px] uppercase tracking-wider transition-colors duration-200 ${
          active ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'
        }`}
      >
        {label}
      </span>
      {active && <div className="ml-auto w-1 h-4 bg-brand-sage rounded-full" />}
    </Link>
  )
}

export default NavLink
