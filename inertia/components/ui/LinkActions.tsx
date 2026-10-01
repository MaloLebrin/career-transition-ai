import { isUrl } from '#shared/helpers/url'
import { memo, useCallback, useMemo, useState } from 'react'
import { Copy, ExternalLink, Check } from 'lucide-react'
import Button from '~/components/ui/Button'

export interface LinkActionsProps {
  value: string
  className?: string
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback for older browsers / missing permissions
    try {
      const el = document.createElement('textarea')
      el.value = text
      el.setAttribute('readonly', '')
      el.style.position = 'fixed'
      el.style.top = '0'
      el.style.left = '0'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.focus()
      el.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(el)
      return ok
    } catch {
      return false
    }
  }
}

const LinkActions = memo(function LinkActions({ value, className = '' }: LinkActionsProps) {
  const url = useMemo(() => value.trim(), [value])
  const isLink = useMemo(() => Boolean(url) && isUrl(url), [url])
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    if (!isLink) return
    const ok = await copyToClipboard(url)
    if (!ok) return
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }, [isLink, url])

  const handleOpen = useCallback(() => {
    if (!isLink) return
    window.open(url, '_blank', 'noopener,noreferrer')
  }, [isLink, url])

  if (!isLink) return null

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`.trim()}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleCopy}
        aria-label="Copier le lien"
        title="Copier le lien"
      >
        {copied ? (
          <Check className="w-4 h-4" aria-hidden />
        ) : (
          <Copy className="w-4 h-4" aria-hidden />
        )}
      </Button>
      <Button
        type="button"
        variant="emphasis"
        size="sm"
        onClick={handleOpen}
        aria-label="Ouvrir le lien dans un nouvel onglet"
        title="Ouvrir dans un nouvel onglet"
      >
        <ExternalLink className="w-4 h-4" aria-hidden />
      </Button>
    </div>
  )
})

LinkActions.displayName = 'LinkActions'

export default LinkActions
