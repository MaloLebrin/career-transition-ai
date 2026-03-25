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

