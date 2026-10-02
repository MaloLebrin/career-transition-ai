# 2026-10-02 — B2C : correctifs frontend de la revue de la PR #109

Lot 4 des correctifs de revue : comportement des écrans de paiement et fin des valeurs codées en dur.

- **Révocation** : `RevokePaymentForm` se ferme au succès (`onSuccess: onCancel`).
- **Retour checkout** : `Success.tsx` recharge la prop `paid` (`router.reload({ only: ['paid'] })`, toutes les 3 s, 5 essais maximum) tant que le paiement n'est pas confirmé.
- **bfcache** : `CheckoutConsentForm` réinitialise l'état de soumission sur `pageshow` persisté (retour depuis Stripe).
- **Constantes** : `B2C_OFFER_PATH` supprimé au profit de `BILLING_PATHS.offer` ; `BILLING_PATHS.home` / `synthesis`, `B2C_PUBLIC_PATHS`, `PAYMENT_PROVIDERS.MANUAL` ; compteurs d'exercices de `IndividualsPage` dérivés de `EXERCISE_LIST` / `B2C_FREE_EXERCISE_TYPES`.
- **Tests** : `PaymentsTable`, `CheckoutConsentForm`, `Success`, `constants/b2c` (tests/inertia).
