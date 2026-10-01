# Épic B2C — candidat autonome, forfait payant, accompagnement par un expert

Suivi GitHub : épic [#90](https://github.com/MaloLebrin/career-transition-ai/issues/90)
(sous-issues #92 à #108). Branche d'intégration : `epic/b2c`.

## Objectif

Ouvrir un canal B2C à côté du B2B existant (cabinets → conseillers → candidats) :

1. Un particulier s'inscrit seul (`/inscription`), sans organisation cliente.
2. Les exercices **Motivations** et **Valeurs** sont gratuits et viennent en premier ;
   le reste (autres exercices, résultats, analyses IA, synthèse, PDF) est débloqué par
   un **forfait payé une fois** (Stripe Checkout hébergé).
3. Une fois payé, le candidat peut **demander à être accompagné** par un expert
   interne ; les super admins assignent l'expert.

## Décisions produit

| Sujet            | Décision                                                                                                                                                                                     |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Données          | Les B2C sont rattachés à l'**organisation plateforme** (`organizations.is_platform`, slug `ai-transition-carriere`) avec `employees.account_type = 'b2c'`. Pas de `organizationId` nullable. |
| Paiement         | Stripe Checkout hébergé, `mode: payment`, webhook signé, facture Stripe. Aucun Stripe.js dans le bundle (CSP inchangée).                                                                     |
| Gratuit / payant | `motivation` et `values` gratuits ; tout le reste verrouillé **côté serveur** (payloads expurgés). Analyse IA lancée seulement si autorisée.                                                 |
| Accompagnement   | Demande in-app → notification des super admins → assignation d'un expert interne (`employees.advisor_id`, rôle `advisor` de l'organisation plateforme).                                      |
| Flags            | `B2C_REGISTRATION_ENABLED` (défaut `!inProduction`) et `STRIPE_ENABLED` (défaut `false`) : les fusions partielles n'ont aucun effet en production.                                           |

## Issues et phases

| Phase                                        | Issues                                             |
| -------------------------------------------- | -------------------------------------------------- |
| 1 — Fondation, inscription, parcours gratuit | #92, #93, #94, #98, #100, #101                     |
| 2 — Paywall, Stripe, légal                   | #95 (avant `STRIPE_ENABLED=true`), #102, #104, #99 |
| 3 — Expert et back-office                    | #103, #105, #107                                   |
| 4 — RGPD, bugs préexistants, documentation   | #106, #96, #97, #108                               |

## Workflow Git

Le chantier est livré **d'un bloc** dans `main` : rien de B2C n'atteint `main` tant que
l'ensemble n'est pas terminé et validé.

1. `epic/b2c` est créée depuis `main` une fois, au démarrage ; une PR **draft**
   `epic/b2c → main` (`Closes #90`) suit l'avancement et reste en draft jusqu'à la fin.
2. **Une issue = une branche `feat/b2c-<slug>` = une PR vers `epic/b2c`** (jamais `main`),
   corps rempli depuis `.github/pull_request_template.md`, **squash** dans `epic/b2c`.
   La CI tourne sur chaque PR comme d'habitude.
3. Une PR vers `epic/b2c` ne ferme pas l'issue automatiquement (GitHub ne ferme que sur la
   branche par défaut) : écrire `Refs #<n>` et **fermer l'issue à la main** après merge.
4. Synchroniser régulièrement `main` dans `epic/b2c` par **merge commit** (jamais de rebase
   ni de force-push sur la branche partagée).
5. Livraison : toutes les sous-issues fermées, CI verte, recette manuelle faite
   (`../MANUAL_TESTS.md`, #108) → passer la PR `epic/b2c → main` en « ready for review » et
   la fusionner par **merge commit** (pas squash : un commit par issue dans `main`).
6. Les changelogs `../changelog/` sont ajoutés par chaque PR vers `epic/b2c` (un fichier par
   issue) et arrivent dans `main` avec la PR finale.

## Objets transverses

- **Env** : `B2C_REGISTRATION_ENABLED`, `STRIPE_ENABLED`, `STRIPE_SECRET_KEY`,
  `STRIPE_WEBHOOK_SECRET`, `B2C_RESULTS_PRICE_CENTS` — déclarées dans `start/env_schema.ts`,
  optionnelles, requises en production si `STRIPE_ENABLED`.
- **Tables** : `candidate_payments`, `stripe_events`, `expert_requests` ; colonnes
  `organizations.is_platform`, `employees.account_type`, `users.terms_accepted_at`,
  `users.terms_version`, `users.email_verified_at`.
- **Notifications** : `ai_analysis_ready_candidate`, `results_unlocked`,
  `results_access_revoked`, `expert_request_created`, `expert_assigned`,
  `candidate_assigned`, `expert_request_declined`.
- **Acteurs de test** : `createPlatformOrganization`, `createB2cCandidate`,
  `createInHouseExpert`, `swapFakeStripe` / `restoreStripe`.
