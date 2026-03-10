# Plan de tests manuels – France Transition Carrière

Objectif : couvrir, par des scénarios concrets, l’ensemble des fonctionnalités décrites dans `FEATURES.md`.

---

## 1. Landing & acquisition

### 1.1. Affichage landing

- **Préconditions**
  - Application démarrée.
- **Étapes**
  1. Aller sur l’URL publique principale.
- **Vérifications**
  - Le slogan sur l’IA et la méthodologie apparaît.
  - Les sections Méthodologie / IA sont visibles.
  - Les boutons “Lancer le Portail” et, le cas échéant, “Accès Expert” sont présents.

### 1.2. Navigation landing → auth

- **Étapes**
  1. Cliquer sur “Lancer le Portail”.
- **Vérifications**
  - Redirection vers l’écran de connexion / inscription.
  - Le branding (logo, couleurs) reste cohérent.

---

## 2. Authentification

### 2.1. Inscription talent

- **Étapes**
  1. Depuis la page d’auth, cliquer “Créer un compte” / “S’inscrire”.
  2. Remplir nom, email valide, mot de passe ≥ 6 caractères.
  3. Soumettre le formulaire.
- **Vérifications**
  - En cas de champ manquant, message d’erreur approprié.
  - En cas d’email valide et mot de passe suffisant, inscription réussie (pas d’erreur visible).
  - Un compte talent est créé (vérification en base ou via interface admin si possible).

### 2.2. Inscription conseiller

- **Étapes**
  1. Reprendre le flux d’inscription.
  2. Choisir “Conseiller”.
  3. Remplir les champs et soumettre.
- **Vérifications**
  - L’utilisateur est défini comme conseiller (possède accès au Bureau, voir §3).

### 2.3. Connexion

- **Scénario “succès”**
  - **Étapes**
    1. Sur la page de login, saisir email / mot de passe valides.
    2. Cliquer sur “Se connecter”.
  - **Vérifications**
    - Redirection vers le bon espace (Bureau pour conseiller, home pour talent).
- **Scénario “erreur identifiants”**
  - **Étapes**
    1. Saisir un mauvais mot de passe.
  - **Vérifications**
    - Affichage d’un message de type “Identifiants invalides”.

### 2.4. Déconnexion

- **Étapes**
  1. Connecté en conseiller, cliquer sur “Quitter”.
  2. Dans la modale, cliquer sur “Annuler”.
  3. Recliquer sur “Quitter”.
  4. Cliquer sur “Se déconnecter”.
- **Vérifications**
  - Étape 2 : la modale se ferme, on reste connecté.
  - Étape 4 : la session est fermée, on retourne vers une page publique / login.

---

## 3. Espace conseiller – Bureau

### 3.1. Vue Bureau

- **Préconditions**
  - Connecté en conseiller avec au moins 1 candidat.
- **Étapes**
  1. Aller sur le Bureau.
- **Vérifications**
  - La liste des candidats apparaît (au moins 1 entrée).
  - Les compteurs “Total suivis”, “En attente”, “Étapes validées” sont cohérents avec les données.
  - Les blocs “Dernières activités” / “Prochains rendez-vous” reflètent les dernières actions effectuées.

### 3.2. Navigation latérale

- **Étapes**
  1. Cliquer successivement sur “Bureau”, “Candidats”, “Réglages”, “Design”.
- **Vérifications**
  - Chaque clic change bien le contenu principal.
  - Le menu reflète l’onglet actif (état visuel).

---

## 4. Gestion des candidats

### 4.1. Création de candidat

- **Étapes**
  1. Depuis le Bureau ou la page Candidats, cliquer sur “Nouveau candidat”.
  2. Remplir nom, email, rôle actuel.
  3. Soumettre.
- **Vérifications**
  - En cas de champ manquant, messages d’erreur.
  - En cas de succès : message “Candidat ajouté…”, redirection vers la liste ou le détail.
  - Le nouveau candidat apparaît bien dans la liste.

### 4.2. Invitation & onboarding

- **Étapes**
  1. Créer un candidat avec un email contrôlable.
  2. Récupérer le lien d’onboarding (via logs ou mail selon l’environnement).
  3. Ouvrir le lien.
- **Vérifications**
  - Le lien permet de définir un mot de passe.
  - Après validation, le talent peut se connecter avec ses identifiants.
  - En utilisant un lien volontairement corrompu → affichage d’une page “lien invalide” (ou équivalent).

### 4.3. Fiche candidat

- **Étapes**
  1. Depuis la liste des candidats, ouvrir la fiche d’un candidat complet.
- **Vérifications**
  - Bloc Profil : email, rôle actuel, rôle cible, statut.
  - Bloc “Bref / Résumé” présent avec le texte attendu.
  - Bloc Expériences : au moins une expérience listée avec poste, entreprise, dates, description.
  - Bloc Formations : au moins une formation.
  - Bloc Compétences : compétences avec niveaux.

- **États vides**
  - **Étapes**
    1. Créer un candidat de test sans expérience / formation / résumé.
    2. Ouvrir sa fiche.
  - **Vérifications**
    - L’affichage reste propre (messages d’état vide, pas d’erreur JS).

---

## 5. Exercices & diagnostics (par talent)

> Pour chaque exercice, tester **démarrage, saisie minimale, brouillon, finalisation**.

### 5.1. Motivation

- **Étapes**
  1. Lancer l’exercice Motivation pour un candidat.
  2. Lire l’introduction.
  3. Répondre aux comparaisons jusqu’au résultat.
- **Vérifications**
  - Le classement final de motivations est affiché.
  - Le résultat est rattaché au bon candidat (visible dans ses données / résultats).

### 5.2. Valeurs

- **Étapes**
  1. Lancer l’exercice Valeurs.
  2. Sélectionner plusieurs valeurs, appliquer la logique proposée (classement/tri).
  3. Valider.
- **Vérifications**
  - Un top valeurs est affiché.
  - Le candidat possède bien un résultat Valeurs dans son dossier.

### 5.3. Personnalité / DISC

- **Étapes**
  1. Lancer l’exercice Personnalité / DISC.
  2. Compléter le questionnaire.
  3. Valider.
- **Vérifications**
  - Un profil comportemental est calculé.
  - Un résumé du type de profil est présent (phrases signifiantes, pas seulement des scores).

### 5.4. Courbe de vie

- **Étapes**
  1. Lancer Courbe de vie.
  2. Ajouter plusieurs points (événements).
  3. Sauvegarder.
- **Vérifications**
  - La courbe est visuellement cohérente.
  - Les points ajoutés sont visibles en ré-ouvrant l’exercice.

### 5.5. Ciblage & plan d’action

- **Scénario manuel**
  - Ajouter plusieurs cibles à la main (nom, type, commentaires) puis valider.

- **Scénario IA**
  - Fournir au moins un profil avec compétences et rôle cible.
  - Lancer les suggestions IA.

- **Vérifications**
  - Des cibles IA sont proposées et peuvent être intégrées à la liste.
  - Après validation, la liste de cibles est mémorisée pour le candidat.

### 5.6. Cartographie des compétences

- **Étape 1 – Récit**
  - Rédiger un récit d’expérience (texte suffisamment long).
  - Lancer la restructuration par l’IA.
  - Attendre l’apparition de la table “Validation des Acquis”.

- **Étape 2 – Validation**
  - Ajouter une ligne manuelle (mission/activité/preuve).
  - Modifier au moins une ligne issue de l’IA.
  - Valider la cartographie.

- **Vérifications**
  - La cartographie finale est cohérente.
  - Elle est associée au bon candidat et ré-ouvrable.

### 5.7. Cercle de contrôle

- **Étapes**
  1. Lancer l’exercice.
  2. Saisir plusieurs préoccupations et les répartir dans les cercles (Contrôle / Influence / Hors contrôle).
  3. Enregistrer.
- **Vérifications**
  - Les éléments sont affichés dans les bons cercles à la réouverture.

### 5.8. Sauvegarde de brouillons

- **Étapes générales**
  1. Lancer un exercice long (par ex. Motivation ou Cartographie).
  2. Effectuer quelques saisies.
  3. Provoquer une sauvegarde (automatique ou par action).
  4. Fermer la page et revenir plus tard sur le même exercice.
- **Vérifications**
  - Le contenu précédemment saisi est restauré (texte, sélections, points…).

---

## 6. Reporting & supervision (Super Admin)

### 6.1. SuperAdminHome

- **Étapes**
  1. Se connecter en super admin.
  2. Ouvrir la page d’accueil super admin.
- **Vérifications**
  - Les compteurs d’organisations et d’utilisateurs sont cohérents.
  - Depuis un compte non super admin, l’accès est refusé (page “Accès réservé” ou équivalent).

### 6.2. Usage des exercices par organisation

- **Liste principale**
  - **Étapes**
    1. Aller sur la page “Usage des exercices”.
  - **Vérifications**
    - Chaque organisation affiche un total d’exercices complétés.
    - Les colonnes par type (Motivation, Valeurs, etc.) sont remplies.

- **Filtres**
  - **Étapes**
    1. Modifier la date “Du”.
    2. Modifier la date “Au”.
    3. Sélectionner une organisation spécifique.
  - **Vérifications**
    - Les totaux changent selon la période.
    - Le filtre d’organisation réduit bien la liste au cabinet choisi.

- **Drill-down**
  - **Étapes**
    1. Cliquer sur la ligne d’un cabinet.
  - **Vérifications**
    - Le tableau se met à jour pour refléter ce cabinet uniquement.
    - Les paramètres de filtre sont bien pré-remplis pour ce cabinet.

- **Export CSV**
  - **Étapes**
    1. Cliquer sur “Export CSV”.
  - **Vérifications**
    - Un fichier CSV est téléchargé.
    - Il contient au moins : id organisation, nom organisation, type exercice, count.

---

## 7. Organisations & utilisateurs

### 7.1. Organisations

- **Liste**
  - Affiche toutes les organisations avec nom, slug, nombre d’utilisateurs et de talents.

- **Création**
  - **Étapes**
    1. Cliquer sur “Créer une organisation”.
    2. Remplir nom et slug.
    3. Soumettre.
  - **Vérifications**
    - En cas de slug dupliqué → message d’erreur.
    - En cas de succès → l’organisation apparaît dans la liste.

- **Impersonation**
  - **Étapes**
    1. Sur une organisation, utiliser l’action d’impersonation.
  - **Vérifications**
    - L’interface se comporte comme si on était admin de ce cabinet (accès à ses réglages, etc.).

### 7.2. Utilisateurs

- **Liste globale**
  - Affiche nom, email, rôle et organisation.

- **Recherche & filtre**
  - **Étapes**
    1. Chercher par nom ou email.
    2. Filtrer par rôle (salarié, conseiller, admin, super admin).
  - **Vérifications**
    - Les résultats correspondent aux filtres et à la recherche.

- **Changement de rôle**
  - **Étapes**
    1. Sur un utilisateur, cliquer pour le promouvoir (par ex. en “Admin orga”).
  - **Vérifications**
    - Le rôle affiché est mis à jour.
    - Le comportement de l’utilisateur (accès aux écrans) change en conséquence.

---

## 8. Jobs de fond

### 8.1. Jobs en arrière-plan

- **Scénario “aucun job”**
  - **Étapes**
    1. Accéder à la page des jobs sans job actif.
  - **Vérifications**
    - Un message “Aucun job en arrière-plan pour le moment” (ou similaire) est affiché.

- **Scénario “jobs présents”**
  - **Étapes**
    1. Lancer une opération qui déclenche un job (ex. génération d’un lot de PDF ou campagne d’emails).
    2. Revenir sur la page des jobs.
  - **Vérifications**
    - Le job apparaît avec un statut (pending/processing/completed/failed).

- **Mise à jour temps réel**
  - **Étapes**
    1. Lancer un job en restant sur la page.
  - **Vérifications**
    - Le statut évolue sans rechargement complet (si SSE activé).

---

## 9. PDF & exports

### 9.1. Rapport PDF

- **Scénario “dossier riche”**
  - **Étapes**
    1. Sur un candidat avec plusieurs exercices complétés, lancer la génération PDF.
  - **Vérifications**
    - Page de couverture : nom candidat, date, branding.
    - Présence de synthèses pour motivations, valeurs, personnalité, compétences.
    - Page de systémie claire et lisible.

- **Scénario “dossier partiel”**
  - **Étapes**
    1. Générer un PDF pour un candidat avec peu de données.
  - **Vérifications**
    - Le PDF reste lisible et utilise des formulations de fallback (“En cours”, “Non défini”, etc.).

### 9.2. Exports CSV

- Couvert pour l’instant par le test “Usage des exercices” (voir §6.2).

---

## 10. Expérience utilisateur & messages métier

### 10.1. Bannières flash & erreurs

- **Étapes**
  1. Tenter de créer un candidat avec un email déjà utilisé dans l’organisation.
  2. Tenter de créer une organisation avec un slug déjà pris.
  3. Forcer une erreur d’auth (mauvais mot de passe).
- **Vérifications**
  - Chaque action affiche une bannière ou un message clair décrivant le problème.
  - Les messages disparaissent après rechargement ou peuvent être fermés (si prévu).

---

Ce document doit être utilisé comme **checklist de recette manuelle**.  
Pour chaque scénario, tu peux noter : _OK_, _KO_, commentaires, date de test, et version de l’application.

