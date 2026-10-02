import { CandidateNotificationsService } from '#services/candidate_notifications_service'
import { EntitlementsService } from '#services/entitlements_service'
import { NotificationService } from '#services/notification_service'

/** Dépendance réelle de `EntitlementsService`, pour construire des doubles (`extends EntitlementsService`). */
export function testNotifications(): CandidateNotificationsService {
  return new CandidateNotificationsService(new NotificationService())
}

/** `EntitlementsService` câblé comme le conteneur, pour les tests unitaires. */
export function makeEntitlements(): EntitlementsService {
  return new EntitlementsService(testNotifications())
}
