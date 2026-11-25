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
- **RGPD.** Les adresses bloquées sont conservées jusqu'à la levée du blocage (`docs/RGPD.md`,
  `shared/constants/legal.ts`).
- **Tests.** `contact_blocklist_service.spec.ts`, `sender_account.spec.ts`,
  `tests/functional/admin/contact_requests.spec.ts`, specs des deux composants ; compléments dans
  les specs existantes (service, contrôleur, formulaire public).
