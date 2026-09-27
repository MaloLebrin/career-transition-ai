# Checklist prod (à compléter au fil des livraisons)

Checklist des points à traiter avant ou pour la mise en production.

## Onboarding & emails

- [ ] **Envoi d’email réel** — Remplacer le stub dans `app/services/onboarding_notify_service.ts` par un vrai envoi (ex. `@adonisjs/mail`) pour les liens d’activation candidats.
- [ ] **(Optionnel) Doublon Employee** — En cas de ré-invitation (même email, pas encore onboardé), éviter de créer un second `Employee` : réutiliser celui existant (recherche par email + organisation) ou documenter le comportement actuel.

## Sécurité & configuration

- [ ] **Secrets et variables d’environnement** — Vérifier que les clés (session, DB, API externes) sont en env et jamais en dur.
- [ ] **HTTPS** — Forcer HTTPS et cookies sécurisés en production.
- [ ] **CORS / CSP** — Ajuster les en-têtes si l’app est consommée par un autre domaine ou intégrée en iframe.

## Qualité & robustesse

- [ ] **Tests** — Ajouter ou compléter les tests (onboarding, super admin, parcours critiques) pour limiter les régressions.
- [x] **Monitoring / erreurs** — Sentry (5xx serveur et jobs en échec définitif), activé par `SENTRY_DSN` : mise en place et vérification dans [DEPLOYMENT.md](DEPLOYMENT.md#suivi-des-erreurs-sentry). Page de secours React (`ErrorBoundary`).
- [ ] **Lenteurs** — Pas de suivi des temps de réponse (traces Sentry désactivées pour le quota gratuit).
- [ ] **Logs** — Configurer le niveau de log et la rotation en production.

## Données & performance

- [ ] **Pagination** — Activer ou renforcer la pagination sur les listes (candidats, organisations, utilisateurs super admin) si le volume augmente.
- [ ] **Sauvegardes** — Planifier des sauvegardes régulières de la base de données.
- [ ] **Migrations** — Tester les migrations sur une copie de la prod avant déploiement.

## Fonctionnel

- [ ] **Messages utilisateur** — Vérifier les textes (flash, erreurs, emails) et les faire relire si besoin.
- [ ] **Design / responsive** — Contrôler les écrans clés sur mobile et tablette.

