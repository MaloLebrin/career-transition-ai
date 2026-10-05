import { PageSeo } from '~/components/seo/PageSeo'
import SecurityPage from '../components/marketing/SecurityPage'

export default function Security() {
  return (
    <>
      <PageSeo
        title="Sécurité et confidentialité"
        description="Mesures de sécurité de Transition Carrière : hébergement dans l'UE, pseudonymisation avant toute analyse par l'IA, chiffrement et contrôle des accès."
      />
      <SecurityPage />
    </>
  )
}
