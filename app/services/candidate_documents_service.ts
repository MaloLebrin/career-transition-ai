import {
  MediaForbiddenError,
  MediaLimitReachedError,
  MediaNotFoundError,
} from '#exceptions/media_errors'
import Employee from '#models/employee'
import type Media from '#models/media'
import type User from '#models/user'
import { reportError } from '#services/error_tracking_service'
import { MediaService } from '#services/media_service'
import {
  MAX_CANDIDATE_DOCUMENTS,
  MEDIA_ENTITY_TYPES,
  MEDIA_KINDS,
  type MediaKind,
} from '#shared/constants/media'
import { USERS_ROLES } from '#shared/types/advisor/roles'
import type {
  CandidateDocumentDto,
  IncomingMediaFile,
  MediaOwner,
} from '#shared/types/media/documents'
import { inject } from '@adonisjs/core'
import logger from '@adonisjs/core/services/logger'
import type { Readable } from 'node:stream'

export const CANDIDATE_DOCUMENTS_URL = '/dashboard/candidat/documents'

export function advisorDocumentsUrl(employeeId: number): string {
  return `/dashboard/conseiller/employees/${employeeId}/documents`
}

/** Propriétaire `media` d'une fiche candidat. */
export function employeeMediaOwner(employee: Employee): MediaOwner {
  return {
    entityType: MEDIA_ENTITY_TYPES.EMPLOYEE,
    entityId: employee.id,
    organizationId: employee.organizationId,
  }
}

function isCandidate(user: User): boolean {
  return user.role === USERS_ROLES.EMPLOYEE
}

/**
 * Documents d'un candidat (issue #50), déposés par lui ou par son conseiller.
 *
 * L'accès par rôle est porté par les routes (`candidate` / `advisorOrAdmin`) ;
 * ici on résout la fiche : la sienne pour un candidat, celle de son
 * organisation pour un conseiller (autre organisation → 404).
 */
@inject()
export class CandidateDocumentsService {
  constructor(private media: MediaService) {}

  /** Fiche du candidat connecté, ou fiche `employeeId` de l'organisation du conseiller. */
  async employeeFor(user: User, employeeId?: number): Promise<Employee> {
    if (employeeId !== undefined && !Number.isSafeInteger(employeeId)) {
      throw new MediaNotFoundError('Candidat introuvable.')
    }
    const query = Employee.query().where('organizationId', user.organizationId)
    if (employeeId === undefined) query.where('userId', user.id)
    else query.where('id', employeeId)
    return query.firstOrFail()
  }

  async list(employee: Employee, viewer: User): Promise<CandidateDocumentDto[]> {
    const documents = await this.media.list(employeeMediaOwner(employee))
    return documents.map((document) => this.toDto(document, viewer))
  }

  async upload(
    employee: Employee,
    uploader: User,
    file: IncomingMediaFile,
    kind: MediaKind
  ): Promise<Media> {
    if ((await this.media.count(employeeMediaOwner(employee))) >= MAX_CANDIDATE_DOCUMENTS) {
      throw new MediaLimitReachedError(MAX_CANDIDATE_DOCUMENTS)
    }
    return this.media.upload({
      ...employeeMediaOwner(employee),
      kind,
      file,
      uploadedById: uploader.id,
    })
  }

  async download(
    employee: Employee,
    mediaId: number
  ): Promise<{ stream: Readable; contentType: string; filename: string }> {
    const document = await this.media.get(employeeMediaOwner(employee), mediaId)
    const { stream, contentType } = await this.media.download(document)
    return { stream, contentType, filename: document.originalFilename }
  }

  async delete(employee: Employee, viewer: User, mediaId: number): Promise<void> {
    const document = await this.media.get(employeeMediaOwner(employee), mediaId)
    if (!this.canDelete(document, viewer)) throw new MediaForbiddenError()
    await this.media.delete(document)
  }

  /**
   * CV envoyé à l'import IA : conservé comme document `cv` du candidat connecté.
   * `null` si l'utilisateur n'a pas de fiche candidat (conseiller), si la limite
   * est atteinte ou si le stockage échoue (signalé à Sentry) : l'import
   * lui-même n'en dépend jamais.
   */
  async storeImportedCv(user: User, file: IncomingMediaFile): Promise<Media | null> {
    try {
      return await this.storeCv(user, file)
    } catch (error) {
      logger.warn({ userId: user.id }, 'import de CV : conservation du fichier impossible')
      reportError(error, { userId: user.id, tags: { feature: 'imported_cv' } })
      return null
    }
  }

  private async storeCv(user: User, file: IncomingMediaFile): Promise<Media | null> {
    if (!isCandidate(user)) return null
    const employee = await Employee.query()
      .where('organizationId', user.organizationId)
      .where('userId', user.id)
      .first()
    if (!employee) return null
    if ((await this.media.count(employeeMediaOwner(employee))) >= MAX_CANDIDATE_DOCUMENTS)
      return null
    return this.media.upload({
      ...employeeMediaOwner(employee),
      kind: MEDIA_KINDS.CV,
      file,
      uploadedById: user.id,
    })
  }

  private canDelete(document: Media, viewer: User): boolean {
    return !isCandidate(viewer) || document.uploadedById === viewer.id
  }

  private toDto(document: Media, viewer: User): CandidateDocumentDto {
    return {
      id: document.id,
      kind: document.kind,
      originalFilename: document.originalFilename,
      format: document.format,
      bytes: document.bytes,
      createdAt: document.createdAt.toISO()!,
      uploadedByName: document.uploadedBy?.name ?? null,
      canDelete: this.canDelete(document, viewer),
    }
  }
}
