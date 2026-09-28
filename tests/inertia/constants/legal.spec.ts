import { describe, expect, test } from 'vitest'
import {
  PRIVACY_CONTACT_EMAIL,
  PRIVACY_REQUEST_DELAY,
  RETENTION_PERIODS,
  SUBPROCESSORS,
} from '#shared/constants/legal'

describe('shared/constants/legal (source de /confidentialite et /securite)', () => {
  describe('contact RGPD', () => {
    test('adresse e-mail valide pour exercer ses droits', () => {
      expect(PRIVACY_CONTACT_EMAIL).toMatch(/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i)
    })

    test('délai de réponse : un mois (art. 12 RGPD)', () => {
      expect(PRIVACY_REQUEST_DELAY).toBe('un mois')
    })
  })

  describe('sous-traitants', () => {
    test('déclare chaque service externe réellement utilisé par l’application', () => {
      const names = SUBPROCESSORS.map((s) => s.name)
      // IA (AI_PROVIDER), e-mails (MAIL_PROVIDER=resend), erreurs (SENTRY_DSN),
      // fichiers (Cloudinary), polices (Google Fonts), hébergement.
      expect(names).toEqual(
        expect.arrayContaining(['Mistral AI', 'Resend', 'Sentry', 'Cloudinary', 'Google Fonts'])
      )
      expect(names.some((name) => /hébergeur/i.test(name))).toBe(true)
    })

    test('chaque sous-traitant a un nom unique, une finalité et une localisation', () => {
      const names = SUBPROCESSORS.map((s) => s.name)
      expect(new Set(names).size).toBe(names.length)
      for (const subprocessor of SUBPROCESSORS) {
        expect(subprocessor.name.trim(), 'name').not.toBe('')
        expect(
          subprocessor.purpose.trim().length,
          `${subprocessor.name} : finalité`
        ).toBeGreaterThan(20)
        expect(subprocessor.location.trim(), `${subprocessor.name} : localisation`).not.toBe('')
      }
    })

    test('tout transfert hors UE mentionne les clauses contractuelles types', () => {
      for (const subprocessor of SUBPROCESSORS) {
        if (/États-Unis/.test(subprocessor.location)) {
          expect(subprocessor.location, subprocessor.name).toMatch(/clauses contractuelles types/)
        }
      }
    })

    test('Mistral : la pseudonymisation des analyses est annoncée', () => {
      const mistral = SUBPROCESSORS.find((s) => s.name === 'Mistral AI')
      expect(mistral?.purpose).toMatch(/nom et l’e-mail du candidat sont retirés/)
    })

    test('Sentry : aucune donnée identifiante transmise (id technique seulement)', () => {
      const sentry = SUBPROCESSORS.find((s) => s.name === 'Sentry')
      expect(sentry?.purpose).toMatch(/ni nom, ni e-mail, ni adresse IP/)
    })
  })

  describe('durées de conservation', () => {
    test('couvre dossier candidat, comptes, contacts, documents, PDF et journaux', () => {
      const data = RETENTION_PERIODS.map((r) => r.data).join('\n')
      for (const pattern of [
        /Dossier candidat/,
        /Comptes utilisateurs/,
        /Demandes de contact/,
        /Documents du candidat/,
        /Exports PDF/,
        /Journaux/,
      ]) {
        expect(data).toMatch(pattern)
      }
    })

    test('chaque catégorie est unique et a une durée renseignée', () => {
      const data = RETENTION_PERIODS.map((r) => r.data)
      expect(new Set(data).size).toBe(data.length)
      for (const period of RETENTION_PERIODS) {
        expect(period.duration.trim(), period.data).not.toBe('')
      }
    })

    test('aucune durée illimitée : chaque durée est bornée (délai ou événement de fin)', () => {
      for (const period of RETENTION_PERIODS) {
        expect(period.duration, period.data).toMatch(/\d+ (an|ans|jours|mois)|suppression|Durée/)
        expect(period.duration, period.data).not.toMatch(/illimit|indéfini/i)
      }
    })
  })
})
