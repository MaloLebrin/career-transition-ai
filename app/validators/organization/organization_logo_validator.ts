import {
  ORGANIZATION_LOGO_EXTENSIONS,
  ORGANIZATION_LOGO_MAX_SIZE,
} from '#shared/constants/organisation'
import vine from '@vinejs/vine'

export const uploadOrganizationLogoValidator = vine.create({
  logo: vine.file({
    size: ORGANIZATION_LOGO_MAX_SIZE,
    extnames: [...ORGANIZATION_LOGO_EXTENSIONS],
  }),
})
