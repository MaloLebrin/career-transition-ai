import { PageSeo } from '~/components/seo/PageSeo'
import AboutUsPage from '../components/marketing/AboutUsPage'

export default function AboutUs() {
  return (
    <>
      <PageSeo
        title="Qui sommes-nous"
        description="Transition Carrière aide chacun à faire le point sur sa carrière : des exercices issus des sciences comportementales, une IA copilote et, si vous le souhaitez, l’accompagnement de deux psychologues du travail."
      />
      <AboutUsPage />
    </>
  )
}
