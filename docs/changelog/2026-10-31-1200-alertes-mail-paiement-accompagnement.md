# Alertes e-mail : forfait payé et demande d'accompagnement

- Nouveau `TeamAlertMailService` (`app/services/mail/`) : un e-mail à l'équipe quand un
  particulier règle son forfait (`PaymentsService.markPaid`, une seule fois par paiement,
  octroi manuel exclu) et un autre, vers une adresse distincte, quand il demande un expert
  (`ExpertRequestsService.createForUser`).
- Adresses : `PAYMENT_ALERT_EMAIL` et `EXPERT_REQUEST_ALERT_EMAIL` (optionnelles, aucun envoi
  si vides). Id du candidat seulement, jamais son nom ni son e-mail (RGPD).
- Envoi au mieux : un échec est signalé (`reportError`) sans bloquer le déblocage du droit ni
  la création de la demande.
- Tests : `team_alert_mail_service.spec.ts`, `payments_service.spec.ts`, `expert_requests_service.spec.ts`.
