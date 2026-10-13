import React from 'react'
import {
  COMPANION_POSES,
  COMPANION_TONES,
  Companion,
  type CompanionPose,
  type CompanionTone,
} from '~/components/ui/Companion'
import { ShowcaseSection } from './ShowcaseSection'

const POSE_USAGE: Record<CompanionPose, { label: string; usage: string }> = {
  wave: { label: 'Salut', usage: 'Accueil : héros, carte « Bonjour », écrans auth.' },
  cheer: { label: 'Joie', usage: 'Succès : paiement confirmé.' },
  think: { label: 'Réflexion', usage: 'Attente, lien invalide.' },
  guard: { label: 'Garde', usage: 'Résultats réservés au forfait.' },
  rest: { label: 'Repos', usage: 'États vides : chat, commentaires.' },
}

const TONE_FRAME: Record<CompanionTone, { label: string; frame: string; text: string }> = {
  default: {
    label: 'Sur surface claire',
    frame: 'border border-hairline bg-canvas',
    text: 'text-ink',
  },
  inverse: { label: 'Sur ink', frame: 'bg-ink', text: 'text-on-ink' },
}

/** Le compagnon du candidat : cinq postures, deux tons, jamais seul porteur de sens. */
export const CompanionShowcase: React.FC = () => (
  <ShowcaseSection
    eyebrow="08"
    title="Compagnon"
    description="Un petit droïde sphérique aux couleurs du héros (coque claire, panneaux abricot, mécanique mauve, lentille lac). Décoratif : il accompagne un titre ou une icône, jamais plus d’un par écran, jamais posé sur une teinte -bold."
  >
    <div className="space-y-6">
      {COMPANION_TONES.map((tone) => (
        <div key={tone} className="space-y-2">
          <p className="text-sm font-semibold text-ink">{TONE_FRAME[tone].label}</p>
          <ul
            className={`grid grid-cols-2 gap-4 rounded-2xl p-6 sm:grid-cols-5 ${TONE_FRAME[tone].frame}`}
          >
            {COMPANION_POSES.map((pose) => (
              <li key={pose} className="flex flex-col items-center gap-2 text-center">
                <Companion pose={pose} tone={tone} size="md" animated />
                <p className={`text-sm ${TONE_FRAME[tone].text}`}>
                  <span className="font-semibold">{POSE_USAGE[pose].label}</span>
                  <span className="block text-caption opacity-80">{POSE_USAGE[pose].usage}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </ShowcaseSection>
)
