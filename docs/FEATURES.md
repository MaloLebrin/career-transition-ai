# Cartographie fonctionnelle – Transition Carrière

## 1. Acquisition & image de marque

### 1.1 Landing publique

- **Promesse produit**
  - “L’IA qui structure le potentiel humain / travail”.
  - Positionnement premium : mélange sciences comportementales + IA (Mistral).

- **Sections pédagogiques**
  - **Méthodologie** : explication du cadre de travail, étapes d’accompagnement, logique de diagnostic.
  - **Intelligence Artificielle** : rôle de l’IA dans la structuration des récits, la génération de synthèses et les suggestions de cibles.
  - **Bénéfices** pour les cabinets (industrialisation, qualité de restitution) et pour les talents (clarté, prise de décision).

- **Parcours d’entrée**
  - Call-to-actions :
    - “Lancer le Portail” (accès au parcours d’authentification).
    - “Accès Expert” (usage par les cabinets).
  - Cohérence graphique (logo, couleurs, typographies, animations) entre la landing, l’auth et le portail.

- **Acquisition B2C (épic #90, #99)**
  - Page `/particuliers` : promesse en autonomie, Motivations et Valeurs offerts, forfait
    unique TTC (prix de la prop partagée `billing`), accompagnement par un expert sur demande,
    CTA vers `/inscription` quand `B2C_REGISTRATION_ENABLED` est vrai, formulaire de contact
    « être prévenu » sinon.
  - `/tarifs` : bloc « Vous êtes un particulier ? » (prix TTC, inclus / non inclus), le libellé
    HT étant réservé aux offres cabinets. Lien « Particuliers » dans l’en-tête et le pied de
    page, lien secondaire sur la landing. `noindex` conservé par défaut (`SEO_INDEXING`).

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
  - **Réglages** : configuration du cabinet, des membres, logo du cabinet (upload, remplacement, suppression ; image publique sur Cloudinary).
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

- **Documents** (profil candidat et fiche conseiller)
  - Dépôt par le candidat ou son conseiller : CV, lettre de motivation, certificat, diplôme, autre (PDF, Word, image ; 10 Mo, 30 documents max).
  - Téléchargement relayé par le serveur (fichiers privés sur Cloudinary), suppression (le candidat ne supprime que ses propres dépôts).
  - Le CV envoyé à l'import IA est conservé automatiquement comme document « CV ».

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
  - **Suggestions IA (Mistral)** :
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
  - Nombre d’instances (si multi-instance).

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

### 7.3 Demandes d'accompagnement et équipe interne (#105)

- **Demandes d'accompagnement** (`/dashboard/super-admin/expert-requests`) : les demandes des
  particuliers (#103) avec candidat, forfait réglé ou non, message, disponibilités, statut ;
  filtre par statut. Assignation d'un membre de l'équipe interne (`employees.advisor_id`
  posé, demande acceptée, candidat et expert notifiés) ou refus motivé (candidat notifié,
  nouvelle demande possible).
- **Équipe interne** (`/dashboard/super-admin/team`) : membres de l'organisation plateforme
  (rôles `advisor`, `expert`, `admin`) avec le nombre de particuliers suivis ; invitation par
  e-mail (même activation que les cabinets). L'expert interne retrouve ses particuliers dans
  `/dashboard/conseiller` et peut créer étapes et notes.

---

## 8. Jobs de fond & industrialisation

### 8.1 Tâches asynchrones (exports PDF)

- **Suivi**
  - Génération de PDFs de synthèse partageable (conseiller ou candidat), exécutée en queue.
- **État**
  - Statuts lisibles pour l’utilisateur avancé :
    - En attente.
    - En cours.
    - Terminé.
    - Erreur (avec message explicatif si possible).
- **Temps réel**
  - Mise à jour via événements serveur (SSE / Transmit), sans rafraîchir manuellement la page.
- **Accès**
  - Les exports sont visibles depuis l’espace conseiller via **“Tâches”** (`/dashboard/conseiller/pdf-exports`).
  - Un badge dans le menu indique le nombre d’exports PDF **en cours** (pending/processing).

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
- **Génération asynchrone**
  - Le PDF est généré en **tâche de fond** (queue) ; le suivi passe par la table **`pdf_exports`**.
  - Le PDF est **téléchargeable** une fois l’export terminé :
    - depuis la page **Synthèse** du candidat,
    - et depuis la page **Exports PDF** (menu « Tâches » / super admin).
- **Partage & confidentialité**
  - Le PDF “partageable” est construit à partir des données partageables (commentaires partagés, synthèse), **sans inclure les notes internes expert**.

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

## 11. Parcours particulier (B2C, épic #90) — en cours

### 11.1 Inscription et compte

- Inscription publique sur `/inscription` (flag `B2C_REGISTRATION_ENABLED`, #93), compte
  rattaché à l'organisation plateforme, fiche `account_type = 'b2c'` sans conseiller.
- Vérification de l'adresse e-mail par lien (#98) : bandeau de rappel sur l'accueil,
  prérequis au paiement seulement.

### 11.2 Exercices gratuits et forfait (#100)

- **Motivations** et **Valeurs** sont gratuits et affichés en premier ; leurs résultats
  et leur analyse IA (une seule fois par exercice) sont visibles sans paiement.
- Les autres exercices sont présentés verrouillés (« Inclus dans le forfait ») avec un
  CTA « Débloquer » vers l'offre quand le paiement est activé (`STRIPE_ENABLED`, #102),
  « Bientôt disponible » sinon. Le verrou est appliqué côté serveur (page bloquée,
  brouillon et résultat refusés), le front n'affiche que l'état.
- Accueil dédié (`B2cEmployeeHome`) : progression, catalogue, bloc « Votre expert : X »
  quand un expert interne est assigné (#105), conseils de l'expert s'il en a laissé ;
  pas de feuille de route (aucun plan d'accompagnement).
- Notification « Votre analyse IA est disponible » adressée directement au particulier.
- Verrouillage **côté serveur** (#101) : réponses, scores et analyses des exercices du
  forfait n'apparaissent dans aucune prop Inertia (accueil, exercice, profil, étape)
  tant que le forfait n'est pas réglé ; synthèse, export PDF, téléchargement et IA
  assistée (cartographie, ciblage) sont refusés de même. Carte « réservé au forfait »
  avec le prix TTC.

### 11.3 Paiement du forfait (#102)

- Page `/dashboard/candidat/offre` : rappel du forfait, prix TTC, cases CGV et
  renonciation au droit de rétractation (art. L221-28 13°), bouton « Payer » → Stripe
  Checkout hébergé (one-shot, facture Stripe). Retour sur `/billing/success` avec
  réconciliation immédiate ; `/billing/cancel` ramène à l'offre.
- Prérequis : particulier (`b2c`), e-mail vérifié, pas déjà payé, `STRIPE_ENABLED`.

### 11.4 Accompagnement par un expert (#103)

- Page `/dashboard/candidat/accompagnement` : un particulier au forfait réglé dépose une
  demande (message libre, disponibilités) ; une seule demande en attente à la fois ; statut
  (en attente, acceptée, refusée, clôturée) et expert assigné affichés. Les super admins sont
  notifiés (« Demande d'accompagnement — candidat #id », lien vers le back-office #105).
- CTA sur l'accueil B2C (payé, sans expert) et la synthèse. Candidat B2B : page lisible mais
  l'accompagnement passe par son conseiller (403 au dépôt) ; non payé : carte « réservé au
  forfait » (403 au dépôt). Tarif et contrat de l'accompagnement hors plateforme pour l'instant.
- Traitement par les super admins (#105, § 7.3) : assignation d'un expert interne → « Votre
  expert : X » sur l'accueil et la page d'accompagnement, notification ; refus motivé →
  notification, nouvelle demande possible.

### 11.5 À venir

Webhook Stripe (#104), back-office B2C : paiements, octroi et révocation manuels (#107).
