import { PageSeo } from '~/components/seo/PageSeo'
import TermsOfSalePage from '../components/marketing/TermsOfSalePage'

export default function TermsOfSale() {
  return (
    <>
      <PageSeo
        title="Conditions générales de vente"
        description="Conditions générales de vente du forfait Transition Carrière : prix, paiement, rétractation et médiation."
      />
      <TermsOfSalePage />
    </>
  )
}
