# Cartographie fonctionnelle – France Transition Carrière

## 1. Acquisition & image de marque

### 1.1 Landing publique

- **Promesse produit**
  - “L’IA qui structure le potentiel humain / travail”.
  - Positionnement premium : mélange sciences comportementales + IA (Gemini).

- **Sections pédagogiques**
  - **Méthodologie** : explication du cadre de travail, étapes d’accompagnement, logique de diagnostic.
  - **Intelligence Artificielle** : rôle de l’IA dans la structuration des récits, la génération de synthèses et les suggestions de cibles.
  - **Bénéfices** pour les cabinets (industrialisation, qualité de restitution) et pour les talents (clarté, prise de décision).

- **Parcours d’entrée**
  - Call-to-actions :
    - “Lancer le Portail” (accès au parcours d’authentification).
    - “Accès Expert” (usage par les cabinets).
  - Cohérence graphique (logo, couleurs, typographies, animations) entre la landing, l’auth et le portail.

---

## 2. Authentification & gestion des accès

### 2.1 Création de compte

- **Profils supportés**
  - **Talent / Salarié** : accès à ses exercices, résultats, fiches.
  - **Conseiller / Expert** : accès au bureau, liste de ses candidats, outils d’analyse.

- **Règles métiers**
  - Nom, email, mot de passe : validations de base (présence, format, longueur minimale).
  - Rôle : choix explicite entre Salarié et Conseiller.

### 2.2 Connexion & sécurité

- **Connexion**
  - Authentification email + mot de passe.
  - Gestion des erreurs (identifiants invalides) avec messages clairs.

- **Déconnexion**
  - Modal de confirmation (“Êtes-vous sûr de vouloir vous déconnecter ?”).
  - Fin de session effective (accès coupé aux espaces sécurisés).

---

## 3. Espace Conseiller – Bureau & pilotage

### 3.1 Bureau (Dashboard conseiller)

- **Vue synthétique**
  - Liste des **candidats suivis** (nom, email, statut d’accompagnement).
  - Indicateurs clés :
    - Total de candidats suivis.
    - Nombre de candidats “en attente” (non onboardés / en début de parcours).
    - Nombre total d’**étapes validées** (exercices complétés).

- **Timelines métier**
  - **Dernières activités** :
    - Derniers exercices complétés (type d’exercice, candidat, date).
  - **Prochains rendez-vous** :
    - Rendez-vous planifiés à venir, triés chronologiquement.

### 3.2 Navigation métier

- **Sections principales**
  - **Bureau** : vue globale conseiller.
  - **Candidats** : liste détaillée de ses talents, accès aux fiches.
  - **Réglages** : configuration du cabinet, des membres.
  - **Design** : zone dédiée à la personnalisation (présente ou à activer selon roadmap).

- **Actions rapides**
  - Bouton **“Nouveau candidat”**.
  - Raccourcis vers :
    - Fiche complète du candidat.
    - Liste des exercices.
    - Résultats consolidés.

---

## 4. Gestion des talents / candidats

### 4.1 Création & invitation

- **Création de candidat**
  - Saisie : nom, email, rôle actuel (poste actuel).
  - Association automatique au cabinet (organisation) et au conseiller.

- **Invitation**
  - Envoi automatique d’un **lien d’activation** au talent par email.
  - Gestion des cas métier (candidat déjà existant dans l’organisation → message explicite).

### 4.2 Onboarding Talent

- **Lien d’activation**
  - Token sécurisé dans l’URL (onboarding).
  - Pages prévues pour :
    - Lien invalide / expiré (page “lien invalide”).
    - Création du mot de passe et finalisation du compte.

### 4.3 Fiche candidat (profil complet)

- **Bloc Profil**
  - Nom, email, statut, rôle actuel, rôle cible.
  - Indicateurs d’onboarding (onboardé / en cours).

- **Résumé / “Bref”**
  - Texte synthétique décrivant le parcours et les objectifs.
  - Utilisable comme support pour restitution au talent ou à un tiers.

- **Expériences**
  - Informations suivies :
    - Intitulé du poste.
    - Entreprise.
    - Type de contrat (CDI, CDD, etc.).
    - Dates de début / fin, poste actuel ou passé.
    - Description des missions clés.

- **Formations**
  - Diplômes, écoles, périodes.
  - Distinction des formations clés à valoriser.

- **Compétences**
  - Liste de compétences avec niveau (par exemple 1–5).
  - Support pour la cartographie globale des forces du talent.

- **États spéciaux**
  - Gestion des dossiers incomplets (peu ou pas d’expériences, formations, résumé).

---

## 5. Suite d’exercices structurants & IA

### 5.1 Motivation – Matrice des motivations

- **Objectif métier**
  - Identifier les principaux leviers de motivation intrinsèques du talent.
- **Fonctionnalités**
  - Comparaisons successives de paires de leviers.
  - Classement final des motivations par importance perçue.
  - Sauvegarde des décisions et des résultats.

### 5.2 Valeurs

- **Objectif métier**
  - Faire émerger les valeurs centrales qui guident le comportement du talent.
- **Fonctionnalités**
  - Sélection / tri des valeurs.
  - Restitution d’un top valeurs et de leur combinaison.

### 5.3 Personnalité / DISC (ou équivalent)

- **Objectif métier**
  - Proposer une lecture rapide du profil comportemental du talent.
- **Fonctionnalités**
  - Calcul d’un profil (ex. DISC).
  - Résumé du profil dominant (ex. “Profil dominant : DS”).

### 5.4 Courbe de vie

- **Objectif métier**
  - Visualiser les hauts et bas d’un parcours de vie / carrière.
- **Fonctionnalités**
  - Ajout de points sur une courbe (événements marquants).
  - Support narratif pour l’entretien (ce qui a été difficile, ce qui a porté le talent).

### 5.5 Ciblage & plan d’action

- **Objectif métier**
  - Construire une **liste priorisée de cibles** (entreprises, organismes) alignées avec le projet.
- **Fonctionnalités**
  - Ajout de cibles manuelles :
    - Nom de l’entité.
    - Type (Entreprise / Organisme de formation).
    - Commentaire.
  - **Suggestions IA (Gemini)** :
    - Propositions de structures pertinentes selon profil.
    - Ajout en un clic aux cibles retenues.
  - Génération d’un plan d’action structuré (liste validée, heure / durée de travail).

### 5.6 Cartographie des compétences (Skill Mapping)

- **Objectif métier**
  - Transformer un récit d’expérience brute en cartographie exploitable pour le marché.
- **Étapes**
  - **Récit** : le talent décrit une expérience clé (missions, contexte).
  - **Analyse IA** :
    - Extraction de missions, activités, preuves de résultats.
    - Mise en tableau (Mission, Activité, Preuve).
  - **Validation / enrichissement** :
    - Possibilité d’ajouter des lignes manuellement.
    - Ajustement du texte, ajout de précisions.
- **Sortie**
  - Table structurée, utilisable en entretien, CV, ou rapport bilans.

### 5.7 Cercle de contrôle

- **Objectif métier**
  - Clarifier sur quoi le talent a **contrôle direct**, **influence**, ou **aucun contrôle**.
- **Fonctionnalités**
  - Répartition d’éléments (problèmes / préoccupations) dans les trois cercles.
  - Support pour construire un plan d’action centré sur ce qui est maîtrisable.

### 5.8 Sauvegarde & reprise

- **Brouillons**
  - Sauvegarde automatique ou déclenchée de l’état d’un exercice.
  - Reprise d’un exercice là où il a été laissé.

---

## 6. Reporting & supervision (vue Direction / Super Admin)

### 6.1 Supervision globale

- **Indicateurs**
  - Nombre total d’organisations clientes.
  - Nombre total d’utilisateurs (par rôle).
  - Nombre d’instances FTC (si multi-instance).

### 6.2 Usage des exercices par organisation

- **Tableau de bord**
  - Pour chaque cabinet :
    - Total des exercices complétés.
    - Répartition par type (Motivation, Valeurs, DISC, etc.).
- **Filtres**
  - Période de temps (Du / Au).
  - Organisation spécifique ou toutes organisations.
- **Drill-down**
  - Clic sur une organisation → ajustement des filtres pour se concentrer sur elle.
- **Exports**
  - Export CSV des usages (id organisation, nom, type exercice, nombre).

---

## 7. Administration des organisations & utilisateurs

### 7.1 Organisations (cabinets)

- **Gestion**
  - Liste de toutes les organisations clientes.
  - Création d’une nouvelle organisation (nom, slug).
- **Impersonation**
  - Possibilité pour la direction / super admin de se connecter “en tant que” un administrateur de cabinet, pour l’accompagner ou diagnostiquer des problèmes.

### 7.2 Utilisateurs

- **Vue globale**
  - Liste des utilisateurs avec nom, email, rôle, organisation.
  - Recherche et filtrage par organisation / rôle.
- **Gestion des rôles**
  - Passage d’un utilisateur à un rôle supérieur (admin, super admin) ou différent.
  - Vérification des impacts sur les accès (visible vs non visible dans certains écrans).

---

## 8. Jobs de fond & industrialisation

### 8.1 Tâches asynchrones (Bulk Jobs)

- **Suivi**
  - Inventaire des traitements lourds :
    - Envois d’emails automatiques (invitations, relances).
    - Générations de PDFs en masse.
    - Autres tâches batch.
- **État**
  - Statuts lisibles pour l’utilisateur avancé :
    - En attente.
    - En cours.
    - Terminé.
    - Erreur (avec message explicatif si possible).
- **Temps réel**
  - Mise à jour via événements serveur (SSE / Transmit), sans rafraîchir manuellement la page.

---

## 9. Rafraîchissement & exports premium

### 9.1 Rapport PDF expert par talent

- **Contenu**
  - Page de couverture (identité du talent, date, branding cabinet).
  - Synthèse des diagnostics (motivations, valeurs, personnalité, compétences).
  - Page de “Systémie du Rebond” visualisant les dimensions clés (personnalité, besoins, contraintes, valeurs, compétences, etc.).
- **Usage**
  - Support de restitution au talent ou à un tiers (employeur, financeur).
  - Preuve de valeur du travail du cabinet.

### 9.2 Exports CSV

- **Exports natifs**
  - Export des usages d’exercices par organisation.
- **Extensions possibles**
  - Exports des listes de candidats, utilisateurs, ou autres, selon besoins clients.

---

## 10. Expérience utilisateur & feedback

### 10.1 Bannières flash

- **Messages métier**
  - Succès :
    - Création candidat.
    - Mise à jour des réglages.
    - Enregistrement d’un exercice.
  - Erreurs :
    - Email déjà pris.
    - Candidat déjà existant dans l’organisation.
    - Erreur serveur ponctuelle.

- **Comportement**
  - Apparition après action.
  - Possibilité de “fermer” / masquer la bannière.

### 10.2 Cohérence globale

- **Tonalité**
  - Langage clair, humain, orienté accompagnement et empowerment.
- **Accessibilité & confort**
  - Labels explicites, textes lisibles, mises en page respirantes.
  - Composants réutilisables (boutons, champs, cartes) pour réduire la charge cognitive.

---
