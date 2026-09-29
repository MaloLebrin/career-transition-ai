# 2026-09-29 — Profil conseiller, navigation et notifications du super admin (#69)

- **Profil conseiller.** `GET /dashboard/conseiller/profile` rendait, sans contrôleur,
  une page qui attendait le hook déprécié `useEmployee` et restait en chargement ;
  elle envoyait aussi des champs candidat au validator (nom et e-mail seulement).
  La page (et son doublon orphelin `dashboard/ConseillerProfile`, ainsi que le helper
  `employee_payload` qu'elles seules utilisaient) est supprimée : l'URL redirige
  vers les réglages, qui portent déjà les formulaires profil et mot de passe.
  `PUT /dashboard/conseiller/profile` est inchangé.
- **Navigation super admin.** `DashboardLayout` affiche désormais la sidebar au super
  admin, avec ses liens de supervision (organisations, utilisateurs, usage des
  exercices, exports PDF, design system) ; elle ne s'affichait que pour advisor,
  admin et expert.
- **Notifications.** Un seul helper, `receivesNotifications()` (advisor, admin,
  super admin), décide de la cloche, des props partagées `notifications` et des
  routes `PATCH /dashboard/notifications/*`, désormais protégées par le nouveau
  middleware `notificationRecipient()`. Avant : le super admin voyait la cloche mais
  recevait 403 en marquant une notification comme lue. Ces routes, appelées par
  `router.patch`, redirigent vers la page courante au lieu de répondre 204.
- **Docs.** Le rôle réel de `advisorOrAdmin()` (advisor, admin, expert — super admin
  exclu) est corrigé dans `CLAUDE.md` et `routes-role-middleware.mdc`.
