import { PageSeo } from '~/components/seo/PageSeo'
import AboutUsPage from '../components/marketing/AboutUsPage'

export default function AboutUs() {
  return (
    <>
      <PageSeo
        title="Qui sommes-nous"
        description="Transition Carrière aide chacun à faire le point sur sa carrière : des exercices issus des sciences comportementales, une IA copilote et un expert si vous le souhaitez."
      />
      <AboutUsPage />
    </>
  )
}
