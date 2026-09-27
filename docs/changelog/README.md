# Changelog

Nouvelles fonctionnalités, améliorations et correctifs notables. **Un fichier par
modification** — jamais d'insertion dans un fichier partagé, pour éliminer les
conflits git entre branches (convention reprise de boat-management).

## Convention

- **Nom de fichier** : `YYYY-MM-DD-HHMM-slug.md`
  - `YYYY-MM-DD` : date de la modification ;
  - `HHMM` : heure de rédaction (ex. `1435`), pour l'ordre chronologique dans la journée ;
  - `slug` : titre en kebab-case sans accents, ~60 caractères max, sans numéro d'issue.
- **Contenu** : un titre `# YYYY-MM-DD — Titre (#issue)`, un paragraphe de
  contexte, puis des puces en gras (**Cause**, **Correctif**, **Tests**…), en français.
- **Lecture chronologique** : `ls docs/changelog/` (le nommage trie naturellement).

## Exemple

```markdown
# 2026-09-27 — Notes : contrôleur fin et erreurs de domaine

Pourquoi le changement, ce que l'utilisateur voit.

- **Routes.** …
- **Comportement.** …
- **Tests.** …
```
