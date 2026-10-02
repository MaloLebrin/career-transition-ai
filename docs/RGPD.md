# RGPD — données des candidats, sous-traitants, droits

Référence opérationnelle pour les traitements de données personnelles de la
plateforme. Les pages publiques `/confidentialite` et `/securite` affichent la
même information depuis `shared/constants/legal.ts` (sous-traitants, durées de
conservation, contact) : **toute modification se fait d'abord dans ce fichier**,
puis ici.

Contact pour l'exercice des droits : `contact@transitioncarriere.fr`
(`PRIVACY_CONTACT_EMAIL`). Délai de réponse légal : **un mois** (art. 12).

## 1. Avant toute donnée réelle — checklist

- [ ] **Mistral : opt-out de l'utilisation des données pour l'entraînement.**
      Le plan gratuit _Experiment_ de La Plateforme autorise Mistral à
      utiliser les prompts pour améliorer ses modèles, sauf opt-out. Dans la
      [console](https://console.mistral.ai/) : _Admin / Privacy_ → désactiver
      l'usage des données pour l'entraînement (ou passer sur un plan payant
      qui l'exclut). Vérifier les conditions à jour du plan choisi. Les pages
      légales affirment qu'**aucune donnée n'est utilisée pour
      l'entraînement** : cette case doit être cochée avant la mise en ligne.
- [ ] **Hébergeur** : renseigner le prestataire et la région (UE) dans
      `SUBPROCESSORS` (`shared/constants/legal.ts`) et dans `SecurityPage.tsx`.
- [ ] **Resend** : vérifier la région du compte (UE ou États-Unis) et mettre à
      jour la localisation dans `SUBPROCESSORS`.
- [ ] **Sentry** (si `SENTRY_DSN` est défini) : organisation créée en **région EU**, stockage des IP désactivé — voir [DEPLOYMENT.md](DEPLOYMENT.md#suivi-des-erreurs-sentry).
- [ ] **Cloudinary** (stockage des fichiers) : région du compte (États-Unis par défaut, UE sur offre payante — issue #24) et localisation à jour dans `SUBPROCESSORS` — voir [DEPLOYMENT.md](DEPLOYMENT.md#stockage-des-fichiers-cloudinary).
- [ ] Mentions légales (`LegalNoticePage.tsx`) : éditeur, hébergeur.
- [ ] **CGU / CGV** (`/cgu`, `/cgv`, #95) : relecture par un conseil juridique,
      identité du vendeur et médiateur de la consommation dans `SELLER_IDENTITY`
      (`shared/constants/legal.ts`), politique de remboursement. **Prérequis à
      `STRIPE_ENABLED=true`** : aucun forfait ne se vend sans CGV publiées.
- [ ] **Stripe** (paiement du forfait particuliers, #102) : compte en mode
      live, région et localisation à jour dans `SUBPROCESSORS`.

## 2. Sous-traitants et flux de données

| Sous-traitant                          | Données                                                                                                                                             | Depuis                                                                        | Mesure                                                                                                                                                                                                                                                                                                               |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mistral AI** (France)                | Profil (poste, résumé, compétences, expériences, formations) et réponses aux exercices                                                              | Serveur : `AnalyzeExerciseQualitativeJob` (queue `ai`)                        | **Pseudonymisé** : `buildEmployeeAiProfile` n'inclut ni nom ni e-mail, et `pseudonymizeForAi` remplace le nom (complet, prénom, nom) et l'e-mail par `[candidat]` dans tout le texte libre, profil **et** données d'exercice (`shared/helpers/ai/exercise_profile.ts`).                                              |
| **Mistral AI** (France)                | **CV complet** (OCR `mistral-ocr-latest`) et son texte, pour pré-remplir le profil                                                                  | Serveur : `POST /dashboard/ai/cv` (`#services/ai_assist_service`)             | Non pseudonymisable : extraire nom, e-mail et parcours du CV est le but de l'import. Déclenché uniquement par l'utilisateur connecté qui importe son CV. Mistral ne conserve pas le fichier ; après une extraction réussie, le CV d'un candidat est conservé dans **ses documents** (Cloudinary, privé — issue #50). |
| **Mistral AI** (France)                | Récit libre (cartographie), compétences et poste visé (ciblage)                                                                                     | Serveur : `POST /dashboard/ai/skill-mapping`, `/dashboard/ai/targets`         | Récit **pseudonymisé** avec l'identité de l'utilisateur connecté (`pseudonymizeForAi`) ; le ciblage n'envoie aucune donnée identifiante.                                                                                                                                                                             |
| **Resend**                             | Nom, e-mail du destinataire, contenu des e-mails (invitation, notifications, formulaire de contact)                                                 | Serveur (`app/services/mail/`)                                                | `MAIL_PROVIDER=console` en dev/test.                                                                                                                                                                                                                                                                                 |
| **Hébergeur** (UE, à choisir)          | Toute la base PostgreSQL                                                                                                                            | —                                                                             | Voir [hosting.md](hosting.md).                                                                                                                                                                                                                                                                                       |
| **Cloudinary** (États-Unis par défaut) | Documents du candidat (CV importé, diplômes…) et synthèses PDF exportées (nom du candidat dans le contenu, jamais dans l'identifiant du fichier)    | Worker (écriture), serveur (lecture relayée) — `#services/cloudinary_service` | Fichiers **privés** (`authenticated`) : aucune URL publique, téléchargement relayé par le serveur après contrôle d'accès (URL signée de 5 min). PDF purgés à 30 jours ; documents conservés jusqu'à leur suppression ; tout est effacé par `candidate:purge`. Voir [CLOUDINARY.md](CLOUDINARY.md).                   |
| **Sentry** (région EU)                 | Message et pile d'appels des erreurs 5xx et des jobs en échec, méthode et route, **id** de l'utilisateur                                            | Serveur et worker (`#services/error_tracking_service`)                        | Actif seulement avec `SENTRY_DSN`. `scrubEvent` retire nom, e-mail, IP, cookies, corps de requête et query string ; le payload des jobs n'est jamais envoyé.                                                                                                                                                         |
| **Google Fonts**                       | Adresse IP du visiteur                                                                                                                              | Navigateur                                                                    | Auto-héberger les polices supprimerait ce transfert.                                                                                                                                                                                                                                                                 |
| **Stripe** (Irlande, États-Unis)       | Nom, e-mail, montant et identifiant de transaction du forfait particuliers ; données de carte saisies **chez Stripe** uniquement (Checkout hébergé) | Navigateur (page Stripe), serveur (webhook signé — #102, #104)                | Aucun script Stripe sur notre domaine, donc aucun cookie tiers (CSP et `Permissions-Policy: payment=()` inchangées). Nous ne stockons que le statut, le montant et les identifiants Stripe ; facture émise par Stripe.                                                                                               |

Règle de code : **aucun nom ni e-mail de candidat dans un prompt IA**. Tout
nouvel appel serveur à un fournisseur IA passe ses données par
`pseudonymizeForAi` (test de non-régression dans
`tests/integration/jobs/analyze_exercise_qualitative_job.spec.ts`).

## 3. Durées de conservation

Source : `RETENTION_PERIODS` (`shared/constants/legal.ts`).

| Données                                           | Durée                                                                                           |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Dossier candidat (profil, exercices, notes, plan) | Accompagnement, puis 3 ans après sa fin                                                         |
| Comptes utilisateurs des cabinets                 | Contrat, puis 3 ans                                                                             |
| Compte particulier (libre-service) et son dossier | 3 ans après la dernière connexion, ou dès la demande d'effacement                               |
| Données de paiement et factures (forfait)         | 10 ans (art. L123-22 Code de commerce) ; enregistrement anonymisé après effacement du compte    |
| Demandes de contact (prospection B2B)             | 3 ans après le dernier contact                                                                  |
| Demande d'accompagnement par un expert (B2C)      | Avec le dossier candidat : supprimée en cascade avec la fiche (`expert_requests`, #103)         |
| Documents du candidat (table `media`, Cloudinary) | Jusqu'à leur suppression (candidat ou conseiller), celle du dossier ou une demande d'effacement |
| Exports PDF générés                               | 30 jours (purge nocturne automatique, `PurgeExpiredPdfExportsJob`)                              |
| Journaux techniques et de sécurité                | 1 an                                                                                            |

Seuls les exports PDF sont purgés automatiquement. Pour le reste, il n'existe **pas encore de purge automatique** : à l'échéance, appliquer la
procédure d'effacement ci-dessous (ou le SQL du §5 pour les demandes de
contact).

### Cookies

Seul le cookie de session (strictement nécessaire, exempté de consentement)
est posé par la plateforme. Le paiement passe par la page hébergée de Stripe :
aucun script ni cookie tiers sur notre domaine, donc pas de bandeau cookies
tant qu'aucun traceur n'est ajouté [à confirmer juridiquement avec les CGU/CGV].

## 4. Demande d'accès / portabilité (candidat)

**En libre-service (#70).** Le candidat connecté télécharge lui-même la même
archive depuis son profil (« Mes données » → « Télécharger mes données »,
`GET /dashboard/candidat/data/export`, 5 exports par heure) : aucune action de
l'équipe. La procédure ci-dessous reste pour une demande reçue par e-mail ou
un candidat qui n'a plus accès à son compte.

1. Vérifier l'identité du demandeur (réponse depuis l'adresse e-mail du compte).
2. Retrouver l'identifiant de la fiche candidat (`employees.id`) :

   ```sql
   SELECT id, name, email, organization_id FROM employees WHERE email = 'personne@example.com';
   ```

3. Générer l'export :

   ```bash
   node ace candidate:export <employeeId>                 # → tmp/rgpd/Dossier_<Nom>.zip
   node ace candidate:export <employeeId> --out=/chemin/export.zip
   # depuis le build de production :
   node ace.js candidate:export <employeeId>
   ```

   Le ZIP contient le dossier PDF (identique au téléchargement conseiller :
   `profil.pdf`, `resultats/<exercice>.pdf`) et `donnees.json` : fiche,
   compte (sans mot de passe ni jeton), compétences, expériences, formations,
   résultats d'exercices bruts et analyses IA, plan d'accompagnement, notes,
   paiements du forfait (#94 : date, montant, statut, identifiants Stripe —
   jamais de numéro de carte, Stripe seul les détient), demandes
   d'accompagnement par un expert (#103 : message, disponibilités, statut,
   motif de refus, dates), liste des documents déposés ; les documents
   eux-mêmes sont dans `documents/<id>_<nom d'origine>`.

4. Transmettre le fichier par un canal sûr, puis **supprimer le ZIP** du
   serveur (`tmp/rgpd/`).

**Particuliers (B2C, #101).** L'export n'est **pas expurgé** des résultats
« réservés au forfait » : le droit d'accès (art. 15) porte sur toutes les données
que la personne nous a confiées, y compris ses réponses à un exercice qu'elle n'a
pas encore débloqué. Il n'y a rien à cacher : l'analyse IA d'un exercice
verrouillé n'est jamais produite avant paiement, et les pages du produit, elles,
sont verrouillées côté serveur (`app/mappers/results_access_mapper.ts`).

## 5. Demande d'effacement

### Candidat

**Demande faite depuis l'app (#70).** Le bouton « Demander l'effacement de
mes données » du profil (`POST /dashboard/candidat/data/erasure-request`)
enregistre la date dans `employees.erasure_requested_at` et envoie une
notification (cloche + e-mail) « Demande d'effacement des données — candidat #<employeeId> » à chaque super admin et au conseiller du candidat. La
notification ne porte que l'identifiant, jamais le nom ni l'e-mail. Le délai
d'un mois court à partir de cette date. Pour les demandes en attente :

```sql
SELECT id, organization_id, erasure_requested_at
FROM employees
WHERE erasure_requested_at IS NOT NULL
ORDER BY erasure_requested_at;
```

L'identité est déjà établie (le candidat était connecté) : appliquer
directement la commande ci-dessous. Elle supprime la fiche, donc la demande,
ainsi que les notifications liées (`meta.employeeId`).

```bash
node ace candidate:purge <employeeId>          # affiche ce qui sera supprimé, demande confirmation
node ace candidate:purge <employeeId> --force  # sans confirmation (scripts, shell non interactif)
```

Suppression **définitive**, en une transaction :

- la fiche `employees` et, par `ON DELETE CASCADE` : résultats d'exercices,
  expériences, formations, compétences, notes, étapes du plan / rendez-vous,
  synthèses, exports PDF, demandes d'accompagnement par un expert (#103 : le
  message libre du candidat part avec sa fiche) ;
- le compte `users` lié s'il a le rôle candidat (`employees.user_id` est en
  `SET NULL`, donc non couvert par la cascade) et, en cascade, ses jetons
  d'onboarding, jetons de réinitialisation de mot de passe et notifications — un compte conseiller/admin n'est jamais
  supprimé par cette commande ;
- les notifications de l'équipe qui portent sur ce candidat
  (`meta.employeeId` : conseillers, super admins, expert interne — y compris
  celles du parcours B2C : demande d'accompagnement, assignation, forfait) ;
- les documents déposés (table `media`, polymorphe donc hors cascade) ;
- après validation de la transaction, les fichiers sur Cloudinary : PDF
  générés (`pdf_exports.file_path`) et documents (`media.cloudinary_public_id`),
  supprimés avec invalidation du cache CDN.

**Conservés, anonymisés** : les paiements du forfait (`candidate_payments`, #94)
sont des pièces comptables gardées 10 ans (art. L123-22 Code de commerce). Leurs
clés `employee_id` et `user_id` sont en `ON DELETE SET NULL` : la ligne survit
sans aucun champ identifiant (montant, statut, dates, identifiants techniques
Stripe seulement). La commande affiche le nombre de paiements ainsi anonymisés
(`paymentsAnonymized`) et de demandes d'accompagnement supprimées
(`expertRequests`).

Restent hors de portée de la commande, à traiter à la main si nécessaire :
les **sauvegardes** de la base (l'effacement y devient effectif à leur
expiration — le mentionner dans la réponse), les e-mails déjà envoyés
(Resend conserve ses logs selon sa propre politique), les logs applicatifs.

### Demande de contact (prospect B2B)

```sql
DELETE FROM contact_requests WHERE email = 'personne@example.com';
```

### Répondre

Confirmer l'effacement au demandeur dans le délai d'un mois, en mentionnant
la durée de rétention des sauvegardes.
