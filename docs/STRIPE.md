# Paiement du forfait particuliers — Stripe Checkout

Épic B2C (#90), issue #102 (checkout) puis #104 (webhook). Un particulier
(`employees.account_type = 'b2c'`) règle **une fois** le forfait qui débloque tous
ses résultats (`EntitlementsService`, #94).

## Principe

- **Stripe Checkout hébergé**, `mode: payment`, one-shot. Le navigateur est
  redirigé vers la page Stripe (`inertia.location`) puis revient sur
  `/dashboard/candidat/billing/success?session_id=…`. **Aucun Stripe.js** dans le
  bundle : CSP et `Permissions-Policy: payment=()` inchangés.
- **Réconciliation** au retour : `CheckoutService.reconcile` relit la session chez
  Stripe et débloque si `payment_status = paid`, sans attendre le webhook.
- **Webhook** (#104, `POST /webhooks/stripe`) : source de vérité si l'onglet est
  fermé, remboursements. `PaymentsService.markPaid` est idempotent (une seule
  ligne `pending` passe `paid`) : réconciliation et webhook peuvent arriver dans
  n'importe quel ordre.
- Données transmises à Stripe : e-mail du compte (`customer_email`), montant,
  libellé du forfait, **ids seulement** dans `metadata` (`paymentId`, `employeeId`)
  — jamais de nom. Stripe est déclaré sous-traitant (`shared/constants/legal.ts`,
  `docs/RGPD.md`).

## Conservation et effacement (RGPD)

- Les paiements (`candidate_payments`) sont des pièces comptables **conservées
  10 ans** (art. L123-22 Code de commerce), avec `stripe_checkout_session_id` et
  `stripe_payment_intent_id` pour le rapprochement avec Stripe. `candidate:purge`
  les anonymise (`employee_id` / `user_id` à `NULL`) sans les supprimer.
- **Aucune suppression du client côté Stripe n'est faite par la plateforme** :
  seul l'e-mail (`customer_email`, non pseudonymisé) y est transmis, jamais le
  nom. Sur demande d'effacement, supprimer le client à la main dans le tableau de
  bord Stripe (voir `docs/RGPD.md` §5).

## Fichiers

| Rôle               | Fichier                                                                                                                           |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Flag et prix       | `config/billing.ts` (`STRIPE_ENABLED`, `B2C_RESULTS_PRICE_CENTS`)                                                                 |
| Clés et garde prod | `config/stripe.ts`                                                                                                                |
| Passerelle         | `app/services/billing/payment_gateway.ts` (interface), `stripe_payment_gateway.ts`                                                |
| Checkout           | `app/services/billing/checkout_service.ts`, `app/controllers/billing_controller.ts`, `start/routes/dashboard/candidat/billing.ts` |
| Paiements          | `app/services/billing/payments_service.ts`, modèle `CandidatePayment`                                                             |
| Pages              | `inertia/pages/dashboard/candidat/billing/{Offer,Success}.tsx`, `inertia/components/dashboard/b2c/CheckoutConsentForm.tsx`        |
| Fake de test       | `tests/support/fake_stripe.ts` (`swapFakeStripe()` / `restoreStripe()`)                                                           |

## Variables d'environnement

| Variable                  | Défaut  | Rôle                                                                                       |
| ------------------------- | ------- | ------------------------------------------------------------------------------------------ |
| `STRIPE_ENABLED`          | `false` | Ouvre le paiement. Tant que faux : bouton « Bientôt disponible », `POST …/checkout` → 503. |
| `STRIPE_SECRET_KEY`       | —       | `sk_test_…` en dev / staging, `sk_live_…` en production.                                   |
| `STRIPE_WEBHOOK_SECRET`   | —       | `whsec_…` du endpoint webhook (ou de `stripe listen`).                                     |
| `B2C_RESULTS_PRICE_CENTS` | `4900`  | Prix TTC en centimes (`config/billing.ts`).                                                |

**Garde de démarrage** (`config/stripe.ts`) : en production, `STRIPE_ENABLED=true`
sans les deux clés (ou avec des clés mal formées) empêche le serveur de démarrer.
Hors production, l'app démarre sans clés et seul un appel à Stripe échoue
(`PaymentGatewayNotConfiguredError`, 503).

**Prérequis avant `STRIPE_ENABLED=true` en production** : CGV (`/cgv`) validées
juridiquement (#95), identité du vendeur renseignée (`SELLER_IDENTITY`), prix TTC
confirmé par le PO.

## Configuration Stripe (tableau de bord)

1. Créer le compte, activer le **mode test**, copier la clé secrète `sk_test_…`.
2. Aucun produit à créer : le prix est envoyé inline (`price_data`) à chaque session.
3. Activer les **factures** pour Checkout (`invoice_creation` est demandé par
   session) ; renseigner les informations légales de l'entreprise sur Stripe.
4. Webhook (#104) : endpoint `https://<domaine>/webhooks/stripe`, événements
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
   `checkout.session.async_payment_failed`, `checkout.session.expired`,
   `charge.refunded`. Copier le `whsec_…`.
5. Passer en mode live : nouvelles clés, nouveau endpoint webhook, nouveau `whsec_`.

## Webhook (#104)

`POST /webhooks/stripe` (`start/routes/webhooks.ts`, `StripeWebhooksController`,
`#services/billing/stripe_webhooks_service`) : hors `guest` / `auth`, exempté de
CSRF (`config/shield.ts`), sans throttle — chaque appel est authentifié par la
signature `stripe-signature` vérifiée avec `STRIPE_WEBHOOK_SECRET` sur le corps
brut (`request.raw()`, conservé par le bodyparser).

| Événement                                  | Effet                                                                                  |
| ------------------------------------------ | -------------------------------------------------------------------------------------- |
| `checkout.session.completed`               | `payment_status = paid` → paiement `paid`, droit ouvert ; `unpaid` (différé) → attente |
| `checkout.session.async_payment_succeeded` | Paiement différé confirmé → `paid`, droit ouvert                                       |
| `checkout.session.async_payment_failed`    | Paiement `failed`                                                                      |
| `checkout.session.expired`                 | Paiement `canceled`                                                                    |
| `charge.refunded`                          | Paiement `refunded` (`refunded_at`, `revoked_at`), accès retiré, candidat prévenu      |
| autre                                      | Accusé réception, ignoré                                                               |

Le paiement local est retrouvé par `client_reference_id` (id de
`candidate_payments`), à défaut par l'id de session ; un remboursement par
`payment_intent`. Aucun paiement correspondant → journalisé, 200.

**Idempotence.** Chaque événement est inscrit dans `stripe_events` (id, type,
`livemode`, `processed_at` — jamais de payload). Un id déjà traité est ignoré ;
une ligne sans `processed_at` (traitement interrompu, 500 renvoyé à Stripe) est
reprise à la livraison suivante. Les transitions de `PaymentsService` sont
elles-mêmes idempotentes (`WHERE status = 'pending'` / `'paid'`), si bien que
webhook et réconciliation de la page de succès peuvent arriver dans n'importe
quel ordre.

**Au déblocage** (`EntitlementsService.onResultsUnlocked`), chaque exercice
complété sans analyse — les exercices du forfait, dont l'analyse n'était pas
lancée — part dans la queue `ai` (`AnalyzeExerciseQualitativeJob`) et le
particulier reçoit `results_unlocked` ; au retrait, `results_access_revoked`.
Un échec de traitement est remonté à Sentry (`reportError`, ids seulement).

## Support (#107)

- **Rembourser** : dans le tableau de bord Stripe (ou l'API). L'événement
  `charge.refunded` arrive par le webhook : paiement `refunded`, accès retiré,
  particulier prévenu. Rien à faire côté application.
- **Ouvrir un accès sans paiement** (geste commercial, incident) :
  `/dashboard/super-admin/b2c` → « Ouvrir l'accès » — paiement `manual` à 0 €,
  mêmes effets qu'un paiement (analyses IA, notification).
- **Retirer un accès sans rembourser** (litige, erreur) :
  `/dashboard/super-admin/payments` → « Retirer l'accès » avec un motif consigné
  sur le paiement (`revoke_reason`) ; le paiement garde son statut, l'accès est
  fermé, le particulier prévenu.

## En local

```bash
# .env
STRIPE_ENABLED=true
STRIPE_SECRET_KEY=sk_test_…
STRIPE_WEBHOOK_SECRET=whsec_…   # celui affiché par `stripe listen`

stripe login
stripe listen --forward-to localhost:3333/webhooks/stripe
# puis, dans un autre terminal, pour vérifier le déblocage / le remboursement :
stripe trigger checkout.session.completed
stripe trigger charge.refunded
```

Carte de test : `4242 4242 4242 4242`, date future, CVC quelconque. Parcours
manuel : `docs/MANUAL_TESTS.md` (§ B2C).

## Tests

Les tests ne font **aucun appel réseau** : `swapFakeStripe()` remplace
`StripePaymentGateway` dans le conteneur (`FakeStripeGateway` : sessions en
mémoire, `pay(sessionId)` simule le paiement, `FAKE_STRIPE_SIGNATURE` pour les
webhooks). `StripePaymentGateway.checkoutParams` est pur et testé tel quel ; la
vérification de signature utilise `stripe.webhooks.generateTestHeaderString`
(`tests/unit/services/billing/stripe_payment_gateway.spec.ts`). `.env.test` ne
définit aucune clé.
