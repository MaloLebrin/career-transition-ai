# 2026-11-20 — Render : migrations jouées au démarrage, même hors Blueprint

En production (Render), les migrations ne semblaient pas jouées : le service démarrait
en mode `server`, qui ne migre pas.

- **Cause.** Deux pièges : un service créé hors Blueprint n'applique pas le
  `dockerCommand` de `render.yaml` (démarrage sur le `CMD` `server`) ; et `dockerCommand`
  ne remplace que le `CMD`, si bien que l'entrypoint recevait `/entrypoint.sh` comme mode.
- **Correctif.** `docker/entrypoint.sh` ignore son propre chemin en premier argument ;
  `RUN_MIGRATIONS_ON_BOOT=true` (posé dans `render.yaml`, à ajouter à la main sur un
  service créé hors Blueprint) fait migrer le mode `server`. Le compose de prod garde
  l'étape `migrate` explicite.
- **Tests.** `tests/unit/hygiene/dockerfile.spec.ts` exécute l'entrypoint avec un faux
  `node` (chemin répété, filet, `server` seul sans migration) et vérifie `render.yaml`.
- **Docs.** `docs/DEPLOYMENT.md`, `docs/deploiement/06-render-deploiement.md`, `10-depannage.md`.
