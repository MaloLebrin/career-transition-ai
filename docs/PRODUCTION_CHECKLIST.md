# Checklist prod (à compléter au fil des livraisons)

Checklist des points à traiter avant ou pour la mise en production.

## Onboarding & emails

- [x] **Envoi d’email réel** — `MailService` (providers `resend` et `console`) et `OnboardingMailService` envoient les liens d’activation : voir [MAIL.md](MAIL.md). Envoi sans domaine tranché (issue #19) : domaine vérifié chez Resend.
- [ ] **Domaine vérifié chez Resend** — SPF/DKIM (+ DMARC), région EU, puis `MAIL_PROVIDER=resend`, `RESEND_API_KEY`, `MAIL_FROM_EMAIL=no-reply@<domaine>` : voir [MAIL.md](MAIL.md#domaine-vérifié-production-issue-19). D’ici là, `MAIL_PROVIDER=console` et lien lu dans les logs.
- [ ] **(Optionnel) Doublon Employee** — En cas de ré-invitation (même email, pas encore onboardé), éviter de créer un second `Employee` : réutiliser celui existant (recherche par email + organisation) ou documenter le comportement actuel.

## Sécurité & configuration

- [ ] **Secrets et variables d’environnement** — Vérifier que les clés (session, DB, API externes) sont en env et jamais en dur.
- [ ] **HTTPS** — Forcer HTTPS et cookies sécurisés en production.
- [ ] **CORS / CSP** — Ajuster les en-têtes si l’app est consommée par un autre domaine ou intégrée en iframe.
- [ ] **Paiement (épic B2C, `docs/STRIPE.md`)** — `STRIPE_ENABLED=false` tant que les CGV ne sont pas validées ; au passage à `true` : clés live, endpoint webhook et `STRIPE_WEBHOOK_SECRET` renseignés, prix TTC confirmé, test du parcours complet en mode test au préalable.

## Parcours particulier (épic B2C #90, `epics/b2c.md`)

- [ ] **CGU / CGV validées** — relecture juridique de `/cgu` et `/cgv`, identité du vendeur (SIREN, adresse), médiateur de la consommation et politique de remboursement renseignés dans `shared/constants/legal.ts` ; `TERMS_VERSION` incrémentée si les textes changent.
- [ ] **Décisions PO ouvertes** — prix TTC / TVA du forfait (`B2C_RESULTS_PRICE_CENTS`), restitution des notes privées des conseillers dans l'export (`PRIVATE_NOTES_IN_EXPORT`, #97), indexation SEO de `/particuliers` et `/inscription`.
- [ ] **Ouverture des inscriptions** — `B2C_REGISTRATION_ENABLED=true` seulement quand l'épic est complet et recetté ([MANUAL_TESTS.md](MANUAL_TESTS.md) § 11).
- [ ] **Stripe en production** — compte activé, factures configurées, `STRIPE_ENABLED=true`, `STRIPE_SECRET_KEY=sk_live_…`, endpoint `https://<domaine>/webhooks/stripe` abonné aux cinq événements ([STRIPE.md](STRIPE.md)) et `STRIPE_WEBHOOK_SECRET=whsec_…` ; parcours complet rejoué en mode test juste avant.
- [ ] **Équipe interne** — au moins un expert interne invité depuis `/dashboard/super-admin/team` avant d'ouvrir les demandes d'accompagnement.

## Rétention RGPD (écart connu)

- [ ] Les durées publiées sur `/confidentialite` (3 ans, 1 an…) sont des **maximums** : seule la purge des exports PDF est automatique. Prévoir un passage manuel au moins annuel (`node ace candidate:purge <id>` pour les comptes particuliers inactifs depuis 3 ans et les dossiers clos depuis 3 ans, SQL de `docs/RGPD.md` §5 pour les demandes de contact) et vérifier la rétention des journaux (hébergeur, Sentry), jusqu'à l'automatisation (`docs/RGPD.md` §3).

## Qualité & robustesse

- [ ] **Tests** — Ajouter ou compléter les tests (onboarding, super admin, parcours critiques) pour limiter les régressions.
- [x] **Monitoring / erreurs** — Sentry (5xx serveur et jobs en échec définitif), activé par `SENTRY_DSN` : mise en place et vérification dans [DEPLOYMENT.md](DEPLOYMENT.md#suivi-des-erreurs-sentry). Page de secours React (`ErrorBoundary`).
- [ ] **Lenteurs** — Pas de suivi des temps de réponse (traces Sentry désactivées pour le quota gratuit).
- [ ] **Logs** — Configurer le niveau de log et la rotation en production.

## Données & performance

- [ ] **Pagination** — Activer ou renforcer la pagination sur les listes (candidats, organisations, utilisateurs super admin) si le volume augmente.
- [x] **Sauvegardes** — Scénario 2 : `deploy/backup.sh` + crontab sur la VM ; scénario 1 : `pg_dump` manuel de la base Neon. Procédures dans [DEPLOYMENT.md](DEPLOYMENT.md) §1.5 et §2.6.
- [ ] **Migrations** — Tester les migrations sur une copie de la prod avant déploiement.

## Fonctionnel

- [ ] **Messages utilisateur** — Vérifier les textes (flash, erreurs, emails) et les faire relire si besoin.
- [ ] **Design / responsive** — Contrôler les écrans clés sur mobile et tablette.
