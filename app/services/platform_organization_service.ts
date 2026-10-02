import { PlatformOrganizationMissingError } from '#exceptions/platform_errors'
import Organization from '#models/organization'

/**
 * Organisation plateforme (#92) : le cabinet interne qui porte les super
 * admins, les experts maison et les candidats B2C.
 *
 * Elle est identifiée par `organizations.is_platform` (unique) — plus jamais
 * par le `organizationId` du super admin connecté, qui n'en est qu'un membre.
 */
export class PlatformOrganizationService {
  public async get(): Promise<Organization> {
    const organization = await Organization.query().where('isPlatform', true).first()
    if (!organization) {
      throw new PlatformOrganizationMissingError()
    }
    return organization
  }

  public async getId(): Promise<number> {
    const organization = await this.get()
    return organization.id
  }
}
