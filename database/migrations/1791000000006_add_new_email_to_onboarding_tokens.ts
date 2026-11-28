import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Changement d'e-mail confirmé par lien (#143) : un jeton qui porte
 * `new_email` a été envoyé à cette adresse, et la confirme en remplaçant
 * celle du compte au clic. Il ne sert jamais à définir un mot de passe
 * (`/onboarding/:token`) : la personne qui reçoit le lien n'est pas forcément
 * le titulaire du compte.
 */
export default class extends BaseSchema {
  protected tableName = 'onboarding_tokens'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('new_email', 255).nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('new_email')
    })
  }
}
