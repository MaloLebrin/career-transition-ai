import { test } from '@japa/runner'
import SkillsController from '#controllers/skills_controller'

/**
 * Unit — `SkillsController` est une coquille vide (aucune route ne la référence).
 * Ce test fige cet état : ajouter une action impose d'étendre ce spec.
 */
test.group('SkillsController', () => {
  test("s'instancie et n'expose aucune action", ({ assert }) => {
    const controller = new SkillsController()

    assert.instanceOf(controller, SkillsController)
    assert.deepEqual(Object.getOwnPropertyNames(SkillsController.prototype), ['constructor'])
  })
})
