# 2026-10-03 — RGPD : notes privées des conseillers séparées dans l'export candidat (#97)

`candidateDataSnapshot` exportait toutes les notes avec leur `visibility`, y
compris les notes `private` que le candidat ne voit jamais dans l'application.
L'arbitrage (droit d'accès art. 15 vs appréciations internes) est en cours ;
en attendant, l'export les sépare et permet de les écarter.

- `donnees.json` : `notes` ne contient que les notes partagées ;
  `advisorPrivateNotes` regroupe les notes privées des conseillers, incluses selon
  `CandidateExportOptions.includePrivateNotes` (`null` sinon, nombre dans
  `advisorPrivateNotesWithheld`). Politique par défaut `PRIVATE_NOTES_IN_EXPORT`
  (`shared/constants/legal.ts`, statu quo : `true`) appliquée à l'export libre-service et
  à la commande.
- `node ace candidate:export <id> --without-private-notes` écarte les notes privées ; le
  message de fin indique si elles sont incluses ou exclues.
- Tests : `candidate_data_service.spec.ts` (séparation, exclusion, défaut, commande),
  `tests/inertia/constants/legal.spec.ts`.
- Docs : `docs/RGPD.md` §4 (notes des conseillers, arbitrage), `CLAUDE.md`.
