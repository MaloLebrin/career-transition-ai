# Paiement du forfait particuliers — Stripe Checkout

Épic B2C (#90), issue #102 (checkout) puis #104 (webhook), #139 (codes promo). Un
particulier (`employees.account_type = 'b2c'`) règle **une fois** le forfait qui
débloque tous ses résultats (`EntitlementsService`, #94).

## Principe

- **Stripe Checkout hébergé**, `mode: payment`, one-shot. Le navigateur est
  redirigé vers la page Stripe (`inertia.location`) puis revient sur
  `/dashboard/candidat/billing/success?session_id=…`. **Aucun Stripe.js** dans le
  bundle : CSP et `Permissions-Policy: payment=()` inchangés.
- **Réconciliation** au retour : `CheckoutService.reconcile` relit la session chez
  Stripe et débloque si `payment_status = paid`, sans attendre le webhook.
- **Codes promo** (#139) : créés et gérés dans le tableau de bord Stripe, saisis
  par le candidat **sur la page Stripe** (`allow_promotion_codes`), jamais dans
  l'application. Voir « Codes promo » ci-dessous.
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
| Codes promo        | `app/services/billing/promotion_codes_service.ts` (libellé), `shared/helpers/billing/checkout_session.ts` (lectures pures)        |
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
5. Codes promo (#139, facultatif) : **Catalogue de produits → Coupons** puis
   **Codes promotionnels** — voir la section dédiée. Rien à configurer côté
   application.
6. Passer en mode live : nouvelles clés, nouveau endpoint webhook, nouveau `whsec_`
   — et recréer les coupons / codes promo (ils ne passent pas du mode test au live).

## Codes promo (#139)

Les codes sont **gérés dans Stripe** et **saisis sur la page Stripe Checkout** :
la session est créée avec `allow_promotion_codes: true`, Stripe affiche le champ
« Ajouter un code promotionnel » et applique la remise lui-même. L'application
n'a ni table de codes, ni champ de saisie, ni flag d'environnement : activer,
expirer ou plafonner un code se fait dans le tableau de bord, sans déploiement.
Sans code actif, le champ est inoffensif (toute saisie est refusée par Stripe).

**Créer un code (tableau de bord Stripe).**

1. **Catalogue de produits → Coupons → Créer** : remise en **pourcentage**
   (`percent_off`, 100 % = forfait offert) ou **montant fixe** (`amount_off`,
   en EUR) ; durée **Une fois** (`once`, un seul paiement) ; en option une date
   limite d'utilisation (`redeem_by`) et un nombre maximal d'utilisations
   (`max_redemptions`), décompté au paiement confirmé.
2. **Codes promotionnels → Créer** sur ce coupon : le **libellé** saisi par le
   client (« BIENVENUE20 », insensible à la casse chez Stripe), avec ses propres
   limites (expiration, plafond, montant minimal). Un code se désactive d'un
   clic.
3. **Une fois par particulier** : la restriction Stripe « première transaction
   seulement » ne s'applique pas ici (un client Stripe est créé à chaque session,
   l'application ne transmet que l'e-mail). C'est **l'application** qui garantit
   un seul forfait par compte : un droit actif existe → `start` refuse (409) et
   un paiement encaissé en double est révoqué (« Fiabilité des droits »).

**Ce que l'application enregistre** (`candidate_payments`) :

| Colonne                    | Contenu                                                                                   |
| -------------------------- | ----------------------------------------------------------------------------------------- |
| `amount_cents`             | Montant **réellement encaissé** (`amount_total`), remise déduite ; 0 pour un code à 100 % |
| `discount_cents`           | Remise appliquée (`total_details.amount_discount`), 0 sans code                           |
| `promo_code`               | Libellé du code, relu chez Stripe **au mieux** (`PromotionCodesService.labelFor`)         |
| `stripe_promotion_code_id` | Id Stripe du code (`promo_…`), toujours conservé même si le libellé n'a pu être relu      |

Le webhook ne transmet que l'id du code : le libellé est relu par
`promotionCodes.retrieve`. Une panne à ce moment est signalée (`reportError`, id
seulement) et laisse `promo_code` nul **sans bloquer le déblocage**.

**Code à 100 %.** Stripe termine la session sans encaisser :
`payment_status = no_payment_required`, pas de PaymentIntent, `amount_total = 0`.
La réconciliation et le webhook la traitent comme réglée (`isCheckoutSettled`).
Rien à rembourser : `charge.refunded` ne concerne jamais ces paiements. Le
chiffre d'affaires du back-office (`SuperAdminB2cService.stats`, somme des
`amount_cents`) reflète donc les montants réellement perçus. Le back-office
(`/dashboard/super-admin/payments`) affiche le code et la remise sous le montant ;
l'export RGPD du candidat les inclut.

**En local.** `stripe coupons create --percent-off 20 --duration once` puis
`stripe promotion_codes create --coupon <id> --code BIENVENUE20` (ou le tableau
de bord en mode test) ; le champ apparaît sur la page Checkout.

## Webhook (#104)

`POST /webhooks/stripe` (`start/routes/webhooks.ts`, `StripeWebhooksController`,
`#services/billing/stripe_webhooks_service`) : hors `guest` / `auth`, exempté de
CSRF (`config/shield.ts`), sans throttle — chaque appel est authentifié par la
signature `stripe-signature` vérifiée avec `STRIPE_WEBHOOK_SECRET` sur le corps
brut (`request.raw()`, conservé par le bodyparser).

| Événement                                  | Effet                                                                                                                                                    |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `checkout.session.completed`               | `payment_status = paid` → paiement `paid`, droit ouvert ; `unpaid` (différé) → attente ; `no_payment_required` (code promo à 100 %, #139) → `paid` à 0 € |
| `checkout.session.async_payment_succeeded` | Paiement différé confirmé → `paid`, droit ouvert                                                                                                         |
| `checkout.session.async_payment_failed`    | Paiement `failed`                                                                                                                                        |
| `checkout.session.expired`                 | Paiement `canceled`                                                                                                                                      |
| `charge.refunded`                          | Paiement `refunded` (`refunded_at`, `revoked_at`), accès retiré, candidat prévenu                                                                        |
| autre                                      | Accusé réception, ignoré                                                                                                                                 |

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

## Fiabilité des droits (revue #109)

- **Remboursement partiel.** `charge.refunded` n'est suivi que si le
  remboursement est **total** (`refunded === true` ou `amount_refunded >=
amount`) ; un remboursement partiel est accusé (`ignored`) sans retirer le
  droit. Après une révocation manuelle, un remboursement total change le statut
  en `refunded` mais n'écrase ni `revoked_at` ni le motif, et ne renotifie pas.
- **Effets rejouables.** La transition d'état (`pending → paid`, `paid →
refunded`) est atomique et idempotente ; ses effets de bord (jobs IA,
  notification) sont suivis par `candidate_payments.unlock_effects_at` /
  `revoke_effects_at`, posés une fois les effets terminés. Si un effet lève
  après la transition, le webhook répond 500, Stripe réessaie et
  `markPaid` / `refund` voient un paiement déjà `paid` / `refunded` au
  marqueur nul : ils **rejouent les effets** (les jobs ne partent que pour les
  exercices sans analyse). La notification est « au mieux » : son échec est
  signalé (`reportError`) mais ne bloque ni ne rejoue les jobs, donc pas de
  doublon. Octroi et révocation manuels : effets lancés après commit, une
  erreur est signalée sans 500 pour l'admin.
- **Un seul droit actif.** Index unique partiel
  `candidate_payments_one_active_per_employee` (`employee_id` où `status =
'paid'` et `revoked_at IS NULL`) ; l'octroi manuel verrouille la fiche
  (`FOR UPDATE`). La migration régularise les doublons existants en révoquant
  les plus anciens. Si un paiement Stripe est encaissé alors que le candidat a
  déjà un droit actif, il est conservé `paid` mais révoqué (motif
  « Doublon : paiement à rembourser dans Stripe »), `reportError` alerte
  (`step: duplicate_paid`) : **aucun remboursement automatique par l'API**, le
  super admin rembourse dans Stripe, sur demande explicite.
- **Départ vers Stripe.** `CheckoutService.start` réutilise le paiement
  `pending` dont la session est encore ouverte, annule ceux dont la session a
  expiré, et passe le paiement en `failed` si Stripe échoue. `throttleCheckout` :
  10 départs / heure par compte.
- **Recoupement.** Session, prix catalogue et devise sont comparés à la ligne
  locale (webhook et réconciliation) ; un écart donne `unmatched` + `reportError`,
  sans déblocage. Le prix catalogue annoncé par Stripe est `amount_subtotal`
  (avant remise d'un code promo, #139), comparé à `amount_cents + discount_cents`
  (`grossAmountCents`) : l'invariant tient pour une ligne `pending` (prix, remise 0) comme pour une ligne déjà réglée (encaissé + remise), donc aussi quand le
  webhook rejoue après la réconciliation. Sans `amount_subtotal` (événement
  allégé), `amount_total` sert de repli : un paiement remisé est alors refusé,
  côté sûr.
- **Révocation manuelle.** Auteur dans `revoked_by_user_id` (plus de suffixe dans
  `revoke_reason`, borné à `REVOKE_REASON_MAX`) ; l'export RGPD inclut
  `revokeReason` et `withdrawalWaivedAt`.

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
mémoire, `pay(sessionId, { discountCents, promotionCodeId })` simule le paiement
— une remise égale au prix donne `no_payment_required` —, `promotionCodes`
(id → libellé) alimente `retrievePromotionCode`, `FAKE_STRIPE_SIGNATURE` pour les
webhooks). `StripePaymentGateway.checkoutParams` est pur et testé tel quel ; la
vérification de signature utilise `stripe.webhooks.generateTestHeaderString`
(`tests/unit/services/billing/stripe_payment_gateway.spec.ts`). `.env.test` ne
définit aucune clé.
