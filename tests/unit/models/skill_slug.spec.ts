import Skill from '#models/skill'
import { test } from '@japa/runner'

test.group('Skill slug hook', () => {
  test('generates slug from name when creating', async ({ assert }) => {
    const skill = await Skill.create({ name: 'Prospection commerciale', organizationId: null })

    // Il peut déjà exister un slug identique via un seeder, on vérifie le préfixe.
    assert.isTrue(skill.slug!.startsWith('prospection-commerciale'))
  })

  test('ensures slug uniqueness by suffixing', async ({ assert }) => {
    const first = await Skill.create({ name: 'Prospection', organizationId: null })
    const second = await Skill.create({ name: 'Prospection', organizationId: null })

    // Le premier peut déjà être suffixé si un enregistrement existe
    // dans la base (seed, autre test, etc.).
    assert.isTrue(first.slug!.startsWith('prospection'))
    assert.notEqual(second.slug, first.slug)
    assert.isTrue(second.slug!.startsWith('prospection-'))
  })

  test('does not override explicit slug', async ({ assert }) => {
    // On choisit un slug peu probable pour éviter un conflit avec les seeders
    const explicitSlug = 'custom-skill-' + Date.now().toString(36)

    const skill = await Skill.create({
      name: 'Custom Skill',
      slug: explicitSlug,
      organizationId: null,
    })

    assert.equal(skill.slug, explicitSlug)
  })

  test('keeps slug null when base is empty', async ({ assert }) => {
    const skill = await Skill.create({
      // generateSlug renverra '' → on garde slug à null
      name: '   ??? ***   ',
      organizationId: null,
    })

    assert.isNull(skill.slug)
  })
})
