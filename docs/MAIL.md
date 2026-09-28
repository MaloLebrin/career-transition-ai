# Emails (abstraction provider-agnostic)

Ce projet utilise une couche d’abstraction pour l’envoi d’emails, afin de pouvoir changer de provider facilement (console/dev aujourd’hui, provider “réel” demain) sans impacter le code métier.

---

## Architecture

- **Types & contrat** : `app/services/mail/types.ts`
  - `MailMessage`: structure commune (to/subject/text/html/tags/metadata)
  - `MailProvider`: interface (`send(message)`)

- **Service applicatif** : `app/services/mail/mail_service.ts`
  - Fournit `MailService.send(message)`
  - Choisit un provider via `MAIL_PROVIDER` (défaut: `console`)

- **Provider dev** : `app/services/mail/providers/console_mail_provider.ts`
  - Loggue le destinataire, le sujet et le texte en console

---

## Env / configuration

Toutes ces variables sont déclarées dans `start/env_schema.ts` et lues via `env.get` : une valeur hors enum (`MAIL_PROVIDER=smtp`, `MAIL_RESEND_TEST_EVENT=foo`) empêche le serveur de démarrer. Elles sont listées (commentées) dans `.env.example`.

### `MAIL_PROVIDER`

- Valeurs supportées actuellement : `console`, `resend`
- Défaut : `console` (si la variable n’est pas définie)

Exemple :

```bash
MAIL_PROVIDER=console
```

### `RESEND_API_KEY` (si `MAIL_PROVIDER=resend`)

Clé API Resend.

```bash
MAIL_PROVIDER=resend
RESEND_API_KEY=xxxx
```

### `MAIL_FROM_EMAIL` / `MAIL_FROM_NAME`

Adresse expéditeur utilisée pour les emails transactionnels.

```bash
MAIL_FROM_EMAIL="no-reply@ton-domaine.fr"
MAIL_FROM_NAME="Career Transition AI"
```

Mode **test-first** (sans domaine vérifié) : si `MAIL_FROM_EMAIL` est absent et que `NODE_ENV != production`, l’app utilise un expéditeur de test (`onboarding@resend.dev`). En production, `MAIL_FROM_EMAIL` est requis.

### `ADMIN_CONTACT_EMAIL`

Destinataire des demandes de contact et de démo (formulaire public). Défaut : `contact@francetransitioncarriere.fr`. Lue à chaque envoi, comme `MAIL_FROM_*`.

```bash
ADMIN_CONTACT_EMAIL="contact@ton-domaine.fr"
```

---

## Utilisation dans le code

### Envoyer un email

Depuis un service / controller :

```ts
import { MailService } from '#services/mail/mail_service'

const mail = new MailService()
await mail.send({
  from: { email: 'no-reply@ton-domaine.fr', name: 'Career Transition AI' },
  to: { email: 'user@example.com', name: 'User' },
  subject: 'Sujet',
  text: 'Contenu texte',
  // html: '<p>Contenu HTML</p>', // optionnel
  tags: ['onboarding'],
  metadata: { kind: 'onboarding', userId: 123 },
})
```

### Exemple: onboarding

- `app/services/onboarding_notify_service.ts` expose `sendOnboardingEmail(user, token, baseUrl)`
- Cette fonction construit le message (lien d’activation) puis passe par `MailService`

---

## Ajouter un nouveau provider (guide)

1. Créer un provider qui implémente `MailProvider` :
   - ex: `app/services/mail/providers/<provider>_mail_provider.ts`
2. Implémenter `send(message: MailMessage): Promise<void>` (appel SDK provider)
3. Câbler le provider dans `app/services/mail/mail_service.ts` :
   - ajouter un nouveau `MailProviderName`
   - gérer `MAIL_PROVIDER=<provider>`
4. Ajouter/adapter les tests (mocks, non-régression)

Objectif : le code métier (onboarding, notifications, etc.) ne dépend jamais d’un SDK provider.

---

## Provider Resend

- **Provider** : `app/services/mail/providers/resend_mail_provider.ts`
- **SDK** : `resend`
- **Env** : `MAIL_PROVIDER=resend`, `RESEND_API_KEY`, `MAIL_FROM_EMAIL` (+ optionnel `MAIL_FROM_NAME`)

### Notes d’implémentation

- `tags: string[]` est mappé vers les tags Resend sous la forme `{ name: 'tag', value: <tag> }`.
- `metadata` est envoyé via un header `X-Mail-Metadata` (JSON stringify) pour du tracing simple.

### Test emails en développement (Resend)

Pour tester sans impacter la réputation du domaine, le provider supporte un mode de routage vers les adresses de test Resend:

- `MAIL_RESEND_TEST_MODE=true` active le mode test (uniquement hors production).
- `MAIL_RESEND_TEST_EVENT=delivered|bounced|complained|suppressed` choisit le scénario.
- `MAIL_RESEND_TEST_TO=<adresse>` permet de forcer une adresse de test exacte (prioritaire).
- `MAIL_RESEND_TEST_FROM=<adresse>` permet de forcer l’expéditeur de test (sinon `onboarding@resend.dev`).

Exemple:

```bash
MAIL_PROVIDER=resend
MAIL_RESEND_TEST_MODE=true
MAIL_RESEND_TEST_EVENT=delivered
# ou MAIL_RESEND_TEST_TO=delivered+onboarding@resend.dev
```

Comportement:

- En mode test, le destinataire réel est remplacé par une adresse `@resend.dev`.
- En mode test, l’expéditeur est aussi remplacé par une adresse de test `@resend.dev` pour éviter les erreurs de domaine non vérifié.
- Le provider génère un label à partir de `metadata.kind` quand possible (ex: `delivered+onboarding@resend.dev`).
- Le scénario `suppressed` utilise `suppressed@resend.dev` (sans label).
- Par défaut, hors production (`development`/`test`), le mode test est activé si `MAIL_RESEND_TEST_MODE` n’est pas défini.

Référence Resend: [Send Test Emails](https://resend.com/docs/dashboard/emails/send-test-emails)

---

## Domaine vérifié (production, issue #19)

Sans domaine vérifié, Resend n'envoie qu'à l'adresse de ton propre compte : les testeurs ne reçoivent ni lien d'onboarding ni notification. La cible de production est donc **un domaine à soi (~7 €/an) vérifié chez Resend**.

1. Acheter le domaine chez un registrar (OVH, Gandi, Cloudflare…).
2. Resend → **Domains → Add domain**, région **EU (`eu-west-1`)** (données hébergées dans l'UE, cf. [RGPD.md](RGPD.md)). Un sous-domaine d'envoi (`mail.<domaine>`) isole la réputation d'envoi du domaine principal.
3. Chez le registrar, créer les enregistrements DNS affichés par Resend : **DKIM** (TXT `resend._domainkey`), **SPF** (MX + TXT sur le sous-domaine `send`). Ajouter un **DMARC** (`_dmarc`, TXT `v=DMARC1; p=none;`) : recommandé, il améliore la délivrabilité.
4. Attendre le statut **Verified** (quelques minutes à quelques heures), puis créer une clé API (_Sending access_, limitée au domaine).
5. Variables de production (`~/cta/.env` sur la VM, `docs/DEPLOYMENT.md` §2.3) :

   ```bash
   MAIL_PROVIDER=resend
   RESEND_API_KEY=re_xxx
   MAIL_FROM_EMAIL=no-reply@<ton-domaine>
   MAIL_FROM_NAME="Career Transition AI"
   ADMIN_CONTACT_EMAIL=contact@<ton-domaine>
   ```

6. Vérifier : créer un candidat test depuis l'UI super admin → l'e-mail d'onboarding arrive, expédié par `MAIL_FROM_EMAIL` (le provider Resend transmet l'expéditeur du message tel quel).

**Garde au démarrage** (`config/mail.ts`) : en production avec `MAIL_PROVIDER=resend`, le serveur refuse de démarrer si `RESEND_API_KEY` ou `MAIL_FROM_EMAIL` manque, ou si l'expéditeur est encore en `@resend.dev` (domaine non vérifié). Message : `Mail : … (voir docs/MAIL.md)`.

**Repli sans domaine** : `MAIL_PROVIDER=console` (+ `MAIL_FROM_EMAIL=onboarding@resend.dev`, requis en production par les services mail). Les e-mails sont écrits dans les logs ; le super admin y récupère le lien d'onboarding et le transmet à la main (`docs/DEPLOYMENT.md` §3.5).

---

## Tests

### Unit tests

Commande :

```bash
node ace test --suite=unit
```

Test existant :

- `tests/unit/services/onboarding_notify_service.spec.ts` (vérifie que l’envoi onboarding passe par la couche mail)

### Stratégie de test recommandée

- **Mock du provider** : instancier `new MailService(fakeProvider)` dans les tests ciblés si besoin.
- **Ne pas tester les SDKs** dans les tests unit : tester plutôt que `MailService.send()` appelle bien le provider avec le bon `MailMessage`.
