import { PageSeo } from '~/components/seo/PageSeo'
import OfferPage from '../components/marketing/OfferPage'

export default function Offer() {
  return (
    <>
      <PageSeo
        title="Portail expert pour cabinets de transition"
        description="Le portail expert pour structurer vos bilans de compétences : exercices, synthèses, plan d'accompagnement et suivi des candidats, avec une IA copilote sous contrôle humain."
      />
      <OfferPage />
    </>
  )
}
