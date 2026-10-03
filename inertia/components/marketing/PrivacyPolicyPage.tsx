import {
  PRIVACY_CONTACT_EMAIL,
  PRIVACY_REQUEST_DELAY,
  RETENTION_NOTICE,
  RETENTION_PERIODS,
  SUBPROCESSORS,
} from '#shared/constants/legal'
import AppLink from '~/components/ui/AppLink'
import { LegalDocument } from './LegalDocument'
import { LegalSection, Term } from './LegalSection'

const MAIL_LINK_CLASS = 'font-medium text-accent underline-offset-4 hover:underline'

export default function PrivacyPolicyPage() {
  return (
    <LegalDocument
      eyebrow="RGPD"
      title="Politique de confidentialité"
      lead="Cette page décrit, de façon transparente, les traitements de données personnelles réalisés via le site et la plateforme : données collectées, finalités, durées de conservation, sous-traitants et exercice de vos droits."
    >
      <LegalSection title="Responsable de traitement">
        <p>
          <Term>Transition Carrière</Term> — contact :{' '}
          <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`} className={MAIL_LINK_CLASS}>
            {PRIVACY_CONTACT_EMAIL}
          </a>
          . Pour les candidats accompagnés, le cabinet ou l&apos;organisation qui vous suit agit
          comme responsable de traitement ; la plateforme intervient pour son compte.
        </p>
      </LegalSection>

      <LegalSection title="Données collectées">
        <ul className="list-disc space-y-2 pl-5">
          <li>Données d&apos;identification (nom, email) selon les formulaires</li>
          <li>Données liées au compte (rôles, accès, organisation)</li>
          <li>
            Contenus saisis dans le cadre de l&apos;accompagnement (CV, parcours, réponses aux
            exercices, notes, livrables)
          </li>
          <li>Données techniques (logs, sécurité, prévention des abus)</li>
        </ul>
      </LegalSection>

      <LegalSection title="Finalités et bases légales">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Fourniture du service d&apos;accompagnement (exécution du contrat conclu avec le cabinet
            ou l&apos;organisation)
          </li>
          <li>
            Analyses assistées par IA des exercices, au service du conseiller (intérêt légitime,
            données pseudonymisées)
          </li>
          <li>Support et sécurité, prévention des abus (intérêt légitime)</li>
          <li>Prospection B2B via le formulaire de contact (consentement)</li>
        </ul>
      </LegalSection>

      <LegalSection title="Particuliers inscrits en libre-service">
        <p>
          Pour un compte créé sans cabinet, <Term>Transition Carrière</Term> est responsable de
          traitement. Le traitement repose sur l’exécution du contrat (
          <AppLink href="/cgu" className={MAIL_LINK_CLASS}>
            conditions d’utilisation
          </AppLink>
          ,{' '}
          <AppLink href="/cgv" className={MAIL_LINK_CLASS}>
            conditions de vente
          </AppLink>
          ) : parcours, résultats, analyses assistées par IA pseudonymisées, demande
          d’accompagnement. Le paiement du forfait est confié à Stripe ; nous ne recevons que la
          confirmation du paiement, le montant et l’identifiant de la transaction, jamais les
          données de carte. Les factures sont conservées dix ans au titre des obligations
          comptables, sous une forme anonymisée après effacement du compte.
        </p>
      </LegalSection>

      <LegalSection title="Durées de conservation">
        <p>{RETENTION_NOTICE}</p>
        <ul className="list-disc space-y-2 pl-5">
          {RETENTION_PERIODS.map((period) => (
            <li key={period.data}>
              {period.data} : <Term>{period.duration}</Term>
            </li>
          ))}
        </ul>
      </LegalSection>

      <LegalSection title="Sous-traitants et transferts">
        <p>
          Les données sont hébergées dans l&apos;Union européenne. Les prestataires suivants
          interviennent pour notre compte, dans le cadre d&apos;engagements contractuels de
          confidentialité ; aucune donnée n&apos;est utilisée pour entraîner des modèles d&apos;IA.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          {SUBPROCESSORS.map((subprocessor) => (
            <li key={subprocessor.name}>
              <Term>{subprocessor.name}</Term> — {subprocessor.purpose}{' '}
              <span className="text-muted">({subprocessor.location})</span>
            </li>
          ))}
        </ul>
      </LegalSection>

      <LegalSection title="Vos droits">
        <p>
          Vous disposez des droits d&apos;accès, rectification, effacement, opposition, limitation
          et portabilité. Pour les exercer, écrivez à{' '}
          <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`} className={MAIL_LINK_CLASS}>
            {PRIVACY_CONTACT_EMAIL}
          </a>{' '}
          : nous répondons dans un délai d&apos;{PRIVACY_REQUEST_DELAY}. Vous pouvez aussi
          introduire une réclamation auprès de la CNIL (cnil.fr).
        </p>
      </LegalSection>
    </LegalDocument>
  )
}
