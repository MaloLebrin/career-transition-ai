# 2026-09-29 — Espace candidat : synthèse, profil, notifications, droits RGPD (#70)

- **Synthèse.** Lien « Ma synthèse » sur l'accueil candidat (la page n'était
  accessible par aucun lien). Le statut du PDF se met à jour en temps réel via
  Transmit (`users/:id/pdf-exports`) : génération en cours, lien de
  téléchargement dès qu'il est prêt, échec avec possibilité de réessayer. La
  logique d'abonnement est partagée avec la page conseiller
  (hook `useLivePdfExport`).
- **Profil.** Formulaire « Mon identité » sur `employee/profile/Home` (nom, poste
  actuel, poste visé, résumé → `PUT /dashboard/candidat/profile`, qui redirige
  maintenant vers la page d'origine). L'e-mail n'y est pas modifiable, en attente
  de la vérification d'adresse (#68). La page orpheline `dashboard/CandidatProfile`
  est supprimée.
- **Notifications du candidat.** `receivesNotifications()` inclut le candidat :
  cloche, props partagées et routes `PATCH /dashboard/notifications/*`. Nouveaux
  types (contrainte `CHECK` migrée) : `step_unlocked` (étape déverrouillée à la
  création, à la modification ou via « déverrouiller »), `appointment_scheduled`
  (rendez-vous planifié ou déplacé), `synthesis_shared` (passage de brouillon à
  partagée). Un candidat sans compte n'est pas notifié. Une notification qui porte
  un `meta.href` interne s'ouvre au clic, après avoir été marquée comme lue.
- **Droits RGPD en libre-service.** Section « Mes données » du profil :
  - téléchargement de l'archive de `candidate:export`
    (`GET /dashboard/candidat/data/export`, `throttleDataExport` : 5 par heure) ;
  - demande d'effacement (`POST /dashboard/candidat/data/erasure-request`),
    enregistrée dans `employees.erasure_requested_at`, et notifiée
    (`data_erasure_requested`, identifiant seul) aux super admins et au
    conseiller.

  La suppression reste faite par `candidate:purge` dans le délai d'un mois.
  La procédure est décrite dans `docs/RGPD.md`.
