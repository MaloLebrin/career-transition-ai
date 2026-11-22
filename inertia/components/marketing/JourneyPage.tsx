import { usePage } from '@inertiajs/react'
import React from 'react'
import PublicLayout from '../layout/PublicLayout'
import { SectionHeading } from '../ui/SectionHeading'
import { ExerciseCatalogue } from './ExerciseCatalogue'
import { StartAction } from './home/StartAction'
import { FREE_TITLE, TOTAL_WORD } from './individuals/copy'
import { MarketingSection } from './MarketingSection'

/**
 * Page `/parcours` (brief jumpUjob) : le détail des exercices sortis de l'accueil — numéro,
 * nom, une ligne de description — puis le bouton « Commencer gratuitement ».
 */
export default function JourneyPage() {
  const { props } = usePage<{ b2cRegistrationEnabled?: boolean }>()
  const registrationOpen = Boolean(props.b2cRegistrationEnabled)

  return (
    <PublicLayout>
      <MarketingSection tone="soft">
        <SectionHeading
          level={1}
          size="display-lg"
          eyebrow="Le parcours"
          title={`${TOTAL_WORD.charAt(0).toUpperCase()}${TOTAL_WORD.slice(1)} exercices pour y voir clair.`}
          description="Changez de job sans vous perdre en chemin : chaque exercice alimente votre synthèse de parcours, à votre rythme."
        />
      </MarketingSection>
      <MarketingSection tone="canvas">
        <div className="flex flex-col items-start gap-10">
          <ExerciseCatalogue />
          <div className="flex flex-col items-start gap-3">
            <StartAction registrationOpen={registrationOpen} />
            <p className="text-sm text-muted">{FREE_TITLE}, sans carte bancaire.</p>
          </div>
        </div>
      </MarketingSection>
    </PublicLayout>
  )
}
