import { PageSeo } from '~/components/seo/PageSeo'
import JourneyPage from '~/components/marketing/JourneyPage'

export default function Journey() {
  return (
    <>
      <PageSeo
        title="Le parcours"
        description="Le détail des exercices du parcours jumpUjob : motivations, valeurs, courbe de vie, personnalité, ciblage, DISC, compétences et cercle de contrôle."
      />
      <JourneyPage />
    </>
  )
}
