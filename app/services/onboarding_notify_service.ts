import type User from '#models/user'
import type OnboardingToken from '#models/onboarding_token'

/**
 * Sends the onboarding email with the set-password link.
 * Default implementation logs the link (e.g. in dev). Replace with @adonisjs/mail for production.
 */
export async function sendOnboardingEmail(
  user: User,
  token: OnboardingToken,
  baseUrl: string
): Promise<void> {
  const link = `${baseUrl}/onboarding/${token.token}`
  // eslint-disable-next-line no-console
  console.info('[Onboarding] Invitation link for %s: %s', user.email, link)
  // TODO: use Mail.send(new OnboardingMail(user, link))
}
