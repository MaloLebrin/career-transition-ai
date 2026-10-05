import { PageSeo } from '~/components/seo/PageSeo'
import CabinetLandingPage from '~/components/landing/CabinetLandingPage'

export default function Cabinets() {
  return (
    <>
      <PageSeo
        title="Logiciel de bilan de compétences pour cabinets"
        description="Logiciel de bilan de compétences pour cabinets de transition professionnelle et d'outplacement : exercices, synthèses assistées par l'IA, suivi des candidats. Demandez une démo."
      />
      <CabinetLandingPage />
    </>
  )
}
