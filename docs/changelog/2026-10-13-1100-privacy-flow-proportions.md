# 2026-10-13 — Page particuliers : proportions du schéma « parcours des données »

Sur la page particuliers, le schéma en trois étapes (Vos réponses → Pseudonymisation
→ Analyse IA) était posé dans une colonne de 5/12 trop étroite pour trois cartes
côte à côte : le mot « Pseudonymisation » ne pouvant se couper, sa carte s'élargissait,
les deux autres se compressaient et passaient sur trois lignes, avec des hauteurs
différentes et des connecteurs minuscules.

- **Correctif.** `PrivacyFlow` devient un stepper vertical dans une seule carte :
  icône à gauche (colonne fixe), titre et légende à droite, connecteur animé centré
  sous l'icône. Les trois étapes ont la même largeur et le même rythme à toutes les
  tailles d'écran.
- **Tests.** Test Vitest existant inchangé (libellés et rôle `list` conservés).
