# 2026-10-01 — Pages légales CGU / CGV, consentements d'achat et mention Stripe (#95)

Base contractuelle de la vente du forfait aux particuliers (épic B2C #90) : les pages `/cgu` et
`/cgv` annoncées depuis longtemps existent, et Stripe est déclaré comme sous-traitant avant
l'arrivée du paiement (#102). Prérequis à `STRIPE_ENABLED=true` en production.

- **Constantes** (`shared/constants/legal.ts`). `TERMS_VERSION` (date ISO enregistrée sur le
  compte à l'acceptation), `SELLER_IDENTITY` (placeholders « à compléter » : forme juridique,
  SIREN, adresse, médiateur), `WITHDRAWAL_NOTICE` (contenu numérique exécuté immédiatement,
  renonciation expresse — art. L221-28 13° du Code de la consommation), Stripe dans
  `SUBPROCESSORS`, durées « compte particulier : 3 ans après la dernière connexion » et
  « paiements et factures : 10 ans, anonymisés après effacement ».
- **Pages.** `TermsOfServicePage` (`/cgu`) et `TermsOfSalePage` (`/cgv`) sur `LegalDocument`,
  routes **hors groupe `guest`** (relisibles connecté), liens dans le pied de page public, section
  « Particuliers inscrits en libre-service » dans la politique de confidentialité. Textes marqués
  « [à valider par un conseil juridique] ».
- **Docs.** `docs/RGPD.md` : checklist (relecture juridique, Stripe), ligne Stripe, durées B2C,
  note cookies (session seule, Checkout hébergé → pas de bandeau, à confirmer) ; `README.md`.
- **Tests.** Constantes, pages, pied de page, politique de confidentialité ; functional : `/cgu`
  et `/cgv` répondent 200 à un invité comme à un candidat ou un conseiller connecté.
