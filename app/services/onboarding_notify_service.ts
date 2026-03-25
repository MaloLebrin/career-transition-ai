import type OnboardingToken from '#models/onboarding_token'
import type User from '#models/user'
import { MailService } from '#services/mail/mail_service'
import { OnboardingMailService } from '#services/onboarding_mail_service'

/**
 * Sends the onboarding email with the set-password link.
 * Legacy wrapper kept for backward compatibility.
 * Prefer using `OnboardingMailService` via DI.
 */
export async function sendOnboardingEmail(
  user: User,
  token: OnboardingToken,
  baseUrl: string
): Promise<void> {
  const mail = new MailService()
  const service = new OnboardingMailService(mail)
  await service.sendSetPasswordLink({ user, token, baseUrl })
}
