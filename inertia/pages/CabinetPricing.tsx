import { PageSeo } from '~/components/seo/PageSeo'
import CabinetPricingPage from '~/components/marketing/CabinetPricingPage'

export default function CabinetPricing() {
  return (
    <>
      <PageSeo
        title="Tarifs pour cabinets de transition"
        description="Offres mensuelles pour cabinets de transition professionnelle et d'outplacement, selon votre volume de candidats. Demandez un devis."
      />
      <CabinetPricingPage />
    </>
  )
}
