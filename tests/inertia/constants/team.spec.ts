import { describe, expect, test } from 'vitest'
import {
  TEAM_CONTENT_IS_PLACEHOLDER,
  TEAM_MEMBERS,
  TEAM_PLACEHOLDER_NOTICE,
  TESTIMONIALS,
} from '#shared/constants/team'

describe('shared/constants/team (source de /qui-sommes-nous)', () => {
  describe('contenu honnête (DESIGN.md §1)', () => {
    test('le drapeau reste levé tant que les profils et avis sont des illustrations', () => {
      expect(TEAM_CONTENT_IS_PLACEHOLDER).toBe(true)
      expect(TEAM_PLACEHOLDER_NOTICE).toMatch(/illustration/)
      expect(TEAM_PLACEHOLDER_NOTICE).toMatch(/accord de leurs auteurs/)
    })

    test('aucun chiffre inventé dans les biographies, diplômes et témoignages', () => {
      for (const member of TEAM_MEMBERS) {
        expect(member.bio, member.id).not.toMatch(/\d/)
        expect(member.credentials, member.id).not.toMatch(/\d/)
      }
      for (const testimonial of TESTIMONIALS) {
        expect(testimonial.quote, testimonial.id).not.toMatch(/\d/)
      }
    })

    test('aucune note chiffrée sur les avis', () => {
      for (const testimonial of TESTIMONIALS) {
        expect(testimonial).not.toHaveProperty('rating')
      }
    })
  })

  describe('équipe', () => {
    test('deux psychologues du travail, identifiants uniques', () => {
      expect(TEAM_MEMBERS).toHaveLength(2)
      expect(new Set(TEAM_MEMBERS.map((m) => m.id)).size).toBe(TEAM_MEMBERS.length)
      for (const member of TEAM_MEMBERS) {
        expect(member.title, member.id).toMatch(/psychologue du travail/i)
        expect(member.credentials, member.id).toMatch(/titre protégé/)
      }
    })

    test('chaque membre a un prénom, un nom, une biographie et des spécialités', () => {
      for (const member of TEAM_MEMBERS) {
        expect(member.firstName.trim(), member.id).not.toBe('')
        expect(member.lastName.trim(), member.id).not.toBe('')
        expect(member.bio.length, member.id).toBeGreaterThan(80)
        expect(member.specialties.length, member.id).toBeGreaterThanOrEqual(2)
        expect(member.specialties.length, member.id).toBeLessThanOrEqual(4)
        for (const specialty of member.specialties) {
          // Casse de phrase : première lettre en capitale, jamais tout en majuscules.
          expect(specialty, member.id).toMatch(/^\p{Lu}/u)
          expect(specialty, member.id).not.toBe(specialty.toUpperCase())
        }
      }
    })
  })

  describe('avis', () => {
    test('trois témoignages, identifiants uniques', () => {
      expect(TESTIMONIALS).toHaveLength(3)
      expect(new Set(TESTIMONIALS.map((t) => t.id)).size).toBe(TESTIMONIALS.length)
    })

    test('auteur réduit au prénom et à l’initiale du nom, citation et contexte renseignés', () => {
      for (const testimonial of TESTIMONIALS) {
        expect(testimonial.author, testimonial.id).toMatch(/^\p{Lu}\p{L}+ \p{Lu}\.$/u)
        expect(testimonial.quote.length, testimonial.id).toBeGreaterThan(40)
        expect(testimonial.context.trim(), testimonial.id).not.toBe('')
      }
    })
  })
})
