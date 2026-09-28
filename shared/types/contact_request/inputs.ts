import type { ContactRequestType } from '#models/contact_request'

/** Données d'une demande de contact / démo (payload de `createContactRequestValidator`). */
export interface CreateContactRequestInput {
  name: string
  email: string
  phone?: string | null
  organization?: string | null
  message: string
  type: ContactRequestType
}
