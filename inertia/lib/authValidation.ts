/**
 * Validation côté client alignée avec les validateurs serveur (auth_login_validator, auth_register_validator).
 */

const EMAIL_MAX = 255
const PASSWORD_MIN = 6
const PASSWORD_MAX = 255
const NAME_MAX = 255

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type LoginFields = { email: string; password: string }
export type RegisterFields = {
  email: string
  password: string
  name: string
  organizationName: string
  role: 'advisor'
}

export type LoginErrors = Partial<Record<keyof LoginFields, string>>
export type RegisterErrors = Partial<Record<keyof RegisterFields, string>>

function trim(s: string): string {
  return s.trim()
}

export function validateLogin(data: LoginFields): LoginErrors {
  const errors: LoginErrors = {}
  const email = trim(data.email)
  const password = trim(data.password)

  if (!email) {
    errors.email = 'L’email est requis.'
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = 'L’email n’est pas valide.'
  } else if (email.length > EMAIL_MAX) {
    errors.email = `L’email ne doit pas dépasser ${EMAIL_MAX} caractères.`
  }

  if (!password) {
    errors.password = 'Le mot de passe est requis.'
  } else if (password.length < PASSWORD_MIN) {
    errors.password = `Le mot de passe doit contenir au moins ${PASSWORD_MIN} caractères.`
  } else if (password.length > PASSWORD_MAX) {
    errors.password = `Le mot de passe ne doit pas dépasser ${PASSWORD_MAX} caractères.`
  }

  return errors
}

export function validateRegister(data: RegisterFields): RegisterErrors {
  const errors: RegisterErrors = {}
  const email = trim(data.email)
  const password = trim(data.password)
  const name = trim(data.name)
  const organizationName = trim(data.organizationName)

  if (!name) {
    errors.name = 'Le nom est requis.'
  } else if (name.length > NAME_MAX) {
    errors.name = `Le nom ne doit pas dépasser ${NAME_MAX} caractères.`
  }

  if (!organizationName) {
    errors.organizationName = 'Le nom de l’organisation est requis.'
  } else if (organizationName.length > NAME_MAX) {
    errors.organizationName = `Le nom de l’organisation ne doit pas dépasser ${NAME_MAX} caractères.`
  }

  if (!email) {
    errors.email = 'L’email est requis.'
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = 'L’email n’est pas valide.'
  } else if (email.length > EMAIL_MAX) {
    errors.email = `L’email ne doit pas dépasser ${EMAIL_MAX} caractères.`
  }

  if (!password) {
    errors.password = 'Le mot de passe est requis.'
  } else if (password.length < PASSWORD_MIN) {
    errors.password = `Le mot de passe doit contenir au moins ${PASSWORD_MIN} caractères.`
  } else if (password.length > PASSWORD_MAX) {
    errors.password = `Le mot de passe ne doit pas dépasser ${PASSWORD_MAX} caractères.`
  }

  return errors
}

export function hasErrors(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).some((e) => e != null && e !== '')
}
