import { PageSeo } from '~/components/seo/PageSeo'
import PrivacyPolicyPage from '../components/marketing/PrivacyPolicyPage'

export default function PrivacyPolicy() {
  return (
    <>
      <PageSeo
        title="Politique de confidentialité"
        description="Comment jumpUjob traite vos données personnelles : finalités, bases légales, durées de conservation, sous-traitants et exercice de vos droits."
      />
      <PrivacyPolicyPage />
    </>
  )
}
