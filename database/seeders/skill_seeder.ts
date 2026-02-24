import Organization from '#models/organization'
import Skill from '#models/skill'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class SkillSeeder extends BaseSeeder {
  async run() {
    const globalSkills = [
      {
        name: 'Management de projet',
        slug: 'management-de-projet',
        category: 'Management',
        organizationId: null,
      },
      { name: 'Agile', slug: 'agile', category: 'Méthodes', organizationId: null },
      { name: 'Scrum', slug: 'scrum', category: 'Méthodes', organizationId: null },
      { name: 'Vente B2B', slug: 'vente-b2b', category: 'Commercial', organizationId: null },
      { name: 'Vente B2C', slug: 'vente-b2c', category: 'Commercial', organizationId: null },
      { name: 'Négociation', slug: 'negociation', category: 'Commercial', organizationId: null },
      { name: 'Prospection', slug: 'prospection', category: 'Commercial', organizationId: null },
      { name: 'Pédagogie', slug: 'pedagogie', category: 'Formation', organizationId: null },
      {
        name: 'Prise de parole',
        slug: 'prise-de-parole',
        category: 'Communication',
        organizationId: null,
      },
      {
        name: 'Communication',
        slug: 'communication',
        category: 'Soft skills',
        organizationId: null,
      },
      {
        name: 'Animation de réunion',
        slug: 'animation-reunion',
        category: 'Soft skills',
        organizationId: null,
      },
      {
        name: 'Travail en équipe',
        slug: 'travail-equipe',
        category: 'Soft skills',
        organizationId: null,
      },
      { name: 'Leadership', slug: 'leadership', category: 'Management', organizationId: null },
      {
        name: "Gestion d'équipe",
        slug: 'gestion-equipe',
        category: 'Management',
        organizationId: null,
      },
      {
        name: 'Conduite du changement',
        slug: 'conduite-changement',
        category: 'Management',
        organizationId: null,
      },
      { name: 'Stratégie', slug: 'strategie', category: 'Management', organizationId: null },
      { name: 'Budget', slug: 'budget', category: 'Management', organizationId: null },
      { name: 'Reporting', slug: 'reporting', category: 'Management', organizationId: null },
      { name: 'Excel', slug: 'excel', category: 'Outils', organizationId: null },
      { name: 'CRM', slug: 'crm', category: 'Outils', organizationId: null },
      { name: 'RSE', slug: 'rse', category: 'Secteur', organizationId: null },
      {
        name: 'Développement durable',
        slug: 'developpement-durable',
        category: 'Secteur',
        organizationId: null,
      },
      {
        name: 'Analyse de données',
        slug: 'analyse-donnees',
        category: 'Technique',
        organizationId: null,
      },
      { name: 'Rédaction', slug: 'redaction', category: 'Communication', organizationId: null },
    ]

    const ftcParis = await Organization.findByOrFail('slug', 'ftc-paris')
    const ftcLyon = await Organization.findByOrFail('slug', 'ftc-lyon')

    const skillsParis = [
      {
        name: 'Accompagnement carrière',
        slug: 'accompagnement-carriere',
        category: 'Spécifique FTC Paris',
        organizationId: ftcParis.id,
      },
      {
        name: 'Bilan de compétences',
        slug: 'bilan-competences',
        category: 'Spécifique FTC Paris',
        organizationId: ftcParis.id,
      },
      { name: 'VAE', slug: 'vae', category: 'Spécifique FTC Paris', organizationId: ftcParis.id },
    ]

    const skillsLyon = [
      {
        name: 'Transition professionnelle',
        slug: 'transition-pro-lyon',
        category: 'Spécifique FTC Lyon',
        organizationId: ftcLyon.id,
      },
      {
        name: 'Reconversion',
        slug: 'reconversion-lyon',
        category: 'Spécifique FTC Lyon',
        organizationId: ftcLyon.id,
      },
    ]

    for (const row of [...globalSkills, ...skillsParis, ...skillsLyon]) {
      await Skill.updateOrCreate({ name: row.name, organizationId: row.organizationId }, row)
    }
  }
}
