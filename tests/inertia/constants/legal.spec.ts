import { describe, expect, test } from 'vitest'
import {
  PRIVACY_CONTACT_EMAIL,
  PRIVACY_REQUEST_DELAY,
  RETENTION_PERIODS,
  SELLER_IDENTITY,
  SUBPROCESSORS,
  TERMS_VERSION,
  WITHDRAWAL_NOTICE,
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
      // Paiement du forfait particuliers (Stripe Checkout, #95 / #102).
      expect(names).toEqual(
        expect.arrayContaining([
          'Mistral AI',
          'Resend',
          'Sentry',
          'Cloudinary',
          'Google Fonts',
          'Stripe',
        ])
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

    test('Stripe : page de paiement hébergée, aucune donnée de carte sur nos serveurs', () => {
      const stripe = SUBPROCESSORS.find((s) => s.name === 'Stripe')
      expect(stripe?.purpose).toMatch(/données de carte ne transitent jamais par nos serveurs/)
      expect(stripe?.purpose).toMatch(/factures/)
    })
  })

  describe('conditions générales (CGU / CGV, #95)', () => {
    test('TERMS_VERSION est une date ISO (enregistrée sur le compte à l’acceptation)', () => {
      expect(TERMS_VERSION).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(Number.isNaN(Date.parse(TERMS_VERSION))).toBe(false)
    })

    test('identité du vendeur : nom et e-mail renseignés, le reste explicitement à compléter', () => {
      expect(SELLER_IDENTITY.name.trim()).not.toBe('')
      expect(SELLER_IDENTITY.email).toBe(PRIVACY_CONTACT_EMAIL)
      for (const field of [
        SELLER_IDENTITY.legalForm,
        SELLER_IDENTITY.siren,
        SELLER_IDENTITY.address,
        SELLER_IDENTITY.mediator,
      ]) {
        expect(field).toMatch(/à compléter/)
      }
    })

    test('rétractation : exécution immédiate et renonciation expresse (L221-28 13°)', () => {
      expect(WITHDRAWAL_NOTICE).toMatch(/L221-28 13°/)
      expect(WITHDRAWAL_NOTICE).toMatch(/quatorze jours/)
      expect(WITHDRAWAL_NOTICE).toMatch(/expressément/)
    })
  })

  describe('durées de conservation', () => {
    test('couvre dossier candidat, comptes, particuliers, paiements, contacts, documents, PDF et journaux', () => {
      const data = RETENTION_PERIODS.map((r) => r.data).join('\n')
      for (const pattern of [
        /Dossier candidat/,
        /Comptes utilisateurs/,
        /Compte particulier/,
        /Données de paiement et factures/,
        /Demandes de contact/,
        /Documents du candidat/,
        /Exports PDF/,
        /Journaux/,
      ]) {
        expect(data).toMatch(pattern)
      }
    })

    test('paiements : 10 ans (Code de commerce), anonymisés après effacement du compte', () => {
      const payments = RETENTION_PERIODS.find((r) => /paiement/.test(r.data))
      expect(payments?.duration).toMatch(/10 ans/)
      expect(payments?.duration).toMatch(/L123-22/)
      expect(payments?.duration).toMatch(/anonymisé/)
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
