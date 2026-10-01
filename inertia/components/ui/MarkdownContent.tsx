import { memo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'

const markdownComponents: Partial<Components> = {
  a: ({ href, children }) => {
    const isExternal = typeof href === 'string' && /^https?:\/\//i.test(href)
    return (
      <a
        href={href}
        className="underline font-medium text-violet-700 hover:text-violet-900"
        {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      >
        {children}
      </a>
    )
  },
}

export interface MarkdownContentProps {
  /** Markdown source (GFM: lists, tables, strikethrough, etc.) */
  children: string
  className?: string
}

/**
 * Renders markdown safely (no raw HTML). Styled for long-form copy in tinted panels.
 */
const MarkdownContent = memo(function MarkdownContent({
  children,
  className,
}: MarkdownContentProps) {
  const rootClass = [
    'relative z-10 text-sm font-medium leading-relaxed text-violet-900',
    '[&_p]:mb-3 [&_p:last-child]:mb-0',
    '[&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1',
    '[&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1',
    '[&_li]:pl-0.5',
    '[&_strong]:font-bold',
    '[&_em]:italic',
    '[&_code]:rounded [&_code]:bg-violet-100/80 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_code]:font-mono',
    '[&_pre]:my-3 [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-violet-950/10 [&_pre]:p-4 [&_pre]:text-xs',
    '[&_pre_code]:bg-transparent [&_pre_code]:p-0',
    '[&_h1]:mb-2 [&_h1]:mt-4 [&_h1]:text-lg [&_h1]:font-black [&_h1]:first:mt-0',
    '[&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:text-base [&_h2]:font-black [&_h2]:first:mt-0',
    '[&_h3]:mb-2 [&_h3]:mt-2 [&_h3]:text-sm [&_h3]:font-black [&_h3]:first:mt-0',
    '[&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-violet-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-violet-800',
    '[&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_table]:text-xs',
    '[&_th]:border [&_th]:border-violet-200 [&_th]:bg-violet-100/50 [&_th]:p-2 [&_th]:text-left [&_th]:font-bold',
    '[&_td]:border [&_td]:border-violet-200 [&_td]:p-2',
    '[&_hr]:my-4 [&_hr]:border-violet-200',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={rootClass}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {children}
      </ReactMarkdown>
    </div>
  )
})

MarkdownContent.displayName = 'MarkdownContent'

export default MarkdownContent
