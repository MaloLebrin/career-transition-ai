# 2026-11-22 — Le compagnon devient l'assistant des pages publiques

Le robot de jumpUjob accompagne maintenant le visiteur sur toutes les pages publiques,
comme un assistant : fixé en bas à droite, il affiche un conseil propre à la page.

- **Comportement.** Bulle de conseil (titre, une phrase, un lien utile) à côté du compagnon,
  avec une posture adaptée (`guard` sur le tarif et la sécurité, `think` pour les cabinets et
  les pages légales, `cheer` sur le contact). La bulle se replie ; replié, le robot reste un
  bouton pour la rouvrir (`aria-expanded`). Le choix est retenu pour la session
  (`sessionStorage`, sans effet si le stockage est bloqué). Sur mobile (sous 640 px), il démarre
  replié pour ne pas couvrir le contenu.
- **Un seul compagnon par écran.** Retiré des écrans d'authentification (`AuthShell`, qui ont
  déjà le leur) ; sur l'accueil, il n'apparaît qu'une fois le compagnon du héros dépassé.
- **Textes.** Écrits à l'avance dans `inertia/components/layout/assistant/assistant_tips.ts`,
  au vouvoiement, sans IA ni chiffre absent du site ; conseil général pour les autres pages.
- **Code.** `CompanionAssistant` rendu par `PublicLayout` (prop `assistant`, `true` par défaut).
- **Tests.** `tests/inertia/components/layout/CompanionAssistant.spec.tsx` : conseils par page,
  vouvoiement, repli et réouverture, démarrage replié sur mobile, attente sur l'accueil, prop `assistant`.
