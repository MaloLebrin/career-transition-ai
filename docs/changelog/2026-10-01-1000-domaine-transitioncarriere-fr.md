# 2026-10-01 — Domaine `transitioncarriere.fr`

L'application sera servie sur `transitioncarriere.fr`, avec des e-mails `@transitioncarriere.fr`.
L'ancien `francetransitioncarriere.fr` (valeurs par défaut en dur) est remplacé.

- **Code.** Contact par défaut `contact@transitioncarriere.fr`, expéditeur `noreply@transitioncarriere.fr`
  (`contact_request_mail_service`), `PRIVACY_CONTACT_EMAIL` ; les mentions légales lisent désormais cette constante.
- **Docs / exemples d'env.** `.env.production.example`, `deploy/.env.example`, `docs/MAIL.md`, `docs/RGPD.md`, `docs/deploiement/*`.
- **À faire hors code.** DNS vers l'hôte ; `APP_DOMAIN` / `APP_URL=https://transitioncarriere.fr` ;
  domaine vérifié chez Resend (SPF/DKIM/DMARC) avant `MAIL_FROM_EMAIL=no-reply@transitioncarriere.fr`
  (sinon la garde de `config/mail.ts` bloque le démarrage) ; créer la boîte `contact@`.
