/** Changement de mot de passe d'un utilisateur connecté (payload de `changePasswordValidator`). */
export interface ChangePasswordInput {
  currentPassword: string
  password: string
}
