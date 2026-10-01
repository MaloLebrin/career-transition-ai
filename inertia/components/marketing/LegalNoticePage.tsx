import { PRIVACY_CONTACT_EMAIL } from '#shared/constants/legal'
import AppLink from '~/components/ui/AppLink'
import { LegalDocument } from './LegalDocument'
import { LegalSection, Placeholder, Term } from './LegalSection'

export default function LegalNoticePage() {
  return (
    <LegalDocument
      eyebrow="Légal"
      title="Mentions légales"
      lead="Cette page fournit les informations légales relatives à l'éditeur du site et au traitement des contenus. Les informations ci-dessous sont à compléter avec les données exactes de l'entité éditrice et de l'hébergeur."
    >
      <LegalSection title="Éditeur du site">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <Term>Dénomination</Term> : <Placeholder />
          </li>
          <li>
            <Term>Forme juridique</Term> : <Placeholder />
          </li>
          <li>
            <Term>Adresse</Term> : <Placeholder />
          </li>
          <li>
            <Term>Email</Term> :{' '}
            <a
              href={`mailto:${PRIVACY_CONTACT_EMAIL}`}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {PRIVACY_CONTACT_EMAIL}
            </a>
          </li>
          <li>
            <Term>SIRET</Term> : <Placeholder />
          </li>
          <li>
            <Term>Directeur de la publication</Term> : <Placeholder />
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Hébergement">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <Term>Hébergeur</Term> : <Placeholder />
          </li>
          <li>
            <Term>Adresse</Term> : <Placeholder />
          </li>
          <li>
            <Term>Téléphone</Term> : <Placeholder />
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Propriété intellectuelle">
        <p>
          L&apos;ensemble du site, sa structure et ses contenus (textes, images, marques, éléments
          graphiques, bases de données, etc.) sont protégés par le droit de la propriété
          intellectuelle. Toute reproduction, représentation ou exploitation non autorisée est
          interdite.
        </p>
      </LegalSection>

      <LegalSection title="Responsabilité">
        <p>
          Les informations fournies sur le site sont données à titre indicatif. L&apos;éditeur ne
          saurait être tenu responsable d&apos;une mauvaise utilisation du service ou d&apos;une
          interruption temporaire.
        </p>
      </LegalSection>

      <LegalSection title="Données personnelles">
        <p>
          Pour plus d&apos;informations sur le traitement des données, consultez la{' '}
          <AppLink
            href="/confidentialite"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            politique de confidentialité
          </AppLink>
          .
        </p>
      </LegalSection>
    </LegalDocument>
  )
}
