import vine from '@vinejs/vine'

/**
 * `id` : identifiant de la ligne pivot `employee_skills` à modifier. Son
 * appartenance au candidat connecté est vérifiée par le service (404 sinon) :
 * pas de règle `exists` ici, qui distinguerait « inexistant » de « pas à vous ».
 */
export const updateEmployeeSkillValidator = vine.create(
  vine.object({
    id: vine.number().withoutDecimals().positive(),
    level: vine.number().in([1, 2, 3, 4, 5]),
  })
)
