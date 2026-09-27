# RGPD — données des candidats, sous-traitants, droits

Référence opérationnelle pour les traitements de données personnelles de la
plateforme. Les pages publiques `/confidentialite` et `/securite` affichent la
même information depuis `shared/constants/legal.ts` (sous-traitants, durées de
conservation, contact) : **toute modification se fait d'abord dans ce fichier**,
puis ici.

Contact pour l'exercice des droits : `contact@francetransitioncarriere.fr`
(`PRIVACY_CONTACT_EMAIL`). Délai de réponse légal : **un mois** (art. 12).

## 1. Avant toute donnée réelle — checklist

- [ ] **Mistral : opt-out de l'utilisation des données pour l'entraînement.**
      Le plan gratuit *Experiment* de La Plateforme autorise Mistral à
      utiliser les prompts pour améliorer ses modèles, sauf opt-out. Dans la
      [console](https://console.mistral.ai/) : *Admin / Privacy* → désactiver
      l'usage des données pour l'entraînement (ou passer sur un plan payant
      qui l'exclut). Vérifier les conditions à jour du plan choisi. Les pages
      légales affirment qu'**aucune donnée n'est utilisée pour
      l'entraînement** : cette case doit être cochée avant la mise en ligne.
- [ ] **Hébergeur** : renseigner le prestataire et la région (UE) dans
      `SUBPROCESSORS` (`shared/constants/legal.ts`) et dans `SecurityPage.tsx`.
- [ ] **Resend** : vérifier la région du compte (UE ou États-Unis) et mettre à
      jour la localisation dans `SUBPROCESSORS`.
- [ ] Mentions légales (`LegalNoticePage.tsx`) : éditeur, hébergeur.

## 2. Sous-traitants et flux de données

| Sous-traitant | Données | Depuis | Mesure |
|---|---|---|---|
| **Mistral AI** (France) | Profil (poste, résumé, compétences, expériences, formations) et réponses aux exercices | Serveur : `AnalyzeExerciseQualitativeJob` (queue `ai`) | **Pseudonymisé** : `buildEmployeeAiProfile` n'inclut ni nom ni e-mail, et `pseudonymizeForAi` remplace le nom (complet, prénom, nom) et l'e-mail par `[candidat]` dans tout le texte libre, profil **et** données d'exercice (`shared/helpers/ai/exercise_profile.ts`). |
| **Mistral AI** (France) | **CV complet** (OCR `mistral-ocr-latest`) et son texte, pour pré-remplir le profil | Serveur : `POST /dashboard/ai/cv` (`#services/ai_assist_service`) | Non pseudonymisable : extraire nom, e-mail et parcours du CV est le but de l'import. Déclenché uniquement par l'utilisateur connecté qui importe son CV ; fichier non conservé (fichier temporaire de l'upload). |
| **Mistral AI** (France) | Récit libre (cartographie), compétences et poste visé (ciblage) | Serveur : `POST /dashboard/ai/skill-mapping`, `/dashboard/ai/targets` | Récit **pseudonymisé** avec l'identité de l'utilisateur connecté (`pseudonymizeForAi`) ; le ciblage n'envoie aucune donnée identifiante. |
| **Resend** | Nom, e-mail du destinataire, contenu des e-mails (invitation, notifications, formulaire de contact) | Serveur (`app/services/mail/`) | `MAIL_PROVIDER=console` en dev/test. |
| **Hébergeur** (UE, à choisir) | Toute la base PostgreSQL, PDF générés (`tmp/exports`) | — | Voir [hosting.md](hosting.md). |
| **Google Fonts** | Adresse IP du visiteur | Navigateur | Auto-héberger les polices supprimerait ce transfert. |

Règle de code : **aucun nom ni e-mail de candidat dans un prompt IA**. Tout
nouvel appel serveur à un fournisseur IA passe ses données par
`pseudonymizeForAi` (test de non-régression dans
`tests/integration/jobs/analyze_exercise_qualitative_job.spec.ts`).

## 3. Durées de conservation

Source : `RETENTION_PERIODS` (`shared/constants/legal.ts`).

| Données | Durée |
|---|---|
| Dossier candidat (profil, exercices, notes, plan) | Accompagnement, puis 3 ans après sa fin |
| Comptes utilisateurs des cabinets | Contrat, puis 3 ans |
| Demandes de contact (prospection B2B) | 3 ans après le dernier contact |
| Journaux techniques et de sécurité | 1 an |

Il n'existe **pas encore de purge automatique** : à l'échéance, appliquer la
procédure d'effacement ci-dessous (ou le SQL du §5 pour les demandes de
contact).

## 4. Demande d'accès / portabilité (candidat)

1. Vérifier l'identité du demandeur (réponse depuis l'adresse e-mail du compte).
2. Retrouver l'identifiant de la fiche candidat (`employees.id`) :

   ```sql
   SELECT id, name, email, organization_id FROM employees WHERE email = 'personne@example.com';
   ```

3. Générer l'export :

   ```bash
   node ace candidate:export <employeeId>                 # → tmp/rgpd/Dossier_<Nom>.zip
   node ace candidate:export <employeeId> --out=/chemin/export.zip
   # depuis le build de production :
   node ace.js candidate:export <employeeId>
   ```

   Le ZIP contient le dossier PDF (identique au téléchargement conseiller :
   `profil.pdf`, `resultats/<exercice>.pdf`) et `donnees.json` : fiche,
   compte (sans mot de passe ni jeton), compétences, expériences, formations,
   résultats d'exercices bruts et analyses IA, plan d'accompagnement, notes.

4. Transmettre le fichier par un canal sûr, puis **supprimer le ZIP** du
   serveur (`tmp/rgpd/`).

## 5. Demande d'effacement

### Candidat

```bash
node ace candidate:purge <employeeId>          # affiche ce qui sera supprimé, demande confirmation
node ace candidate:purge <employeeId> --force  # sans confirmation (scripts, shell non interactif)
```

Suppression **définitive**, en une transaction :

- la fiche `employees` et, par `ON DELETE CASCADE` : résultats d'exercices,
  expériences, formations, compétences, notes, étapes du plan / rendez-vous,
  synthèses, exports PDF ;
- le compte `users` lié s'il a le rôle candidat (`employees.user_id` est en
  `SET NULL`, donc non couvert par la cascade) et, en cascade, ses jetons
  d'onboarding et notifications — un compte conseiller/admin n'est jamais
  supprimé par cette commande ;
- les notifications des conseillers qui portent sur ce candidat
  (`meta.employeeId`, leur titre contient son nom) ;
- après validation de la transaction, les PDF générés sur disque
  (`pdf_exports.file_path`).

Restent hors de portée de la commande, à traiter à la main si nécessaire :
les **sauvegardes** de la base (l'effacement y devient effectif à leur
expiration — le mentionner dans la réponse), les e-mails déjà envoyés
(Resend conserve ses logs selon sa propre politique), les logs applicatifs.

### Demande de contact (prospect B2B)

```sql
DELETE FROM contact_requests WHERE email = 'personne@example.com';
```

### Répondre

Confirmer l'effacement au demandeur dans le délai d'un mois, en mentionnant
la durée de rétention des sauvegardes.
