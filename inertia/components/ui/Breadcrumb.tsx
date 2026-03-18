import { ChevronRight, Home } from 'lucide-react'
import { memo } from 'react'
import AppLink from './AppLink'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

const Breadcrumb = memo(function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  if (items.length === 0) return null

  return (
    <nav
      aria-label="Fil d'Ariane"
      className={`w-full py-4 ${className}`}
    >
      <ol className="flex items-center gap-2 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          const isFirst = index === 0

          return (
            <li key={index} className="flex items-center gap-2">
              {index > 0 && (
                <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
              )}
              {isLast ? (
                <span className="font-semibold text-slate-900 truncate max-w-[200px]">
                  {item.label}
                </span>
              ) : item.href ? (
                <AppLink
                  href={item.href}
                  className="flex items-center gap-1.5 text-slate-500 hover:text-brand-sage transition-colors font-medium"
                >
                  {isFirst && <Home className="w-4 h-4" />}
                  <span className="truncate max-w-[150px]">{item.label}</span>
                </AppLink>
              ) : (
                <span className="text-slate-400 truncate max-w-[150px]">
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
})

Breadcrumb.displayName = 'Breadcrumb'

export default Breadcrumb
