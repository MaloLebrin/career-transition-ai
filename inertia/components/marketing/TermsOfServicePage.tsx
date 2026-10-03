import { PRIVACY_CONTACT_EMAIL, SELLER_IDENTITY, TERMS_VERSION } from '#shared/constants/legal'
import AppLink from '~/components/ui/AppLink'
import { LegalDocument } from './LegalDocument'
import { LegalSection, Placeholder, Term } from './LegalSection'

const LINK_CLASS = 'font-medium text-accent underline-offset-4 hover:underline'

/** Mention portée par chaque section rédigée sans relecture juridique (#95). */
export const LEGAL_REVIEW_NOTICE = '[à valider par un conseil juridique]'

/**
 * Conditions générales d'utilisation de la plateforme : cabinets clients et
 * leurs utilisateurs, particuliers inscrits en libre-service. La vente du
 * forfait particuliers est régie par les CGV (/cgv).
 */
export default function TermsOfServicePage() {
  return (
    <LegalDocument
      eyebrow="Légal"
      title="Conditions générales d’utilisation"
      lead="Ces conditions encadrent l’accès à la plateforme et son utilisation par les cabinets, leurs conseillers, les candidats qu’ils accompagnent et les particuliers inscrits en libre-service. Elles sont acceptées à la création du compte."
      updatedAt={`${TERMS_VERSION} — ${LEGAL_REVIEW_NOTICE}`}
    >
      <LegalSection title="Éditeur et objet">
        <p>
          La plateforme est éditée par <Term>{SELLER_IDENTITY.name}</Term> (
          {SELLER_IDENTITY.legalForm}, {SELLER_IDENTITY.siren}, {SELLER_IDENTITY.address}). Elle
          propose des outils de bilan de compétences et de transition professionnelle : exercices,
          analyses assistées par intelligence artificielle, synthèse et accompagnement par un
          conseiller.
        </p>
      </LegalSection>

      <LegalSection title="Comptes et accès">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <Term>Cabinets</Term> : l’organisation cliente crée les comptes de ses conseillers et
            invite ses candidats ; elle répond de l’usage qu’en font ses utilisateurs.
          </li>
          <li>
            <Term>Particuliers</Term> : toute personne majeure peut créer un compte en
            libre-service. Les exercices Motivations et Valeurs sont gratuits ; les autres
            exercices, les résultats, les analyses et la synthèse sont débloqués par le forfait
            décrit dans les{' '}
            <AppLink href="/cgv" className={LINK_CLASS}>
              conditions générales de vente
            </AppLink>
            .
          </li>
          <li>
            Les identifiants sont personnels. L’utilisateur signale sans délai toute utilisation non
            autorisée de son compte.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Usage de la plateforme">
        <p>
          L’utilisateur s’engage à fournir des informations exactes, à n’importer que des documents
          dont il détient les droits et à ne pas détourner le service (extraction massive,
          contournement des accès, usage illicite). L’éditeur peut suspendre un compte en cas de
          manquement, après information de l’utilisateur sauf urgence.
        </p>
      </LegalSection>

      <LegalSection title="Analyses assistées par intelligence artificielle">
        <p>
          Les analyses, suggestions et synthèses produites par la plateforme sont des aides à la
          réflexion. Elles ne constituent ni un avis professionnel ni une garantie de résultat : les
          décisions d’orientation appartiennent à l’utilisateur et, le cas échéant, à son
          conseiller.
        </p>
      </LegalSection>

      <LegalSection title="Propriété intellectuelle">
        <p>
          La plateforme, sa méthode et ses contenus sont protégés. L’utilisateur reste propriétaire
          des contenus qu’il saisit ou importe et accorde à l’éditeur le droit de les traiter pour
          fournir le service, dans les conditions de la{' '}
          <AppLink href="/confidentialite" className={LINK_CLASS}>
            politique de confidentialité
          </AppLink>
          .
        </p>
      </LegalSection>

      <LegalSection title="Disponibilité et responsabilité">
        <p>
          L’éditeur met en œuvre des moyens raisonnables pour assurer la disponibilité du service,
          sans garantie d’absence d’interruption. Sa responsabilité ne saurait être engagée pour un
          dommage indirect ni au-delà des sommes effectivement versées par l’utilisateur au cours
          des douze derniers mois. <Placeholder>{LEGAL_REVIEW_NOTICE}</Placeholder>
        </p>
      </LegalSection>

      <LegalSection title="Résiliation">
        <p>
          Un particulier peut fermer son compte à tout moment depuis son profil (demande
          d’effacement) ; un cabinet met fin au service dans les conditions de son contrat. Les
          données sont conservées puis effacées selon les durées de la politique de confidentialité.
        </p>
      </LegalSection>

      <LegalSection title="Droit applicable et contact">
        <p>
          Les présentes conditions sont soumises au droit français. Toute question s’adresse à{' '}
          <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`} className={LINK_CLASS}>
            {PRIVACY_CONTACT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>
    </LegalDocument>
  )
}
