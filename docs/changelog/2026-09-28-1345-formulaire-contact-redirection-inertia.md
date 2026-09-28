# 2026-09-28 — Formulaire de contact : redirection Inertia au lieu de JSON (#62)

`ContactDemoForm` soumet `POST /contact-requests` via `useForm` (Inertia), mais le
contrôleur répondait `response.created({ success, id })` : une réponse JSON qu'Inertia
ne sait pas traiter — le formulaire public (contact / demande de démo) échouait et
l'écran de confirmation ne s'affichait pas.

- **Correctif.** Le contrôleur flashe « Votre message a bien été envoyé. » et redirige
  vers la page d'origine (`response.redirect().back()`), conformément à la règle
  `inertia-no-fetch-json`.
- **Service.** La création de la demande (statut `pending`) et l'envoi des deux
  e-mails passent dans `ContactRequestsService` (`#services/contact_requests_service`) ;
  le contrôleur ne fait plus de requête Lucid. Type d'entrée partagé :
  `shared/types/contact_request/inputs.ts`.
- **Tests.** Functional : redirection + flash, erreurs de validation dans le sac
  d'erreurs Inertia ; unit : contrôleur (aucune réponse JSON) et service (statut,
  e-mails, échec d'envoi sans perte de la demande). Les tests de rate limiting
  attendent désormais une redirection.
