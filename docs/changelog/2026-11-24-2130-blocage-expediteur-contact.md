# 2026-11-24 — Bloquer un expéditeur depuis les demandes de contact

La boîte des demandes de contact du super admin ne permettait que de changer le statut d'une
demande : un expéditeur indésirable pouvait renvoyer des messages (3/h par IP), chacun déclenchant
deux e-mails.

- **Blocage de l'adresse.** Nouvelle table `blocked_contact_emails` (adresse en minuscules,
  unique, auteur du blocage). « Bloquer l'expéditeur » sur une demande y ajoute son adresse et
  archive ses demandes encore à traiter ; « Débloquer » la retire
  (`#services/contact_blocklist_service`).
- **Formulaire public.** `ContactRequestsService.create` ignore une adresse bloquée : rien n'est
  enregistré ni envoyé, et le visiteur voit le même message de succès, pour ne pas révéler le
  blocage.
- **Compte lié.** Quand un compte porte l'adresse de la demande, la carte l'affiche (nom, rôle) et
  permet de le désactiver ou de le réactiver (`users.disabled_at`). Nouvelle portée
  `SuperAdminUsersService.setDisabledForContactSender` : comptes des organisations clientes et
  candidats de l'organisation plateforme (particuliers, jusqu'ici non désactivables) ; l'équipe
  plateforme et les super admins restent hors portée.
- **Écran.** `Index.tsx` allégé : carte extraite dans `ContactRequestCard`, actions dans
  `ContactRequestSenderActions` (confirmation avant blocage et désactivation).
- **Routes.** `POST /dashboard/super-admin/contact-requests/:id/{block-sender,unblock-sender,
disable-account,enable-account}` (`SUPER_ADMIN_PATHS`).
- **Adresses bloquées.** Page `/dashboard/super-admin/contact-requests/blocked` (recherche,
  pagination) : un blocage se lève par son id, même si plus aucune demande ne porte l'adresse
  (`ContactBlocklistService.listBlocked` / `unblockById`).
- **RGPD.** Une adresse bloquée est conservée 3 ans au maximum (`CONTACT_BLOCK_RETENTION_YEARS`) :
  `PurgeExpiredContactBlocksJob` lève les blocages plus anciens chaque nuit à 3 h 30
  (`docs/RGPD.md`, `shared/constants/legal.ts`, `docs/QUEUES.md`).
- **Robustesse.** Blocage et archivage dans une transaction, insertion qui ignore le doublon
  (deux clics simultanés) ; le faux succès attend un délai comparable à l'envoi des e-mails
  (`BLOCKED_CONTACT_RESPONSE_DELAY_MS`) ; si plusieurs comptes portent l'adresse (casse ou
  organisations différentes), aucun n'est proposé ni désactivé depuis cet écran ; index sur
  `lower(email)` pour `users` et `contact_requests`.
- **Limite connue.** La comparaison porte sur l'adresse exacte, casse mise à part : un alias
  (`nom+autre@…`) ou une autre adresse contourne le blocage. La limite de 3 demandes par heure et
  par IP reste la première barrière.
- **Tests.** `contact_blocklist_service.spec.ts`, `sender_account.spec.ts`,
  `tests/functional/admin/contact_requests.spec.ts`, specs des deux composants ; compléments dans
  les specs existantes (service, contrôleur, formulaire public).
