import { PageSeo } from '~/components/seo/PageSeo'
import PricingPage from '../components/marketing/PricingPage'

export default function Pricing() {
  return (
    <>
      <PageSeo
        title="Tarifs du bilan de carrière"
        description="Un forfait unique, réglé une fois, pour débloquer vos résultats et la synthèse de votre bilan de carrière. Premiers exercices gratuits."
      />
      <PricingPage />
    </>
  )
}
