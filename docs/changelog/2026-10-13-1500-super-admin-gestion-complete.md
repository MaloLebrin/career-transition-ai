# 2026-10-13 — Back-office super admin : organisations, comptes, contacts, compétences (#73)

Le super admin pouvait lister, créer et supprimer des organisations, lister et créer des
utilisateurs, mais ni modifier une organisation, ni modifier / désactiver / supprimer un compte.
Les demandes de contact étaient enregistrées sans écran pour les traiter, il n'y avait aucun
catalogue de compétences, et la carte « Instances = 1 » de l'accueil était écrite en dur.

- **Organisations.** Fiche `GET /organizations/:id` (compteurs, membres et état d'accès) et
  renommage `PUT /organizations/:id` (nom unique, slug facultatif). Le nom de la liste renvoie
  vers la fiche. L'organisation plateforme reste hors périmètre (404).
- **Comptes.** Modifier nom et e-mail (une nouvelle adresse est à reconfirmer), désactiver /
  réactiver, supprimer. Un compte désactivé ne peut plus se connecter
  (`AccountDisabledError`, après vérification du mot de passe pour ne rien révéler) et sa
  session en cours est coupée par `AuthMiddleware`. La suppression est refusée si une autre
  table référence le compte (les clés étrangères sont surtout en `CASCADE` / `SET NULL` : sans
  ce contrôle, supprimer un conseiller effacerait ses notes). Son propre compte et un super
  admin sont verrouillés. Migration `users.disabled_at`.
- **Demandes de contact.** Boîte `GET /contact-requests` (recherche, statut, type, pagination) et
  changement de statut traité / archivé / à traiter. Constantes déplacées dans
  `#shared/constants/contact_request` (le modèle les réexporte).
- **Compétences.** Catalogue global (`skills.organization_id` nul) : liste paginée, ajout,
  modification, suppression refusée tant que des candidats portent la compétence. Remplace la
  coquille vide `SkillsController`.
- **Accueil.** « Instances » est remplacé par le nombre réel de demandes de contact à traiter.
- **Navigation.** Entrées « Demandes de contact » et « Compétences » dans la barre latérale.
- **Tests.** Unit (quatre services, deux contrôleurs, authentification, middleware), functional
  (`admin/management`), Vitest (cinq pages et composants, accueil, helpers).
- **Schéma.** `database/schema.ts` régénéré par les migrations (`disabledAt`) ; il retire aussi
  `pdf_exports.type`, supprimée par une migration antérieure mais restée dans le fichier.
