import { usePage } from '@inertiajs/react'
import { ArrowRight } from 'lucide-react'
import React from 'react'
import { SectionHeading } from '../ui/SectionHeading'
import PublicLayout from '../layout/PublicLayout'
import AppLink from '../ui/AppLink'
import { JOURNEY_PATH } from '~/config/marketing'
import { FREE_TITLE, TOTAL_WORD } from './individuals/copy'
import { ExercisePills } from './home/ExercisePills'
import { FinalCall } from './home/FinalCall'
import { HomeHero } from './home/HomeHero'
import { HomeSteps } from './home/HomeSteps'
import { PlanBand } from './home/PlanBand'
import { StartAction } from './home/StartAction'
import { TrustColumns } from './home/TrustColumns'
import { MarketingDemoSection } from './MarketingDemoSection'
import { MarketingSection } from './MarketingSection'

/**
 * Accueil public `/` (brief jumpUjob, planche 47) : six blocs entre l'en-tête et le pied de
 * page — héros, comment ça marche, le parcours en pastilles, le forfait (seul prix de la page),
 * confiance, appel final. Le CTA renvoie vers l'inscription quand elle est ouverte
 * (`b2cRegistrationEnabled`), vers le formulaire de liste d'attente sinon. Les cabinets ont
 * leur espace sur `/cabinets` (lien dans l'en-tête et le pied de page).
 */
export default function IndividualsPage() {
  const { props } = usePage<{ b2cRegistrationEnabled?: boolean }>()
  const registrationOpen = Boolean(props.b2cRegistrationEnabled)

  return (
    <PublicLayout>
      <HomeHero registrationOpen={registrationOpen} />

      <HomeSteps />

      <MarketingSection tone="canvas" id="parcours" className="scroll-mt-16 pt-8 md:pt-10">
        <div className="flex flex-col gap-6">
          <SectionHeading
            eyebrow="Le parcours"
            title={`${TOTAL_WORD.charAt(0).toUpperCase()}${TOTAL_WORD.slice(1)} exercices pour y voir clair.`}
          />
          <ExercisePills />
          <AppLink
            href={JOURNEY_PATH}
            className="inline-flex items-center gap-1.5 self-start font-bold text-accent hover:underline"
          >
            Voir le détail des exercices
            <ArrowRight size={16} aria-hidden="true" />
          </AppLink>
        </div>
      </MarketingSection>

      <PlanBand registrationOpen={registrationOpen} />

      <TrustColumns />

      {!registrationOpen && (
        <MarketingDemoSection
          id="contact"
          tone="surface"
          variant="contact"
          eyebrow="Bientôt disponible"
          title="L’inscription des particuliers ouvre prochainement."
          description="Laissez-nous votre adresse : nous vous prévenons dès que vous pourrez commencer les exercices offerts."
        />
      )}

      <FinalCall
        description={`${FREE_TITLE} pour commencer. Pas de carte bancaire, pas d’engagement.`}
        action={<StartAction registrationOpen={registrationOpen} onHome />}
      />
    </PublicLayout>
  )
}
