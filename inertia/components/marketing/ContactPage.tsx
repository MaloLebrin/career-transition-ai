import { CONTACT_EMAIL } from '~/config/marketing'
import PublicLayout from '../layout/PublicLayout'
import AppLink from '../ui/AppLink'
import Card from '../ui/Card'
import { SectionHeading } from '../ui/SectionHeading'
import { ContactDemoForm } from './ContactDemoForm'
import { MarketingSection } from './MarketingSection'
import { PageHero } from './PageHero'

export default function ContactPage() {
  return (
    <PublicLayout>
      <PageHero
        eyebrow="Contact"
        title="Une question ? Écrivez-nous."
        description="Compte, résultats, données personnelles ou partenariat : notre équipe vous répond sous 48 h ouvrées."
      />

      <MarketingSection tone="surface">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="space-y-6 lg:col-span-5">
            <SectionHeading
              eyebrow="Autres moyens"
              title="Nous joindre directement"
              description="Le formulaire est le moyen le plus rapide. Vous pouvez aussi nous écrire par e-mail."
            />
            <p className="text-sm text-muted">
              E-mail :{' '}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="font-medium text-accent underline-offset-4 hover:underline"
              >
                {CONTACT_EMAIL}
              </a>
            </p>
            <p className="text-sm text-muted">
              Vous êtes un cabinet et souhaitez une présentation ?{' '}
              <AppLink
                href="/cabinets#demo"
                className="font-medium text-accent underline-offset-4 hover:underline"
              >
                Demander une démo
              </AppLink>
              . Pour exercer vos droits sur vos données, consultez la{' '}
              <AppLink
                href="/confidentialite"
                className="font-medium text-accent underline-offset-4 hover:underline"
              >
                politique de confidentialité
              </AppLink>
              .
            </p>
          </div>
          <Card padding="md" className="lg:col-span-7 md:p-8">
            <ContactDemoForm variant="contact" title="" description="" />
          </Card>
        </div>
      </MarketingSection>
    </PublicLayout>
  )
}
