# Workflow d'onboarding candidat

Ce document décrit le parcours d’invitation des candidats (talents) : création d’espace, envoi du lien par email, création du mot de passe et accès au dashboard.

---

## Vue d’ensemble

1. **Conseiller / Admin** invite un candidat depuis le dashboard (modal « Inviter un Talent »).
2. Le **système** crée l’employé (Employee), un compte utilisateur (User) et un token d’onboarding, puis envoie (ou log) un lien d’activation.
3. Le **candidat** reçoit un email contenant un lien unique vers une page « Créer votre mot de passe ».
4. Le **candidat** définit son mot de passe, est connecté automatiquement et est redirigé vers le dashboard (onboarding ou premier exercice).

---

## Côté conseiller (dashboard)

- **Où** : Dashboard → bouton « Inviter un Talent » (modal).
- **Données** : Nom complet, email professionnel (obligatoires).
- **Action** : `POST /dashboard/employees` (Inertia, `EmployeesController.storeFromDashboard`).
- **Effets** :
  - Création d’un **Employee** (organisation, conseiller, nom, email, `onboarded: false`, `userId` renseigné après création du User).
  - Création d’un **User** (même organisation, même nom/email, rôle `employee`, mot de passe temporaire hashé, jamais communiqué).
  - Liaison `Employee.userId = User.id`.
  - Création d’un **OnboardingToken** (token unique, expiration 7 jours, `used_at: null`).
  - Appel au service d’envoi d’email (par défaut : log du lien en console ; à remplacer par un vrai mailer en production).
- **Message utilisateur** : « Candidat ajouté. Un lien d’activation a été envoyé par email. »
- **Erreur** : Si un utilisateur avec le même email existe déjà dans l’organisation → message d’erreur et redirect back.

---

## Côté candidat (lien reçu par email)

### Lien reçu

- **URL** : `{BASE_URL}/onboarding/{token}`
- **Exemple** : `https://app.example.com/onboarding/a1b2c3d4e5...`
- **Méthode** : GET (page publique, pas de connexion requise).

### Page « Créer votre mot de passe »

- **Route** : `GET /onboarding/:token`
- **Contrôleur** : `OnboardingController.show`
- **Page Inertia** : `onboarding/SetPassword`
- **Props** : `token`, `userName`
- **Comportement** :
  - Si token absent / invalide / expiré / déjà utilisé → affichage de la page `onboarding/InvalidToken` (message « Lien invalide » ou « Lien expiré », lien vers `/auth`).
  - Sinon : formulaire avec champs « Mot de passe » et « Confirmer le mot de passe » (min. 8 caractères).

### Soumission du mot de passe

- **Route** : `POST /onboarding/:token`
- **Contrôleur** : `OnboardingController.submit`
- **Body** : `password`, `password_confirmation` (validation Vine : min 8 caractères, confirmation identique).
- **Comportement** :
  1. Vérification du token (présent, valide, non expiré, non utilisé).
  2. Hash du mot de passe (scrypt) et mise à jour du `User`.
  3. Marque du token comme utilisé (`used_at` renseigné).
  4. Connexion automatique : `auth.use('web').login(user)`.
  5. Redirection vers `/dashboard` avec flash « Mot de passe créé. Bienvenue ! ».

Après redirection, le candidat voit le dashboard ; selon la logique existante, l’onboarding (profil, etc.) ou le premier exercice peut s’afficher.

---

## Modèles et base de données

### Table `onboarding_tokens`

| Colonne      | Type       | Description                            |
| ------------ | ---------- | -------------------------------------- |
| `id`         | integer PK | —                                      |
| `user_id`    | integer FK | Référence `users.id` (CASCADE)         |
| `token`      | string(64) | Token unique (hex, 32 bytes)           |
| `expires_at` | timestamp  | Date d’expiration (création + 7 j)     |
| `used_at`    | timestamp  | Nullable ; renseigné après utilisation |
| `created_at` | timestamp  | —                                      |

### Règles métier

- Un token est **valide** si : `used_at` est null et `expires_at` > maintenant.
- Un token est **one-shot** : après utilisation, il ne peut plus servir.
- Un même `User` peut avoir eu plusieurs tokens (ex. ré-invitation), mais un seul token actif à la fois pour un flux donné.

---

## Envoi d’email (production)

- **Service actuel** : `app/services/onboarding_notify_service.ts` → `sendOnboardingEmail(user, token, baseUrl)`.
- **Comportement par défaut** : log du lien en console (dev / debug).
- **Pour la production** : remplacer par un envoi réel (ex. `@adonisjs/mail`), en utilisant une vue ou un template d’email avec le lien `{baseUrl}/onboarding/{token}` et un court texte du type « Votre espace France Transition Carrière est prêt, créez votre mot de passe via le lien ci-dessous ».
- **Base URL** : aujourd’hui fournie par `request.origin()` ou `protocol + hostname` dans `storeFromDashboard`. En production, une variable d’environnement `APP_URL` peut être utilisée pour forcer l’URL publique du lien.

---

## Fichiers principaux

| Rôle                | Fichier                                                               |
| ------------------- | --------------------------------------------------------------------- |
| Migration           | `database/migrations/1730500000000_create_onboarding_tokens_table.ts` |
| Modèle token        | `app/models/onboarding_token.ts`                                      |
| Validator           | `app/validators/onboarding_set_password_validator.ts`                 |
| Contrôleur          | `app/controllers/onboarding_controller.ts`                            |
| Notify (stub)       | `app/services/onboarding_notify_service.ts`                           |
| Création User+token | `app/services/employees_service.ts` (option `baseUrl`)                |
| Invite dashboard    | `app/controllers/employees_controller.ts` → `storeFromDashboard`      |
| Pages Inertia       | `inertia/pages/onboarding/SetPassword.tsx`, `InvalidToken.tsx`        |
| Routes              | `start/routes.ts` → préfixe `/onboarding`                             |

---

## Routes résumées

- `GET  /onboarding/:token` — Affiche la page « Créer votre mot de passe » ou « Lien invalide ».
- `POST /onboarding/:token` — Enregistre le mot de passe, connecte l’utilisateur, redirige vers `/dashboard`.

Ces routes sont **publiques** (pas de middleware auth).
