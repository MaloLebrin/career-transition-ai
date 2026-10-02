import {
  PRIVACY_CONTACT_EMAIL,
  SELLER_IDENTITY,
  TERMS_VERSION,
  WITHDRAWAL_NOTICE,
} from '#shared/constants/legal'
import AppLink from '~/components/ui/AppLink'
import { LegalDocument } from './LegalDocument'
import { LegalSection, Placeholder, Term } from './LegalSection'
import { LEGAL_REVIEW_NOTICE } from './TermsOfServicePage'

const LINK_CLASS = 'font-medium text-accent underline-offset-4 hover:underline'

/**
 * Conditions générales de vente du forfait particuliers (paiement unique,
 * Stripe Checkout — #102). Le prix affiché est fourni par la page d'offre ;
 * ces conditions en fixent le cadre contractuel.
 */
export default function TermsOfSalePage() {
  return (
    <LegalDocument
      eyebrow="Légal"
      title="Conditions générales de vente"
      lead="Ces conditions s’appliquent à l’achat, par un particulier, du forfait qui débloque l’ensemble des exercices, les résultats, les analyses et la synthèse de son parcours. Les cabinets sont régis par leur contrat et leur devis."
      updatedAt={`${TERMS_VERSION} — ${LEGAL_REVIEW_NOTICE}`}
    >
      <LegalSection title="Vendeur">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <Term>Dénomination</Term> : {SELLER_IDENTITY.name}
          </li>
          <li>
            <Term>Forme juridique</Term> : <Placeholder>{SELLER_IDENTITY.legalForm}</Placeholder>
          </li>
          <li>
            <Term>SIREN</Term> : <Placeholder>{SELLER_IDENTITY.siren}</Placeholder>
          </li>
          <li>
            <Term>Adresse</Term> : <Placeholder>{SELLER_IDENTITY.address}</Placeholder>
          </li>
          <li>
            <Term>Contact</Term> :{' '}
            <a href={`mailto:${SELLER_IDENTITY.email}`} className={LINK_CLASS}>
              {SELLER_IDENTITY.email}
            </a>
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Objet du forfait">
        <p>
          Le forfait est un <Term>paiement unique</Term> qui débloque, pour le compte de l’acheteur
          : l’accès à l’ensemble des exercices du parcours, la consultation des résultats et des
          analyses assistées par intelligence artificielle, la synthèse et son export PDF, ainsi que
          la possibilité de demander un accompagnement par un expert. L’accompagnement lui-même fait
          l’objet d’un accord distinct. Les exercices Motivations et Valeurs restent gratuits.
        </p>
      </LegalSection>

      <LegalSection title="Prix et paiement">
        <p>
          Le prix est affiché <Term>toutes taxes comprises</Term> sur la page d’offre avant tout
          paiement. Le règlement s’effectue par carte bancaire sur la page de paiement sécurisée de
          notre prestataire Stripe ; les données de carte ne transitent jamais par nos serveurs. Une
          facture est émise par Stripe et envoyée à l’adresse e-mail du compte.
        </p>
      </LegalSection>

      <LegalSection title="Livraison">
        <p>
          L’accès est débloqué <Term>immédiatement</Term> après confirmation du paiement, sur le
          compte depuis lequel l’achat a été réalisé. Il est personnel, non cessible et sans
          limitation de durée tant que le compte existe.
        </p>
      </LegalSection>

      <LegalSection title="Droit de rétractation">
        <p>{WITHDRAWAL_NOTICE}</p>
        <p>
          Sans cette demande expresse, le droit de rétractation de quatorze jours s’exerce par écrit
          à l’adresse de contact ; le remboursement intervient sous quatorze jours par le même moyen
          de paiement. <Placeholder>{LEGAL_REVIEW_NOTICE}</Placeholder>
        </p>
      </LegalSection>

      <LegalSection title="Remboursement et révocation">
        <p>
          En cas de remboursement, pour quelque motif que ce soit, l’accès aux contenus débloqués
          par le forfait est retiré. Les exercices gratuits et le compte restent accessibles.
        </p>
      </LegalSection>

      <LegalSection title="Garanties et responsabilité">
        <p>
          Le service est fourni conformément à sa description. Les analyses et synthèses sont des
          aides à la réflexion et n’emportent aucune garantie de résultat professionnel. Les
          garanties légales de conformité des contenus et services numériques (art. L224-25-12 et
          suivants du Code de la consommation) s’appliquent.
        </p>
      </LegalSection>

      <LegalSection title="Réclamation et médiation">
        <p>
          Toute réclamation s’adresse d’abord à{' '}
          <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`} className={LINK_CLASS}>
            {PRIVACY_CONTACT_EMAIL}
          </a>
          . À défaut de solution amiable, le consommateur peut saisir gratuitement le médiateur de
          la consommation : <Placeholder>{SELLER_IDENTITY.mediator}</Placeholder>, ou la plateforme
          européenne de règlement en ligne des litiges.
        </p>
      </LegalSection>

      <LegalSection title="Données personnelles et droit applicable">
        <p>
          Les données traitées pour l’achat sont décrites dans la{' '}
          <AppLink href="/confidentialite" className={LINK_CLASS}>
            politique de confidentialité
          </AppLink>
          . L’usage de la plateforme reste soumis aux{' '}
          <AppLink href="/cgu" className={LINK_CLASS}>
            conditions générales d’utilisation
          </AppLink>
          . Les présentes conditions sont soumises au droit français.
        </p>
      </LegalSection>
    </LegalDocument>
  )
}
