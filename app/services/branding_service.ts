import type { OrganizationDto } from '#dtos/organization_dto'
import Organization from '#models/organization'
import { CloudinaryFolders, CloudinaryService } from '#services/cloudinary_service'
import { reportError } from '#services/error_tracking_service'
import { mapOrganization } from '#shared/helpers/organization/mappers'
import type { CloudinaryAsset } from '#shared/types/storage/cloudinary'
import { inject } from '@adonisjs/core'
import type { MultipartFile } from '@adonisjs/core/bodyparser'
import logger from '@adonisjs/core/services/logger'
import { randomUUID } from 'node:crypto'

/** Logo : image publique (affichée par `<img>`), seule exception aux fichiers privés. */
function logoAsset(publicId: string): CloudinaryAsset {
  return { publicId, resourceType: 'image', deliveryType: 'upload' }
}

/**
 * Logo d'organisation sur Cloudinary (issue #51).
 *
 * Chaque upload reçoit un `public_id` neuf (`…/organizations/<id>/logo/logo_<uuid>`) :
 * pas de cache CDN périmé, et l'ancien fichier n'est détruit qu'une fois le
 * nouveau enregistré. Si l'enregistrement échoue, le nouvel upload est détruit
 * (aucun fichier orphelin).
 */
@inject()
export class BrandingService {
  constructor(private cloudinary: CloudinaryService) {}

  async uploadLogo(organizationId: number, file: MultipartFile): Promise<OrganizationDto> {
    const org = await Organization.findOrFail(organizationId)
    const previousPublicId = org.logoPublicId

    const uploaded = await this.cloudinary.uploadFile(
      file.tmpPath!,
      logoAsset(`${CloudinaryFolders.logo(org.id)}/logo_${randomUUID()}`)
    )

    org.merge({ logoUrl: uploaded.secureUrl, logoPublicId: uploaded.publicId })
    try {
      await org.save()
    } catch (error) {
      await this.destroyQuietly(uploaded.publicId, org.id)
      throw error
    }

    if (previousPublicId) await this.destroyQuietly(previousPublicId, org.id)
    return mapOrganization(org)
  }

  async deleteLogo(organizationId: number): Promise<OrganizationDto> {
    const org = await Organization.findOrFail(organizationId)
    const publicId = org.logoPublicId

    org.merge({ logoUrl: null, logoPublicId: null })
    await org.save()

    if (publicId) await this.destroyQuietly(publicId, org.id)
    return mapOrganization(org)
  }

  /**
   * Nettoyage best effort : un échec laisse un fichier orphelin (signalé), mais
   * ne doit pas annuler une action déjà enregistrée.
   */
  private async destroyQuietly(publicId: string, organizationId: number) {
    try {
      await this.cloudinary.destroy(logoAsset(publicId))
    } catch (error) {
      logger.warn({ organizationId }, 'logo : suppression Cloudinary impossible')
      reportError(error, { tags: { feature: 'organization_logo' }, extra: { organizationId } })
    }
  }
}
