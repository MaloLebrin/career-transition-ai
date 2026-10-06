# 2026-10-05 — Chat candidat ↔ expert : export RGPD, durée de conservation et documentation

Complète le socle backend du chat : les messages sont des données personnelles du candidat, ils suivent donc les procédures RGPD.

- **Export.** `donnees.json` contient `chatMessages` (rôle de l'auteur, texte, date ; jamais l'identité de l'expert), chargés par `loadCandidateForExport`.
- **Effacement.** `candidate:purge` supprime la conversation et ses messages par `ON DELETE CASCADE` depuis la fiche (test de non-régression, autres candidats intacts).
- **Conservation.** Nouvelle ligne « Messages du chat avec l'équipe d'experts » dans `RETENTION_PERIODS` (donc sur `/confidentialite`) : 3 ans au maximum avec le dossier, ou dès l'effacement.
- **Documentation.** `docs/CHAT.md` (architecture, file et assignation, limite mono-instance de Transmit, limites v1), `docs/RGPD.md`, `docs/epics/b2c.md`, `docs/README.md`, paragraphe dans `CLAUDE.md`, `docs/hosting.md` (limite multi-instances du chat, `pingInterval: '30s'` désormais en place).
- **Tests.** `candidate_data_service.spec.ts` (export, export vide, purge), `legal.spec.ts`.
