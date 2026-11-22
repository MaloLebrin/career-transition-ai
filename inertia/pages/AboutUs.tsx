import { PageSeo } from '~/components/seo/PageSeo'
import AboutUsPage from '../components/marketing/AboutUsPage'

export default function AboutUs() {
  return (
    <>
      <PageSeo
        title="Qui sommes-nous"
        description="Deux psychologues du travail derrière jumpUjob : Clara, l’expert du parcours, et Malo, qui a construit la plateforme."
      />
      <AboutUsPage />
    </>
  )
}
