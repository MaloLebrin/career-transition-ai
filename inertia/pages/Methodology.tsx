import { PageSeo } from '~/components/seo/PageSeo'
import MethodologyPage from '../components/marketing/MethodologyPage'

export default function Methodology() {
  return (
    <>
      <PageSeo
        title="Méthodologie"
        description="Une méthode d'accompagnement structurée en trois temps (avant, pendant, après), pilotée par le conseiller et outillée par l'IA, pour les cabinets de transition professionnelle."
      />
      <MethodologyPage />
    </>
  )
}
