# 2. Cloudinary — stockage des fichiers

Cloudinary est le **seul** stockage de fichiers de l'app (exports PDF, documents candidat,
logo d'organisation). Il est **obligatoire en production** : `config/cloudinary.ts` refuse
de démarrer si une des trois variables manque. Détails d'architecture :
[`../CLOUDINARY.md`](../CLOUDINARY.md).

## Création

1. Créer un compte gratuit sur <https://cloudinary.com>.
2. Dans le tableau de bord (**Programmable Media**), repérer le **Cloud name**.
3. Menu **API Keys** (ou « Settings → API Keys ») : copier **API Key** et **API Secret**.
   Créer une clé dédiée au projet de test si l'interface le propose.

## À renseigner dans Render

| Variable                | Valeur     | Secret  |
| ----------------------- | ---------- | ------- |
| `CLOUDINARY_CLOUD_NAME` | Cloud name | non     |
| `CLOUDINARY_API_KEY`    | API Key    | non     |
| `CLOUDINARY_API_SECRET` | API Secret | **oui** |

Ne pas utiliser la variable `CLOUDINARY_URL` : l'app lit les trois variables ci-dessus.

## Ce qui sera créé

- Dossier racine `career-transition/` ; l'identifiant public des fichiers dérive d'ids,
  jamais du nom d'un candidat (RGPD).
- Documents candidat et exports PDF : **privés** (`type: authenticated`) ; le téléchargement
  est relayé par le serveur après contrôle d'accès.
- Logo d'organisation : seul fichier public.

## Vérifier

Après le déploiement (étape 8) : déposer un document candidat, le télécharger depuis l'app,
et constater qu'une URL Cloudinary directe n'est pas lisible sans signature.

## Quotas

L'offre gratuite est limitée en stockage et en transformations ; largement suffisant pour
2-3 testeurs. Vérifier les plafonds actuels sur la page tarifaire de Cloudinary.
