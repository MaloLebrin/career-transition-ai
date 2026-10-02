/**
 * Informations légales affichées sur /confidentialite, /securite, /cgu et /cgv,
 * et reprises dans docs/RGPD.md. Une seule source : un nouveau sous-traitant,
 * une nouvelle durée ou une nouvelle version des conditions se change ici.
 */

/** Adresse pour exercer ses droits (accès, rectification, effacement…). */
export const PRIVACY_CONTACT_EMAIL = 'contact@transitioncarriere.fr'

/** Délai légal de réponse à une demande d'exercice de droits (art. 12 RGPD). */
export const PRIVACY_REQUEST_DELAY = 'un mois'

/**
 * Version des CGU / CGV en vigueur (date ISO). Enregistrée sur le compte à
 * l'inscription (`users.terms_version`, #93) et à l'achat du forfait (#102) :
 * toute modification substantielle des conditions change cette valeur.
 */
export const TERMS_VERSION = '2026-10-01'

export interface SellerIdentity {
  /** Raison sociale de l'éditeur et vendeur du forfait particuliers. */
  name: string
  legalForm: string
  siren: string
  address: string
  email: string
  /** Médiateur de la consommation (art. L612-1 Code de la consommation). */
  mediator: string
}

/** Identité du vendeur (CGV, facture). Placeholders tant que le PO ne l'a pas fournie (#95). */
export const SELLER_IDENTITY: SellerIdentity = {
  name: 'Transition Carrière',
  legalForm: '[forme juridique à compléter]',
  siren: '[SIREN à compléter]',
  address: '[adresse à compléter]',
  email: PRIVACY_CONTACT_EMAIL,
  mediator: '[médiateur de la consommation à compléter]',
}

/**
 * Information précontractuelle sur le droit de rétractation d'un contenu
 * numérique exécuté immédiatement (Code de la consommation, art. L221-28 13°) :
 * le consommateur demande l'exécution avant la fin du délai de quatorze jours
 * et renonce expressément à son droit de rétractation. Affiché sur /cgv et
 * sous la case à cocher du paiement (#102).
 */
export const WITHDRAWAL_NOTICE =
  'Le forfait donne un accès immédiat à des contenus numériques (résultats, analyses, synthèse). En cochant la case, vous demandez expressément que l’exécution commence dès le paiement et reconnaissez perdre votre droit de rétractation de quatorze jours (art. L221-28 13° du Code de la consommation).'

export interface Subprocessor {
  name: string
  purpose: string
  location: string
}

export const SUBPROCESSORS: Subprocessor[] = [
  {
    name: 'Mistral AI',
    purpose:
      'Analyse des exercices, suggestions et lecture des CV importés par intelligence artificielle, depuis nos serveurs. Le nom et l’e-mail du candidat sont retirés des analyses ; un CV importé est transmis tel quel pour pré-remplir le profil.',
    location: 'France (UE)',
  },
  {
    name: 'Resend',
    purpose:
      'Envoi des e-mails transactionnels (invitations, notifications, formulaire de contact).',
    location: 'Région du compte (UE ou États-Unis, clauses contractuelles types) [à confirmer]',
  },
  {
    name: 'Hébergeur applicatif et base de données',
    purpose: 'Hébergement de la plateforme et des données. [prestataire à compléter]',
    location: 'Union européenne',
  },
  {
    name: 'Sentry',
    purpose:
      'Suivi des erreurs techniques de la plateforme (message d’erreur, pile d’appels, identifiant technique du compte ; ni nom, ni e-mail, ni adresse IP).',
    location: 'Union européenne (région EU de Sentry)',
  },
  {
    name: 'Cloudinary',
    purpose:
      'Stockage des fichiers : documents déposés par les candidats et leurs conseillers (dont le CV importé) et synthèses PDF exportées, en accès privé (chaque téléchargement passe par nos serveurs après contrôle des droits) ; logo des cabinets (public).',
    location: 'États-Unis par défaut (clauses contractuelles types) [région à confirmer]',
  },
  {
    name: 'Google Fonts',
    purpose: 'Chargement des polices de caractères du site (adresse IP transmise).',
    location: 'États-Unis (clauses contractuelles types)',
  },
  {
    name: 'Stripe',
    purpose:
      'Paiement par carte du forfait particuliers (page de paiement hébergée par Stripe : nom, e-mail, montant ; les données de carte ne transitent jamais par nos serveurs) et émission des factures.',
    location: 'Irlande (UE) et États-Unis (clauses contractuelles types)',
  },
]

export interface RetentionPeriod {
  data: string
  duration: string
}

/**
 * Les durées sont des **maximums** : à ce jour, seule la purge des exports PDF
 * est automatique (`PurgeExpiredPdfExportsJob`). Le reste est effacé à la
 * demande de la personne ou par traitement manuel (`candidate:purge`), en
 * attendant une purge automatique. Cf. docs/RGPD.md §3.
 */
export const RETENTION_NOTICE =
  'Ces durées sont des maximums de conservation. Vous pouvez demander l’effacement de vos données à tout moment ; les effacements sont traités à la demande et les purges à l’échéance sont effectuées par notre équipe (automatisation à venir).'

export const RETENTION_PERIODS: RetentionPeriod[] = [
  {
    data: 'Dossier candidat (profil, exercices, notes, plan d’accompagnement)',
    duration: 'Durée de l’accompagnement, puis 3 ans au maximum après sa fin',
  },
  {
    data: 'Comptes utilisateurs des cabinets (conseillers, administrateurs, candidats invités)',
    duration: 'Durée du contrat avec le cabinet, puis 3 ans au maximum',
  },
  {
    data: 'Compte particulier (inscription en libre-service) et son dossier, y compris ses demandes d’accompagnement',
    duration: '3 ans au maximum après la dernière connexion, ou dès la demande d’effacement',
  },
  {
    data: 'Données de paiement et factures du forfait particuliers',
    duration:
      '10 ans (art. L123-22 du Code de commerce) ; enregistrement anonymisé après effacement du compte',
  },
  {
    data: 'Demandes de contact et prospection B2B',
    duration: '3 ans au maximum après le dernier contact',
  },
  {
    data: 'Documents du candidat (CV importé, diplômes, attestations…)',
    duration: 'Jusqu’à leur suppression, celle du dossier ou une demande d’effacement',
  },
  { data: 'Exports PDF générés (synthèses)', duration: '30 jours, puis régénérables' },
  { data: 'Journaux techniques et de sécurité', duration: '1 an au maximum' },
]

/**
 * Export RGPD (#97) : les notes `private` des conseillers (appréciations
 * internes que le candidat ne voit jamais dans l'application) sont-elles
 * restituées au titre du droit d'accès (art. 15) ? Arbitrage PO / juridique
 * en cours (question 9 de l'épic #90) : en attendant, statu quo — incluses,
 * mais séparées dans `advisorPrivateNotes` ; `candidate:export
 * --without-private-notes` permet de les écarter au cas par cas.
 */
export const PRIVATE_NOTES_IN_EXPORT = true
