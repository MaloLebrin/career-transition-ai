# 2026-09-28 — E-mails : domaine vérifié chez Resend (#19)

Décision de l'issue #19 : pour que les testeurs de la beta reçoivent leurs e-mails
(onboarding, notifications), la production utilise un domaine à soi vérifié chez Resend
(SPF/DKIM). `MAIL_PROVIDER=console` reste le repli tant que le domaine n'est pas prêt.

- **Correctif.** En production, `ResendMailProvider` ignorait l'expéditeur du message et
  envoyait toujours depuis `contact@careertransition.fr`, un domaine non vérifié : Resend
  aurait refusé tout envoi. Il transmet désormais `message.from` (`MAIL_FROM_EMAIL`). Test de
  non-régression dans `tests/unit/services/mail/resend_mail_provider.spec.ts`.
- **Garde au démarrage.** `config/mail.ts` : en production avec `MAIL_PROVIDER=resend`, le
  serveur refuse de démarrer sans `RESEND_API_KEY` ni `MAIL_FROM_EMAIL`, ou avec un expéditeur
  en `@resend.dev` (envoi restreint à l'adresse du compte). Aucune exigence en `console`.
  Tests : `tests/unit/config/mail.spec.ts` ; les exemples de production passent la garde
  (`tests/unit/config/env_schema.spec.ts`).
- **Docs.** `MAIL.md` : procédure « Domaine vérifié » (région EU, DNS, variables,
  vérification). `DEPLOYMENT.md` §1.3, §3.5, §4, §5, `PRODUCTION_CHECKLIST.md`, `hosting.md`,
  `render.yaml` et `deploy/.env.example` : `resend` + domaine comme cible, `console` en repli.
