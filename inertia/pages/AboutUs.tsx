import { PageSeo } from '~/components/seo/PageSeo'
import AboutUsPage from '../components/marketing/AboutUsPage'

export default function AboutUs() {
  return (
    <>
      <PageSeo
        title="Qui sommes-nous"
        description="Deux psychologues du travail derrière jumpUjob : Sophie, l’expert du parcours, et Antoine, qui a construit la plateforme."
      />
      <AboutUsPage />
    </>
  )
}
