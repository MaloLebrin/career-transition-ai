# Experts B2C : atomicité des demandes et cloisonnement de l'équipe plateforme

Correctifs de la revue PR #109 (lot 3).

- Demandes d'accompagnement : refus (409, `E_EXPERT_ALREADY_ASSIGNED`) si le candidat a déjà un conseiller ou un expert ; à l'assignation d'un candidat déjà suivi, la demande est clôturée (`closed`). `assign` / `decline` sont atomiques (transaction + `FOR UPDATE`), `assign` ignore les fiches supprimées et revérifie l'éligibilité de l'expert. `listForAdmin` n'a plus de N+1 (`EntitlementsService.employeeIdsWithResultsAccess`).
- Migration 08 : `PREVIOUS_TYPES` du `down()` inclut `expert_request_created`.
- Cloisonnement : dans l'organisation plateforme, un conseiller ou un expert n'accède qu'aux candidats B2C dont il est `advisor_id` (404 sinon) — `teamEmployeeScope` (`#services/team_employee_scope_service`) appliqué aux contrôleurs employés, résultats d'exercices, synthèses, parcours et accueil conseiller.
