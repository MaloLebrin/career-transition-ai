# 2026-10-01 — Déploiement de test gratuit (Render + Neon)

Permet de mettre l'app en ligne gratuitement pour 2-3 testeurs, sans VM.

- **Blueprint.** `render.yaml` : web Render Free construit depuis le `Dockerfile`, `QUEUE_DRIVER=sync`, secrets saisis dans Render.
- **Entrypoint.** Nouveau mode `migrate-and-serve` (migrations puis serveur) pour les hébergeurs sans pré-déploiement ; le mode `server` et le compose de prod sont inchangés.
- **Seeder admin.** `ADMIN_EMAIL` (optionnel) remplace l'e-mail super admin codé en dur.
- **Doc.** `docs/deploiement/` (un fichier par étape).
- **Tests.** Garde de l'entrypoint (`dockerfile.spec.ts`), seeder admin avec `ADMIN_EMAIL`.
