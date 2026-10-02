# Déploiement — procédure pas à pas

Runbook de mise en production (analyse des options dans [hosting.md](hosting.md)) :

- **Scénario 2 — beta fermée** : une VM (Oracle Always Free ou VPS ≈ 3–6 €/mois) en `docker-compose` complet (Postgres + web + worker + Caddy), toujours allumée.

Sommaire :

0. [Préparer le repo (obligatoire, une fois)](#0-préparer-le-repo-obligatoire-une-fois)
1. [Scénario 1 — retiré](#1-scénario-1--retiré)
2. [Scénario 2 — VM docker-compose](#2-scénario-2--vm-docker-compose-beta-fermée)
3. [Exploitation : mise à jour, rollback, sauvegardes, secrets](#3-exploitation)
4. [Incidents courants](#4-incidents-courants)
5. [Référence : variables d'environnement de production](#5-référence--variables-denvironnement-de-production)

---

## 0. Préparer le repo (obligatoire, une fois)

Sans ces correctifs, **aucun déploiement ne fonctionne** (détails et preuves dans [hosting.md §1.7 et §3.2](hosting.md#17-bug-bloquant-découvert--le-build-de-prod-ne-rend-aucune-page)). Faire une branche, appliquer, vérifier (`pnpm typecheck && node ace test && pnpm test:inertia && node ace build`), merger sur `main`.

### 0.1 Chemins SSR et manifest Vite (bloquant : 500 sur toutes les pages)

`config/inertia.ts` :

```ts
ssr: {
  enabled: true,
  bundle: 'ssr/ssr.js', // relatif à la racine de l'app (= build/ en prod)
},
```

`config/vite.ts` :

```ts
manifestFile: 'public/assets/.vite/manifest.json',
```

### 0.2 Connection string + SSL configurable (bloquant docker-compose)

`start/env.ts` — remplacer le bloc base de données par :

```ts
DB_URL: Env.schema.string.optional(),
DB_HOST: Env.schema.string.optional({ format: 'host' }),
DB_PORT: Env.schema.number.optional(),
DB_USER: Env.schema.string.optional(),
DB_PASSWORD: Env.schema.string.optional(),
DB_DATABASE: Env.schema.string.optional(),
DB_SSL: Env.schema.boolean.optional(),
```

`config/database.ts` — connexion `postgres` :

```ts
const dbUrl = env.get('DB_URL')
const ssl = env.get('DB_SSL', true) ? { rejectUnauthorized: false } : false

postgres: {
  client: 'pg',
  connection: dbUrl
    ? { connectionString: dbUrl, ssl }
    : {
        host: env.get('DB_HOST'),
        port: env.get('DB_PORT'),
        user: env.get('DB_USER'),
        password: env.get('DB_PASSWORD'),
        database: env.get('DB_DATABASE'),
        ssl,
      },
  migrations: { naturalSort: true, paths: ['database/migrations'] },
},
```

Règle : `DB_URL` **ou** le jeu `DB_*`, jamais un mélange partiel. `DB_SSL=false` uniquement pour un Postgres local/conteneur sans TLS.

### 0.3 Sortir le seed de comptes de la migration (bloquant : `migration:run` exige `ADMIN_PASSWORD`)

`database/migrations/1778062253238_create_seed_users_table.ts` — vider `up()` et `down()` (garder le fichier : il est déjà enregistré dans les bases de dev) :

```ts
export default class extends BaseSchema {
  async up() {} // seed déplacé dans database/seeders/admin_seeder.ts
  async down() {}
}
```

Le super admin est créé par `admin_seeder.ts` (idempotent, lit `ADMIN_PASSWORD`) : `node build/bin/console.js db:seed --files database/seeders/admin_seeder`. Le second compte en dur (« Pleiade Consulting ») se crée depuis l'UI super admin, pas par migration.

> ✅ Appliqué (issue #10).

### 0.4 Chemin des jobs de queue indépendant du `cwd`

`config/queue.ts` :

```ts
import app from '@adonisjs/core/services/app'
// …
locations: [app.makePath(app.inProduction ? 'app/jobs/**/*.js' : 'app/jobs/**/*.ts')],
```

### 0.5 Route de santé

`start/routes/public.ts` — **hors** du groupe `guest` :

```ts
import { HealthChecks } from '@adonisjs/core/health'
import { DbCheck } from '@adonisjs/lucid/database'
import db from '@adonisjs/lucid/services/db'

const healthChecks = new HealthChecks().register([new DbCheck(db.connection())])

router.get('/health', async ({ response }) => {
  const report = await healthChecks.run()
  return report.isHealthy ? response.ok(report) : response.serviceUnavailable(report)
})
```

> ✅ Appliqué (issue #12) : `start/health.ts` + `HealthChecksController`. La réponse est filtrée (`app/utils/health_report.ts`) : `isHealthy`, `status`, `finishedAt` et le nom/statut de chaque check — ni `debugInfo`, ni message d'erreur `pg` (loggé côté serveur en cas de 503).

### 0.6 Reverse proxy, SSE keep-alive, rate limiting

`config/app.ts` (objet `http`) : `trustProxy: () => true` — l'app n'est jamais exposée sans proxy dans les deux scénarios ; les liens d'onboarding passent alors en `https://`.

`config/transmit.ts` : `pingInterval: '30s'`.

Avec ce `trustProxy`, `request.ip()` renvoie l'entrée la plus à **gauche** de `X-Forwarded-For`, écrite par le client : elle ne sert à aucune décision de sécurité. Le rate limiting (ci-dessous) utilise `clientIp()` (`app/utils/client_ip.ts`), soit l'entrée la plus à **droite**, celle que le proxy (Caddy) réécrit. Un seul proxy doit donc se trouver devant l'app ; avec deux proxys chaînés (ex. CDN devant Caddy), la clé deviendrait l'IP du premier proxy et tous les clients partageraient un compteur.

#### Rate limiting des endpoints publics

`@adonisjs/limiter` (issue #23), limites définies dans `start/limiter.ts` :

| Route                     | Limite                                   | Clé                     |
| ------------------------- | ---------------------------------------- | ----------------------- |
| `POST /auth/login`        | 5 / minute                               | IP + e-mail (normalisé) |
| `POST /auth/register`     | 3 / heure                                | IP                      |
| `POST /contact-requests`  | 3 / heure (2 e-mails Resend par demande) | IP                      |
| `POST /onboarding/:token` | 10 / minute                              | IP                      |

Au-delà : 429 avec `Retry-After` et `X-RateLimit-*`. Une requête Inertia reçoit à la place un redirect back (303) avec `flash.error` et `errors.rateLimit` (`app/exceptions/handler.ts`). Store `memory` (`config/limiter.ts`) : les compteurs sont propres au process web et repartent à zéro au redémarrage. Avec plusieurs instances web, passer au store `database`.

### 0.7 Dockerfile et entrypoint (scénario 2)

> ✅ Appliqué (issue #14) : image construite et démarrée à chaque PR par le job CI `docker-image` (`migrate` → `seed` → `server`, `/health` 200, utilisateur `node`, HEALTHCHECK `healthy`) ; garde statique `tests/unit/hygiene/dockerfile.spec.ts`.

`Dockerfile` : stage `builder` (`pnpm install` complet + `node ace build`), puis stage `runner` qui ne contient que `build/` — il embarque son `package.json` et son `pnpm-lock.yaml` — et ses dépendances de production, dans `/app` (même installation que le job `smoke-prod-build`). Le stage `runner` fixe `NODE_ENV=production HOST=0.0.0.0 PORT=8080`, tourne en `USER node` et déclare un `HEALTHCHECK` (`wget` sur `/health`, `start-period` 40 s). Le build Alpine passe sans outillage natif : plus aucune dépendance à compiler (`better-sqlite3` a disparu, `@google/genai`, inutilisé, est retiré).

`docker/entrypoint.sh` — quatre modes, tous en `exec` (node est le PID 1 et reçoit `SIGTERM`) :

| Mode              | Commande                                                    | Usage                                                      |
| ----------------- | ----------------------------------------------------------- | ---------------------------------------------------------- |
| `server` (défaut) | `node bin/server.js`                                        | web, **sans migration**                                    |
| `worker`          | `node ace.js queue:work --queue=default,ai,pdfs,analytics`  | worker de queues                                           |
| `migrate`         | `node ace.js migration:run --force`                         | one-shot, avant `server`/`worker`                          |
| `seed`            | `node ace.js db:seed --files database/seeders/admin_seeder` | one-shot, super admin (idempotent, exige `ADMIN_PASSWORD`) |

Les migrations ne tournent plus à chaque boot du web : elles deviennent une étape explicite (`migrate`) de la procédure de mise à jour. Pour une autre commande ace (rollback…), contourner l'entrypoint : `docker run --rm --entrypoint node <image> ace.js <commande>`.

Vérification locale (Postgres accessible, fichier `.env` de prod) :

```bash
docker build -t career-transition-ai .
docker run --rm --network host --env-file .env career-transition-ai migrate
docker run --rm --network host --env-file .env career-transition-ai seed
docker run -d --name cta --network host --env-file .env career-transition-ai   # server
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8080/health         # 200
docker exec cta id -un                                                         # node
docker inspect -f '{{.State.Health.Status}}' cta                               # healthy (~30 s)
```

### 0.8 CI : publier l'image sur GHCR (scénario 2)

`.github/workflows/docker.yml` :

```yaml
name: Docker image
on:
  push:
    branches: [main]
    tags: ['v*']
permissions:
  contents: read
  packages: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-qemu-action@v3
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/metadata-action@v5
        id: meta
        with:
          images: ghcr.io/${{ github.repository }}
          tags: |
            type=sha
            type=raw,value=latest,enable={{is_default_branch}}
            type=ref,event=tag
      - uses: docker/build-push-action@v6
        with:
          push: true
          platforms: linux/amd64,linux/arm64
          tags: ${{ steps.meta.outputs.tags }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

`linux/arm64` couvre Oracle A1 et Raspberry Pi. Sur un repo privé, GHCR offre 500 Mo de stockage : garder `latest` + les 2–3 derniers `sha` (paramétrer la rétention dans Settings → Packages).

### 0.9 Métadonnées de version

Fait : `package.json` porte `"packageManager": "pnpm@10.18.3"` et `"engines": { "node": ">=24.0.0" }` ; `.env.example` est complet et démarre tel quel (`TZ=Europe/Paris`), `.env.production.example` sert de modèle de prod (voir §5).

---

## 1. Scénario 1 — retiré

L'ancien scénario Render Free + Neon (blueprint `render.yaml`) a été retiré : le seul déploiement supporté est la VM docker-compose du §2.

---

## 2. Scénario 2 — VM docker-compose (beta fermée)

Durée : ~1 h (hors attente de capacité Oracle). Prérequis : §0 mergé, image publiée sur GHCR (§0.8).

### 2.1 Obtenir la VM

**Option A — Oracle Cloud Always Free (0 €)**

1. <https://cloud.oracle.com> → compte Free (CB demandée, non débitée). Home region **Frankfurt** ou **Paris**.
2. Compute → **Create instance** : image **Ubuntu 24.04 (aarch64)**, shape **VM.Standard.A1.Flex**, **2 OCPU / 12 Go** (plafond Free depuis juin 2026), boot volume 50 Go, clé SSH.
   Si « Out of capacity » : réessayer à d'autres heures ou retenter avec 1 OCPU / 6 Go ; des scripts de relance existent (voir hosting.md).
3. Réseau : VCN → Security List → **Ingress** : TCP 80 et 443 depuis `0.0.0.0/0`. Puis **sur la VM**, Oracle bloque aussi en iptables :
   ```bash
   sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
   sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
   sudo netfilter-persistent save
   ```
4. Pour éviter la récupération « idle » (7 jours < 20 % CPU/RAM/réseau) : le worker et Postgres suffisent rarement. Passer le compte en **Pay As You Go** (reste 0 € dans les limites Free et supprime cette règle) ou accepter le risque.

**Option B — VPS (netcup ≈ 3,35 €/mois, Hetzner CX23 ≈ 5,5 €/mois)** : Ubuntu 24.04, 2 Go RAM minimum, région DE/FR, clé SSH. Firewall du fournisseur : 22, 80, 443.

### 2.2 Préparer l'hôte

```bash
ssh ubuntu@<IP>
sudo apt update && sudo apt -y upgrade
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER && newgrp docker
# swap 1 Go (indispensable sur 2 Go de RAM)
sudo fallocate -l 1G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
# mises à jour de sécurité automatiques
sudo apt -y install unattended-upgrades && sudo dpkg-reconfigure -plow unattended-upgrades
mkdir -p ~/cta && cd ~/cta
```

Nom d'hôte sans domaine : `<IP avec des tirets>.sslip.io`, ex. `129-146-10-20.sslip.io` (résout vers `129.146.10.20`). Vérifier : `dig +short 129-146-10-20.sslip.io`.

### 2.3 Fichiers de déploiement (`~/cta/`)

> ✅ Versionnés dans [`deploy/`](../deploy/) (issue #16) et démarrés à chaque PR par le job CI `docker-image` (`scripts/smoke_compose_prod.sh` : migrate/seed, `/health` en HTTPS via Caddy, app sans volume, `backup.sh`).

Copier le dossier sur l'hôte, puis remplir `.env` :

```bash
scp -r deploy/ <user>@<hôte>:~/cta        # ou git clone + cp -r deploy ~/cta
cd ~/cta && cp .env.example .env && chmod 600 .env
# remplacer chaque change-me-… ; APP_DOMAIN=<ip-avec-tirets>.sslip.io
```

| Fichier        | Rôle                                                                                                                                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `compose.yml`  | `postgres` (volume `pgdata`, healthcheck), `migrate` et `seed` (profil `ops`, one-shot), `app` (healthcheck `/health`), `worker`, `caddy` (80/443). `restart: unless-stopped`, `mem_limit` et `NODE_OPTIONS` par service. |
| `Caddyfile`    | TLS automatique sur `APP_DOMAIN` (Let's Encrypt, repli ZeroSSL), `reverse_proxy app:8080` avec `flush_interval -1` (SSE Transmit).                                                                                        |
| `.env.example` | Variables du compose (`APP_IMAGE`, `APP_DOMAIN`) et de l'application (validées contre `start/env_schema.ts` par `tests/unit/config/env_schema.spec.ts`).                                                                  |
| `backup.sh`    | `pg_dump` compressé dans `backups/`, rotation 14 jours (§2.6).                                                                                                                                                            |

**Aucun volume dans `app` ni `worker`** : les fichiers vont sur Cloudinary (`CLOUDINARY_*`, voir [Stockage des fichiers](#stockage-des-fichiers-cloudinary)). Web et worker n'ont pas de disque commun ; seuls Postgres et les certificats de Caddy sont persistés. Le HEALTHCHECK HTTP de l'image est désactivé sur `worker`, `migrate` et `seed`, qui ne servent pas de HTTP.

`APP_IMAGE` : l'image publiée sur GHCR (§0.8), ou en attendant une image construite sur l'hôte (`docker build -t cta:local .` depuis le repo, puis `APP_IMAGE=cta:local`). Si le repo GHCR est privé : `echo <PAT read:packages> | docker login ghcr.io -u malolebrin --password-stdin`.

### 2.4 Premier démarrage

```bash
cd ~/cta
docker compose pull
docker compose up -d postgres
docker compose run --rm migrate         # migrations (one-shot)
docker compose run --rm seed            # super admin (idempotent)
docker compose up -d                    # app, worker, caddy
docker compose ps                       # tous "healthy"/"running"
docker compose logs -f app worker       # pas de "No jobs found for locations", pas de E_MISSING_ENV
```

### 2.5 Vérifier

```bash
H=https://129-146-10-20.sslip.io
curl -s -o /dev/null -w "%{http_code}\n" $H/health         # 200
curl -sI $H/ | grep -i strict-transport                    # HSTS présent
curl -s $H/ | grep -o '<title[^<]*'                        # titre SSR
```

Puis, dans le navigateur, le parcours complet : connexion super admin → organisation → conseiller → candidat → lien d'onboarding (`docker compose logs app | grep onboarding`) → exercice → vérifier dans `docker compose logs worker` le job `ai` → export PDF → `completed` → téléchargement (PDF écrit par le worker sur Cloudinary, relayé par le web). Dérouler la checklist de [hosting.md §3.3](hosting.md#33-checklist-post-déploiement).

### 2.6 Sauvegardes (obligatoire pour une beta)

`~/cta/backup.sh` (versionné dans `deploy/`) : `pg_dump` via `docker compose exec`, gzip dans `backups/`, rotation 14 jours ; il affiche le chemin du dump et échoue si le fichier est vide. Copie hors machine : décommenter la ligne `rclone` (Cloudflare R2 ou Backblaze B2, 10 Go gratuits). Planifier :

```bash
(crontab -l 2>/dev/null; echo "15 3 * * * $HOME/cta/backup.sh >> $HOME/cta/backups/backup.log 2>&1") | crontab -
```

Tester la **restauration** une fois :

```bash
docker compose exec -T postgres createdb -U cta cta_restore
gunzip -c backups/<fichier>.sql.gz | docker compose exec -T postgres psql -U cta cta_restore -q
docker compose exec -T postgres psql -U cta cta_restore -c 'select count(*) from users;'
docker compose exec -T postgres dropdb -U cta cta_restore
```

Les PDF sont sur Cloudinary (purge nocturne à 30 jours) et régénérables : pas sauvegardés.

### 2.7 Variante sans IP publique : Tailscale Funnel

Sur la VM (ou une machine maison) : `curl -fsSL https://tailscale.com/install.sh | sh && sudo tailscale up`, activer **HTTPS certificates** et **Funnel** dans la console Tailscale (DNS → MagicDNS/HTTPS, puis Access controls → `nodeAttrs funnel`). Retirer le service `caddy` du compose, publier `app` sur `127.0.0.1:8080` (`ports: ['127.0.0.1:8080:8080']`) puis :

```bash
sudo tailscale funnel --bg 8080
# → https://<machine>.<tailnet>.ts.net (ports possibles : 443, 8443, 10000)
```

Beta 100 % privée (≤ 3 utilisateurs) : `sudo tailscale serve --bg 8080` à la place, et inviter les testeurs sur le tailnet.

---

## 3. Exploitation

### 3.1 Mettre à jour (scénario 2)

```bash
cd ~/cta
./backup.sh                                  # toujours avant une migration
docker compose pull
docker compose run --rm migrate
docker compose up -d app worker              # recrée uniquement ce qui a changé
docker compose ps && curl -s -o /dev/null -w "%{http_code}\n" https://<hôte>/health
docker image prune -f
```

Épingler une version plutôt que `latest` : `APP_IMAGE=ghcr.io/malolebrin/career-transition-ai:sha-<7 car.>` dans `.env`.

### 3.2 Rollback (scénario 2)

```bash
# 1. revenir à l'image précédente
sed -i 's#^APP_IMAGE=.*#APP_IMAGE=ghcr.io/malolebrin/career-transition-ai:sha-<précédent>#' .env
docker compose up -d app worker
# 2. si la migration livrée doit être annulée (et seulement si elle est réversible)
docker compose run --rm --entrypoint node app ace.js migration:rollback --force --batch=<n-1>
# 3. sinon : restaurer la sauvegarde faite en 3.1
```

### 3.3 Rotation des secrets

- `ADMIN_PASSWORD` : changer la valeur, puis `docker compose run --rm seed`.
- `APP_KEY` : changer = **déconnecte tout le monde** (sessions et cookies signés). À faire hors heures d'usage.
- `MISTRAL_API_KEY`, `RESEND_API_KEY` : changer la valeur puis `docker compose up -d app worker`.

### 3.4 Logs et supervision

- Scénario 2 : `docker compose logs -f --tail=200 app worker` ; limiter la taille dans `/etc/docker/daemon.json` : `{"log-driver":"json-file","log-opts":{"max-size":"20m","max-file":"5"}}` puis `sudo systemctl restart docker`.
- Uptime : UptimeRobot ou cron-job.org (gratuits) sur `https://<hôte>/health`, alerte e-mail.
- Espace disque : `df -h` ; `docker system df` ; les sauvegardes locales sont purgées à 14 jours.

### 3.5 Créer les comptes testeurs (beta)

Le super admin crée l'organisation puis les conseillers/candidats depuis l'UI. Avec un domaine vérifié (`MAIL_PROVIDER=resend`, [MAIL.md](MAIL.md#domaine-vérifié-production-issue-19)), chaque testeur reçoit son lien d'onboarding par e-mail. En repli sans domaine (`MAIL_PROVIDER=console`), récupérer les liens d'onboarding :

```bash
docker compose logs app --since 10m | grep -i 'onboarding'
```

et les transmettre manuellement (message privé). Les liens sont à usage unique et expirent (voir `docs/ONBOARDING.md`).

---

## 4. Incidents courants

| Symptôme                                                                      | Cause probable                                                                 | Action                                                                                                                                       |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 500 sur toutes les pages, log `ERR_MODULE_NOT_FOUND …/build/build/ssr/ssr.js` | §0.1 non appliqué                                                              | Corriger `config/inertia.ts` / `config/vite.ts`, rebuild.                                                                                    |
| Boot : `E_MISSING_ENV` / `Missing environment variable`                       | variable vide ou absente (une valeur vide compte comme absente)                | Comparer avec §5.                                                                                                                            |
| `The server does not support SSL connections`                                 | `DB_SSL` absent/`true` face à un Postgres sans TLS                             | `DB_SSL=false` (compose).                                                                                                                    |
| `ADMIN_PASSWORD est requis…` pendant `migration:run`                          | §0.3 non appliqué                                                              | Vider la migration de seed ; définir `ADMIN_PASSWORD` pour le seeder.                                                                        |
| Worker : `No jobs found for locations`                                        | glob relatif au `cwd` (§0.4) ou image lancée depuis `build/`                   | Appliquer §0.4 ; en Docker, passer par l'entrypoint (`worker`) ou `--entrypoint node … ace.js` depuis `/app`.                                |
| Export PDF `completed` mais téléchargement « fichier introuvable »            | PDF purgé (30 jours) ou supprimé de Cloudinary, identifiants d'un autre compte | Régénérer l'export ; vérifier que web et worker ont les mêmes `CLOUDINARY_*` ([§ stockage des fichiers](#stockage-des-fichiers-cloudinary)). |
| Démarrage : `Cloudinary : variables manquantes`                               | `CLOUDINARY_*` absentes en production                                          | Les renseigner sur le web **et** le worker.                                                                                                  |
| Exports PDF ne passent jamais en `completed`                                  | pas de worker (ou `QUEUE_DRIVER=database` sans `queue:work`)                   | `docker compose ps worker`, logs ; en mono-process utiliser `QUEUE_DRIVER=sync`.                                                             |
| Lien d'onboarding en `http://`                                                | `trustProxy` par défaut (`loopback`)                                           | §0.6.                                                                                                                                        |
| SSE coupés toutes les ~60–100 s, reconnexions en boucle                       | proxy qui bufferise / pas de keep-alive                                        | `flush_interval -1` (Caddy), `pingInterval: '30s'` (§0.6).                                                                                   |
| Analyse IA vide avec message d'erreur                                         | rate-limit plan Experiment / clé absente                                       | Vérifier `MISTRAL_API_KEY`, limites dans la console Mistral ; le job retente 2 fois.                                                         |
| E-mail non reçu par un testeur (Resend)                                       | domaine non vérifié : envoi restreint à ton adresse                            | Vérifier le domaine ([MAIL.md](MAIL.md#domaine-vérifié-production-issue-19)), ou `MAIL_PROVIDER=console`.                                    |
| Démarrage : `Mail : RESEND_API_KEY manquante` / `MAIL_FROM_EMAIL …`           | `MAIL_PROVIDER=resend` incomplet, ou expéditeur encore en `@resend.dev`        | Renseigner `RESEND_API_KEY` et `MAIL_FROM_EMAIL=no-reply@<ton-domaine>` (domaine vérifié), ou revenir à `console`.                           |
| Oracle : instance disparue                                                    | récupération « idle » Always Free                                              | Restaurer depuis sauvegarde sur une nouvelle instance ; passer en PAYG.                                                                      |
| OOM / redémarrages                                                            | pas de plafond V8 sur 512 Mo                                                   | `NODE_OPTIONS=--max-old-space-size=384` (web), `256` (worker).                                                                               |

---

## 5. Référence : variables d'environnement de production

Modèle à copier : [`.env.production.example`](../.env.production.example) (le développement local part de `.env.example`, qui démarre tel quel). Toutes les variables lues par le serveur sont déclarées et validées au boot par `start/env_schema.ts` : une valeur invalide (`QUEUE_DRIVER=redis`, `MAIL_PROVIDER=smtp`…) empêche le démarrage. Les deux fichiers d'exemple sont validés contre ce schéma par `tests/unit/config/env_schema.spec.ts`.

| Variable                                                                  | Obligatoire                                         | Valeur prod                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`                                                                | oui                                                 | `production`                                                                                                                                                                                                                       |
| `HOST` / `PORT`                                                           | oui                                                 | `0.0.0.0` / port du conteneur ou de la plateforme                                                                                                                                                                                  |
| `APP_URL`                                                                 | oui                                                 | URL publique en `https://` (base des liens envoyés par e-mail, jamais dérivée de l'en-tête `Host`) ; compose : `https://${APP_DOMAIN}`, posé par `deploy/compose.yml`                                                              |
| `APP_KEY`                                                                 | oui                                                 | `node ace generate:key`                                                                                                                                                                                                            |
| `LOG_LEVEL`                                                               | oui                                                 | `info`                                                                                                                                                                                                                             |
| `SESSION_DRIVER`                                                          | oui                                                 | `cookie`                                                                                                                                                                                                                           |
| `DB_URL` **ou** `DB_HOST`+`DB_PORT`+`DB_USER`+`DB_PASSWORD`+`DB_DATABASE` | oui (l'un des deux)                                 | Postgres managé : URL `?sslmode=require` ; compose : `DB_HOST=postgres`                                                                                                                                                            |
| `DB_SSL`                                                                  | non (défaut `true`)                                 | `false` seulement pour un Postgres sans TLS                                                                                                                                                                                        |
| `QUEUE_DRIVER`                                                            | oui                                                 | `sync` (mono-process) ou `database` (worker) ; pas de `redis` (aucun adapter)                                                                                                                                                      |
| `AI_PROVIDER`                                                             | non                                                 | `mistral` ou `none`                                                                                                                                                                                                                |
| `MISTRAL_API_KEY`, `MISTRAL_MODEL`                                        | si `mistral`                                        | clé ; `mistral-small-latest`                                                                                                                                                                                                       |
| `REGISTRATION_ENABLED`                                                    | non (défaut `false` en production, `true` ailleurs) | `false` pendant la beta fermée : `/auth/register` redirige vers la connexion, `POST /auth/register` renvoie 403 et le lien « S'inscrire » disparaît. Les comptes se créent depuis l'UI super admin                                 |
| `B2C_REGISTRATION_ENABLED`                                                | non (défaut `false` en production, `true` ailleurs) | Inscription des particuliers (épic B2C #93) : `false` tant que l'épic n'est pas complet — `/inscription` redirige vers la connexion, `POST /auth/register/candidat` renvoie 403 et le lien « Créer mon compte » disparaît de la connexion. Indépendant de `REGISTRATION_ENABLED` |
| `SEO_INDEXING`                                                            | non (défaut `false`)                                | `false` (`noindex, nofollow` + `robots.txt` en `Disallow: /`) tant que l'app est sur une URL provisoire ; `true` uniquement sur le domaine final (`config/seo.ts`)                                                                 |
| `STRIPE_ENABLED`                                                          | non (défaut `false`)                                | Forfait particuliers (épic B2C #90, `config/billing.ts`) : `false` tant que les CGV (`/cgv`) ne sont pas validées ; aucun paiement ne démarre et l'UI annonce « bientôt disponible »                                               |
| `B2C_RESULTS_PRICE_CENTS`                                                 | non (défaut `4900`)                                 | Prix TTC du forfait particuliers, en centimes                                                                                                                                                                                      |
| `GOOGLE_SITE_VERIFICATION`                                                | non                                                 | jeton Google Search Console ; la balise n'est rendue que s'il est défini                                                                                                                                                           |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`    | oui en production                                   | stockage des fichiers (`config/cloudinary.ts`) ; le serveur refuse de démarrer en production s'il en manque une. Optionnelles en dev (seul l'export PDF échoue). Voir [§ stockage des fichiers](#stockage-des-fichiers-cloudinary) |
| `SENTRY_DSN`                                                              | non (recommandé)                                    | DSN d'un projet Sentry **en région EU** (plan gratuit). Absent : aucune erreur n'est envoyée, seulement les logs. Voir [§ suivi des erreurs](#suivi-des-erreurs-sentry)                                                            |
| `SENTRY_ENVIRONMENT`                                                      | non (défaut `NODE_ENV`)                             | `production`, `staging`… pour séparer les environnements dans Sentry                                                                                                                                                               |
| `SENTRY_RELEASE`                                                          | non                                                 | sha du commit déployé (`git rev-parse HEAD`)                                                                                                                                                                                       |

| `MAIL_PROVIDER` | non (défaut `console`) | `resend` avec un domaine vérifié (garde au démarrage, `config/mail.ts`) ; `console` écrit les e-mails dans les logs |
| `MAIL_FROM_EMAIL` | **oui en production** (vérifié à l'envoi, même en `console` ; au démarrage avec `resend`) | adresse du domaine vérifié, jamais `@resend.dev` avec `resend` |
| `MAIL_FROM_NAME` | non | nom d'expéditeur |
| `RESEND_API_KEY` | si `MAIL_PROVIDER=resend` | clé Resend |
| `ADMIN_CONTACT_EMAIL` | non | destinataire des demandes de contact / démo |
| `MAIL_RESEND_TEST_MODE`, `MAIL_RESEND_TEST_EVENT`, `MAIL_RESEND_TEST_TO`, `MAIL_RESEND_TEST_FROM` | non (ignorées en production) | boîtes de test Resend hors production, voir `docs/MAIL.md` |
| `ADMIN_PASSWORD` | pour le seed seulement | requis par `admin_seeder` (création/rotation du super admin) |
| `APP_NAME` | non | nom du logger |

Hors schéma (lues par Node ou l'hébergeur) :

| Variable       | Rôle                                                                 |
| -------------- | -------------------------------------------------------------------- |
| `TZ`           | `Europe/Paris` (nom IANA ; `UTC+2` en notation POSIX signifie UTC−2) |
| `NODE_OPTIONS` | `--max-old-space-size=384` recommandé sur 512 Mo                     |

Variables de **build** (embarquées dans le bundle navigateur, à ne pas confondre avec le runtime) : `VITE_APP_NAME` (optionnel). Aucune clé API ne doit être préfixée `VITE_`.

---

## Stockage des fichiers (Cloudinary)

Cloudinary est le seul stockage de fichiers (issue #49, détails dans
[CLOUDINARY.md](CLOUDINARY.md)). Le worker y écrit les exports PDF
(`#services/pdf_storage_service` → `#services/cloudinary_service`) ; le web
les relit pour les servir, **après** le contrôle d'accès de
`PdfExportDownloadsController`. Les PDF sont **privés**
(`type: authenticated`) : le serveur signe une URL de téléchargement de
5 minutes, relaie le contenu, et ne la transmet jamais au navigateur. En base,
`pdf_exports.file_path` contient le `public_id`
(`career-transition/production/organizations/<orgId>/exports/pdf_export_<id>.pdf`),
sans le nom du candidat.

Mise en place :

1. Créer un compte Cloudinary (ou réutiliser un compte existant : tout est
   rangé sous `career-transition/`, puis `production` ou `dev`).
2. _Settings → API Keys_ : renseigner `CLOUDINARY_CLOUD_NAME`,
   `CLOUDINARY_API_KEY` et `CLOUDINARY_API_SECRET` sur le web **et** le
   worker (`.env` du compose).
3. Région : le stockage est aux États-Unis par défaut (transfert encadré par
   les clauses contractuelles types, voir `SUBPROCESSORS`). Un hébergement UE
   relève d'une offre payante (issue #24).

Vérification : générer un export depuis la synthèse d'un candidat, puis le
télécharger depuis la page _Tâches_.

Rétention : chaque nuit à 3 h (heure de Paris), `PurgeExpiredPdfExportsJob`
(planifié par `start/scheduler.ts`, exécuté par le worker) supprime les PDF de
plus de 30 jours (`PDF_EXPORT_RETENTION_DAYS`). L'export reste listé sans lien
de téléchargement ; il suffit de le régénérer. Une clé d'avant Cloudinary
(`exports/…`, stockage Drive) est traitée comme absente : téléchargement
« fichier introuvable », à régénérer.

---

## Suivi des erreurs (Sentry)

Actif dès que `SENTRY_DSN` est défini, sur le serveur **et** le worker
(`start/error_tracking.ts`, `#services/error_tracking_service`) :

| Envoyé                                                                                                     | Non envoyé                                                              |
| ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Erreurs HTTP **5xx** (`HttpExceptionHandler.report()`), avec méthode et route (`/dashboard/employees/:id`) | 4xx, erreurs métier (`ignoreCodes`), 404                                |
| Jobs en **échec définitif** (retries épuisés), avec queue, nom du job, id et nombre de tentatives          | tentatives rejouées, **payload** du job                                 |
| Utilisateur réduit à son **id**                                                                            | nom, e-mail, IP, cookies, corps de requête, query string (`scrubEvent`) |

Pas de traces de performance (`tracesSampleRate: 0`) : le quota gratuit
(5 000 événements/mois) reste pour les erreurs. Côté navigateur, une erreur de
rendu React affiche une page de secours (`ErrorBoundary`) au lieu d'une page
blanche ; elle n'est pas envoyée à Sentry.

Mise en place :

1. Créer un compte Sentry en **région EU** (choix à la création de
   l'organisation, non modifiable), puis un projet _Node.js_.
2. Copier le DSN dans `SENTRY_DSN` (web et worker, `.env` du compose).
3. Dans _Settings → Security & Privacy_ : laisser **Data Scrubber** actif et
   cocher **Prevent Storing of IP Addresses**.
4. Créer une alerte e-mail « nouvelle issue » (_Alerts → Create alert → Issues_).
5. Vérifier après déploiement, depuis le Shell du service web ou worker :

   ```bash
   node build/bin/console.js error-tracking:test
   # image Docker (scénario 2) :
   docker compose run --rm --entrypoint node app ace.js error-tracking:test
   ```

   L'erreur « Test du suivi des erreurs (error-tracking:test) » doit apparaître
   dans Sentry avec sa stack, l'environnement et la release. Sans DSN, la
   commande échoue avec « SENTRY_DSN non défini ».
