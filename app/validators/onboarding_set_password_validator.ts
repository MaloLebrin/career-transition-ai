import vine from '@vinejs/vine'

export const onboardingSetPasswordValidator = vine.create(
  vine.object({
    password: vine.string().trim().minLength(8).maxLength(255),
    password_confirmation: vine.string().trim().sameAs('password'),
  })
)
