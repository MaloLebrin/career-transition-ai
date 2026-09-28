import { CandidateDocumentsService } from '#services/candidate_documents_service'
import { attachmentDisposition } from '#services/pdf_storage_service'
import { uploadCandidateDocumentValidator } from '#validators/media/candidate_document_validator'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

/**
 * Documents d'un candidat (issue #50). Mêmes actions pour le candidat
 * (`/dashboard/candidat/documents`, sa fiche) et pour le conseiller
 * (`/dashboard/conseiller/employees/:id/documents`) : la présence de `:id`
 * désigne la fiche, l'accès par rôle est porté par les routes.
 */
@inject()
export default class CandidateDocumentsController {
  constructor(private documents: CandidateDocumentsService) {}

  async store({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const employee = await this.documents.employeeFor(user, employeeIdOf(params))
    const { document, kind } = await request.validateUsing(uploadCandidateDocumentValidator)
    await this.documents.upload(employee, user, document, kind)
    session.flash('success', 'Document ajouté.')
    return response.redirect().back()
  }

  async download({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const employee = await this.documents.employeeFor(user, employeeIdOf(params))
    const file = await this.documents.download(employee, Number(params.mediaId))
    response.header('Content-Type', file.contentType)
    response.header('Content-Disposition', attachmentDisposition(file.filename))
    return response.stream(file.stream)
  }

  async destroy({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const employee = await this.documents.employeeFor(user, employeeIdOf(params))
    await this.documents.delete(employee, user, Number(params.mediaId))
    session.flash('success', 'Document supprimé.')
    return response.redirect().back()
  }
}

function employeeIdOf(params: Record<string, string>): number | undefined {
  return params.id === undefined ? undefined : Number(params.id)
}
