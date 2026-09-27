# Déploiement sur Render (Infrastructure as Code)

Ce document explique comment l'infrastructure de **Career Transition AI** est gérée et déployée sur Render via l'outil natif de Blueprints (`render.yaml`).

## 🏗️ Architecture Provisionnée
Le fichier `render.yaml` à la racine du projet permet de déployer automatiquement les composants suivants sur Render :
1. **Base de données PostgreSQL** (`career-transition-db`, Plan starter) : Stockage des données de l'application.
2. **Web Service AdonisJS** (`career-transition-web`) : Serveur principal HTTP.
3. **Background Worker** (`career-transition-worker`) : Processus d'arrière-plan pour les tâches asynchrones (emails, PDFs, IA) gérées par `@boringnode/queue`.

## 🚀 1. Premier Déploiement (Initialisation)

L'avantage de cette méthode est que toute la configuration est lue directement par Render depuis ton dépôt GitHub.

1. Assure-toi que le fichier `render.yaml` est bien sur la branche `main` de ton dépôt GitHub.
2. Connecte-toi à ton [Dashboard Render](https://dashboard.render.com).
3. Dans la barre de navigation, clique sur **Blueprints** puis sur **New Blueprint Instance**.
4. Connecte/sélectionne ton dépôt GitHub `career-transition-ai`.
5. Render va analyser le fichier `render.yaml`.
6. L'interface te demandera de remplir les variables secrètes (celles marquées `sync: false` dans le fichier), comme :
   - `APP_KEY`
   - `ADMIN_PASSWORD`
   - `RESEND_API_KEY`
   - `MISTRAL_API_KEY`
   - `SENTRY_DSN` (suivi des erreurs, projet Sentry en région EU ; vide = désactivé)
7. Clique sur **Apply** et laisse Render créer la base de données, les serveurs et déployer le code !

### Créer (ou mettre à jour) le super admin

Les migrations ne créent **aucun compte** et ne lisent pas `ADMIN_PASSWORD` : `migration:run --force` passe sans ce secret. Le super admin est créé par le seeder dédié, idempotent, depuis le **Shell** du service web :

```bash
node build/bin/console.js db:seed --files database/seeders/admin_seeder
```

Il lit `ADMIN_PASSWORD` : relancer la commande après avoir changé la variable fait tourner le mot de passe. Les autres organisations et comptes se créent depuis l'UI super admin.

## 🔄 2. Déploiements Suivants (Mises à jour)

Grâce à cette configuration, tu n'as **plus rien à faire**.
À chaque fois que tu vas `push` du nouveau code sur la branche `main` de ton répertoire GitHub, Render va automatiquement détecter les changements, re-builder l'application et la redéployer sans aucune coupure de service.

## 🛠️ Ajouter ou Modifier des Variables d'Environnement

Si tu dois ajouter une nouvelle clé secrète à l'avenir :
1. Ajoute-la dans `render.yaml` sous `envVarGroups` avec la propriété `sync: false`.
2. Commit et Push tes changements.
3. Rends-toi dans le Dashboard Render de ton projet, tu auras une notification te demandant de renseigner la valeur de cette nouvelle clé.
