import { CV_IMPORT_EXTENSIONS, CV_IMPORT_MAX_SIZE } from '#shared/constants/ai_assist'
import vine from '@vinejs/vine'

export const extractCvValidator = vine.create({
  cv: vine.file({ size: CV_IMPORT_MAX_SIZE, extnames: [...CV_IMPORT_EXTENSIONS] }),
})

export const extractSkillMappingValidator = vine.create({
  text: vine.string().trim().minLength(1).maxLength(20_000),
})

export const suggestTargetsValidator = vine.create({
  targetRole: vine.string().trim().maxLength(255),
  skills: vine.array(vine.string().trim().maxLength(255)).maxLength(100),
})
