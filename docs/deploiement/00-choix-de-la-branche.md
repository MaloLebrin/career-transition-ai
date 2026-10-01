# 0. Choisir la branche à déployer

Render construit l'application depuis une branche Git et lit `render.yaml` **sur cette
branche**. Le fichier, le mode `migrate-and-serve` de `docker/entrypoint.sh` et
`ADMIN_EMAIL` ont été ajoutés sur `claude/gallant-lamport-31a30j`, pas sur `main`.

## Option A (recommandée) : fusionner dans `main`

1. Ouvrir une pull request `claude/gallant-lamport-31a30j` → `main` (convention du
   projet : `Closes #<issue>` en anglais dans le corps, voir `docs/process/pr-checklist.md`).
2. Attendre la CI verte (lint, typecheck, build, `docker-image`, tests).
3. Fusionner. Render déploiera ensuite `main`.

Avantage : chaque fusion sur `main` redéploie automatiquement le service de test.

## Option B : déployer la branche telle quelle

À l'étape 6, choisir la branche `claude/gallant-lamport-31a30j` lors de la création du
Blueprint. Convient pour essayer vite, mais la branche peut être supprimée ou réécrite :
ne pas s'y fier au-delà du test.

## Vérifier avant de continuer

- `render.yaml`, `docker/entrypoint.sh` (mode `migrate-and-serve`) et `docs/deploiement/`
  sont bien présents sur la branche choisie.
- La CI de cette branche est verte.
