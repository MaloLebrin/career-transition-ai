import { PageSeo } from '~/components/seo/PageSeo'
import TermsOfServicePage from '../components/marketing/TermsOfServicePage'

export default function TermsOfService() {
  return (
    <>
      <PageSeo
        title="Conditions générales d’utilisation"
        description="Conditions générales d'utilisation de la plateforme Transition Carrière."
      />
      <TermsOfServicePage />
    </>
  )
}
