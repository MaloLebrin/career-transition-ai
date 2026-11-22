# 2026-11-22 — Identité visuelle jumpUjob

Transition Carrière devient jumpUjob. Cette modification couvre la partie identité du
brief développeur : nom, logo, palette « Agrumes », typographie, favicons. Le parcours,
le paiement et l'espace cabinet ne changent pas. La refonte de l'accueil, les pages
`/parcours` et `/qui-sommes-nous` et le tutoiement font l'objet de modifications
séparées (le tutoiement attend une validation).

- **Nom.** `APP_NAME` = `jumpUjob`. « Transition Carrière » est remplacé dans les pages,
  les titres, les e-mails (expéditeur par défaut, signature), le libellé Stripe du forfait,
  l'identité vendeur des CGV, `render.yaml`, les exemples `.env` et la doc. Le domaine
  `transitioncarriere.fr` (adresses de contact, URL) ne change pas tant que le nouveau n'est
  pas acheté. Les entrées de changelog passées gardent l'ancien nom.
- **Logo.** Galet jaune « jUj » sur plongeoir, en SVG inline (`ui/Logo`, `ui/logo/LogoMark`,
  pastille `ui/logo/LogoBadge` à 32 px et moins). Le monogramme est tracé, il ne dépend pas
  du glyphe `ȷ` (U+0237). Le nom s'affiche jump**U**job, le U en corail. Fichiers
  `public/logo.svg`, `public/logo-dark.svg`, `public/favicon.svg` ; favicons et icônes
  16/32/48/180/192/512 px régénérés ; `logo-mark.png` supprimé.
- **Palette.** Tokens `@theme` de `inertia/css/app.css` remplacés : crème `#fffdf5`, jaune pâle
  `#fff3c4`, encre `#1f1400`, soleil `#ffc53d`, nouveau token `coral` `#ff5a36` (marque),
  `accent` corail foncé `#b23410` (liens, focus, sur-titres), cinq couples pastel du brief.
  Les composants n'ont pas changé de classes : basculer vers Tropical ou Pop = changer ces
  valeurs.
- **Contraste.** Le corail vif ne passe pas AA en texte (3,05:1 sur crème, 3,1:1 en blanc
  dessus) : il est réservé à la marque, et le bouton principal reste en encre, comme sur
  la planche 47 retenue.
- **Typographie.** Nunito remplace Manrope et Inter : 900 pour les titres `display-*`, 800 pour
  les titres de carte et sur-titres, 500 pour le texte.
- **Boutons.** Pilules (`rounded-full`, 700) ; `secondary` devient blanc bordé de jaune
  (`#ffd96a`), texte encre.
- **Doc.** `DESIGN.md` (sections 1 à 3, Logo, Button), `CLAUDE.md`, `inertia/assets/images/README.md`.
- **Tests.** `Logo.spec.tsx` réécrit (nom accessible, U corail, marque complète ou pastille,
  ton inverse) ; assertions du bouton secondaire mises à jour.
