import type { ContactRequestStatus, ContactRequestType } from '#shared/constants/contact_request'
import type { UserRole } from '#shared/types/advisor/roles'
import type { ListParams } from '#shared/types/pagination'

/** Paramètres de la boîte des demandes de contact (`?page=&search=&status=&type=`). */
export interface ContactRequestListParams extends ListParams {
  /** Statut filtré ; `null` = tous. */
  status: ContactRequestStatus | null
  /** Type filtré ; `null` = tous. */
  type: ContactRequestType | null
}

/** Compte existant qui porte l'adresse e-mail d'une demande. */
export interface ContactRequestSenderAccount {
  id: number
  name: string
  role: UserRole
  disabled: boolean
  /** Faux pour soi-même, un super admin ou l'équipe plateforme. */
  canDisable: boolean
}

/** État de l'expéditeur d'une demande : adresse bloquée, compte rapproché. */
export interface ContactRequestSenderState {
  /** L'adresse est bloquée pour le formulaire public. */
  senderBlocked: boolean
  account: ContactRequestSenderAccount | null
}

/** Une demande de contact vue du back-office. */
export interface ContactRequestItem extends ContactRequestSenderState {
  id: number
  name: string
  email: string
  phone: string | null
  organization: string | null
  message: string
  type: ContactRequestType
  status: ContactRequestStatus
  createdAt: string
}
