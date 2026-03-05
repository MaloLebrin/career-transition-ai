# Images / assets

Dossier pour les images utilisées par le frontend (alias Vite `~/assets/images/`).

Pour afficher un logo image au lieu du fallback texte dans `Logo.tsx`, ajoute ici :

- `logo-with-name.png` — logo complet (icône + nom)
- `logo-without-name.png` — icône seule

Puis dans `inertia/components/ui/Logo.tsx`, réactive les imports et le rendu `<img>` en remplacement du bloc actuel (badge FTC + texte).
