import { PageSeo } from '~/components/seo/PageSeo'
import LegalNoticePage from '../components/marketing/LegalNoticePage'

export default function LegalNotice() {
  return (
    <>
      <PageSeo
        title="Mentions légales"
        description="Mentions légales de Transition Carrière : éditeur, directeur de la publication et hébergeur."
      />
      <LegalNoticePage />
    </>
  )
}
