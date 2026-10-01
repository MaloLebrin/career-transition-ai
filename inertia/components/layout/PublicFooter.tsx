import React from 'react'
import { CONTACT_EMAIL, COPYRIGHT, FOOTER_COLUMNS, FOOTER_TAGLINE } from '~/config/marketing'
import AppLink from '~/components/ui/AppLink'
import { Container } from '~/components/ui/Container'
import { Logo } from '~/components/ui/Logo'

const FOOTER_LINK_CLASS = 'text-sm text-on-ink-soft hover:text-on-ink transition-colors'

/** Pied de page public : la seule surface sombre, qui ferme chaque page. */
const PublicFooter: React.FC = () => {
  return (
    <footer className="bg-ink py-16 text-on-ink-soft">
      <Container>
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
          <div className="space-y-5 md:col-span-4">
            <Logo size="md" tone="inverse" />
            <p className="max-w-sm text-sm leading-relaxed text-on-ink-soft">{FOOTER_TAGLINE}</p>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title} className="space-y-4 md:col-span-2">
              <h2 className="text-sm font-semibold text-on-ink">{column.title}</h2>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <AppLink href={link.href} className={FOOTER_LINK_CLASS}>
                      {link.label}
                    </AppLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="space-y-4 md:col-span-4">
            <h2 className="text-sm font-semibold text-on-ink">Contact</h2>
            <p className="text-sm text-on-ink-soft">
              Une question, une démo, l&apos;exercice de vos droits :
              <br />
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="break-all font-medium text-on-ink underline-offset-4 hover:underline"
              >
                {CONTACT_EMAIL}
              </a>
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-on-ink/10 pt-6 text-sm text-on-ink-muted md:flex-row md:items-center md:justify-between">
          <p>{COPYRIGHT}</p>
          <p>Hébergement et traitements dans l&apos;Union européenne.</p>
        </div>
      </Container>
    </footer>
  )
}

export default PublicFooter
