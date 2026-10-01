# 8. Recette

À dérouler une fois le service en ligne et le super admin créé. Penser à réveiller le
service (ouvrir l'URL ~1-2 min avant).

## Checklist

- [ ] `https://<url>/health` répond 200.
- [ ] Connexion en super admin.
- [ ] Création d'une organisation et d'un conseiller si le parcours de test le demande.
- [ ] Création d'un compte candidat testeur (`REGISTRATION_ENABLED=false` : les comptes sont
      créés par le super admin).
- [ ] **E-mail d'onboarding** reçu par le testeur (ou lien lu dans les logs si
      `MAIL_PROVIDER=console`), non classé en spam.
- [ ] Connexion du testeur via le lien d'onboarding, définition du mot de passe.
- [ ] **Dépôt d'un document** candidat, puis téléchargement depuis l'app (Cloudinary).
- [ ] **Export PDF** d'une synthèse : noter le délai (jobs exécutés dans le process web).
- [ ] **Analyse IA** (si activée) : une analyse d'exercice aboutit.
- [ ] Page `/confidentialite` accessible ; en-tête `noindex` présent (`SEO_INDEXING=false`).

## Que noter pour l'A/B test

- Délais constatés au réveil (Render + Neon) et sur les exports PDF / analyses IA.
- Erreurs visibles dans les **Logs** Render.
- Retours des testeurs (au-delà de la technique, hors périmètre de cette doc).

## En cas d'échec

Voir [10-depannage.md](10-depannage.md).
