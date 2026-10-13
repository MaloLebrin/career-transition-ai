import { PageSeo } from '~/components/seo/PageSeo'
import ContactPage from '../components/marketing/ContactPage'

export default function Contact() {
  return (
    <>
      <PageSeo
        title="Contact"
        description="Une question sur Transition Carrière, votre compte ou vos données ? Écrivez-nous : nous répondons sous 48 h ouvrées."
      />
      <ContactPage />
    </>
  )
}
