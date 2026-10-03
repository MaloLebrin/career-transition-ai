# 2026-10-03 — B2C : documentation de clôture de l'épic (#108)

Consolidation de la documentation du parcours particulier, une fois toutes les
fonctionnalités livrées dans leurs PR respectives.

- `docs/MANUAL_TESTS.md` § 11 « Parcours particulier » : inscription et vérification
  d'e-mail, exercices gratuits et verrouillage (avec le contrôle réseau des props Inertia),
  paiement Stripe en mode test (`4242…`, `stripe listen`, rejeu du webhook), remboursement et
  retrait d'accès, accompagnement par un expert, droits RGPD.
- `docs/PRODUCTION_CHECKLIST.md` : section « Parcours particulier » — CGU / CGV validées,
  décisions PO ouvertes (prix / TVA, notes privées, SEO), `B2C_REGISTRATION_ENABLED`, Stripe en
  production (clés live, endpoint webhook, cinq événements), équipe interne.
- `docs/epics/b2c.md` : état de livraison, PR empilées et ordre de fusion, régénération unique
  de `database/schema.ts` avant la PR finale.
- `docs/FEATURES.md` § 11 (plus « en cours »), `CLAUDE.md` (flags, seeds, recette), `README.md`.
- Seeds : `MainSeeder` couvre déjà l'organisation plateforme, l'expert interne, un particulier
  payé, un non payé et une demande d'accompagnement en attente (`b2c_candidate_seeder.ts`).
