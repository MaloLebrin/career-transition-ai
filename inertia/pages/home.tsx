import { PageSeo } from '~/components/seo/PageSeo'
import IndividualsPage from '~/components/marketing/IndividualsPage'

export default function Home() {
  return (
    <>
      <PageSeo
        title="Bilan de carrière en autonomie"
        description="Faites le point sur votre carrière à votre rythme : exercices issus des sciences comportementales, analyse assistée par l'IA et expert à la demande."
      />
      <IndividualsPage />
    </>
  )
}
