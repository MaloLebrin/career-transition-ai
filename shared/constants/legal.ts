/**
 * Informations RGPD affichées sur /confidentialite et /securite, et reprises
 * dans docs/RGPD.md. Une seule source : un nouveau sous-traitant ou une
 * nouvelle durée se change ici.
 */

/** Adresse pour exercer ses droits (accès, rectification, effacement…). */
export const PRIVACY_CONTACT_EMAIL = 'contact@francetransitioncarriere.fr'

/** Délai légal de réponse à une demande d'exercice de droits (art. 12 RGPD). */
export const PRIVACY_REQUEST_DELAY = 'un mois'

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
    name: 'Google Fonts',
    purpose: 'Chargement des polices de caractères du site (adresse IP transmise).',
    location: 'États-Unis (clauses contractuelles types)',
  },
]

export interface RetentionPeriod {
  data: string
  duration: string
}

export const RETENTION_PERIODS: RetentionPeriod[] = [
  {
    data: 'Dossier candidat (profil, exercices, notes, plan d’accompagnement)',
    duration: 'Durée de l’accompagnement, puis 3 ans après sa fin',
  },
  {
    data: 'Comptes utilisateurs des cabinets',
    duration: 'Durée du contrat avec le cabinet, puis 3 ans',
  },
  { data: 'Demandes de contact et prospection B2B', duration: '3 ans après le dernier contact' },
  { data: 'Journaux techniques et de sécurité', duration: '1 an' },
]
