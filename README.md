# career-transition-ai

Application d’accompagnement à la transition de carrière (conseillers, candidats, exercices).

## Documentation

- **[Workflow d'onboarding candidat](docs/ONBOARDING.md)** — Invitation par email, création du mot de passe via lien unique, accès au dashboard.
- **[Tests](docs/TESTING.md)** — Suites Japa/Vitest, base de test Postgres, shards de CI, couverture.
- **[TODO mise en production](docs/README.md#todo--mise-en-production)** — Checklist des points à traiter pour la prod.

## Tests

Les tests backend tournent sur PostgreSQL (service `postgres_test` du `docker-compose.yml`, profil `test`) :

```bash
# Démarrer la base de test
pnpm test:db:up

# Tests backend (Japa) — suites unit, integration, functional
pnpm test

# Tests frontend (Vitest)
pnpm test:inertia

# Arrêter la base de test
pnpm test:db:down
```

Détails (isolation, shards de CI, couverture) dans [docs/TESTING.md](docs/TESTING.md).

## TODO — Pages marketing (public)

### P0 (indispensable)

- [x] **Contact / Demande de démo** (`/contact`) — formulaire simple + CTA “Demander une démo”
- [x] **Mentions légales** (`/mentions-legales`)
- [x] **Politique de confidentialité (RGPD)** (`/confidentialite`)
- [x] **Sécurité & confidentialité** (`/securite`) — accès, rôles, hébergement, traitement des données (version marketing + liens vers pages légales)

### P1 (conversion / réassurance)

- [x] **Offre / Pour les cabinets** (`/offre`) — bénéfices, pour qui, différenciation, livrables
- [x] **Tarifs** (`/tarifs`) — ou “sur devis” + packaging (essentiel pour qualifier les leads)
- [x] **Particuliers** (`/particuliers`) — offre B2C : deux exercices offerts, forfait unique TTC, accompagnement expert (épic #90, #99) ; bloc « Particuliers » sur `/tarifs`
- [ ] **FAQ** (`/faq`) — objections: rôle de l’IA, méthodo, RGPD, usages cabinet
- [ ] **Cas clients / Témoignages** (`/cas-clients`) — preuves sociales et résultats

### P2 (SEO / contenu)

- [ ] **Ressources / Blog** (`/ressources`) — articles courts orientés SEO (bilan, transition, sciences comportementales)
- [ ] **Support / Centre d’aide** (`/support`) — docs d’usage, guides, contact support
- [x] **CGU / CGV** (`/cgu`, `/cgv`) — rédigées pour le forfait particuliers (#95), textes marqués « à valider par un conseil juridique », identité du vendeur à compléter dans `shared/constants/legal.ts`
