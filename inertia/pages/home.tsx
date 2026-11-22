import { PageSeo } from '~/components/seo/PageSeo'
import IndividualsPage from '~/components/marketing/IndividualsPage'
import { HOME_TAGLINE } from '~/components/marketing/home/HomeHero'

export default function Home() {
  return (
    <>
      <PageSeo
        title={HOME_TAGLINE}
        description="Changez de job sans vous perdre en chemin : exercices issus des sciences comportementales, analyse assistée par l'IA et expert à la demande."
      />
      <IndividualsPage />
    </>
  )
}
