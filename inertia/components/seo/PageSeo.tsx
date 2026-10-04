import { APP_NAME } from '#shared/constants/app'
import { Head } from '@inertiajs/react'

interface PageSeoProps {
  title: string
  description: string
}

/**
 * Titre et métadonnées de partage d'une page publique. Les balises portent un
 * `head-key` : Inertia les rend une seule fois, côté serveur comme au client.
 * L'URL canonique et `og:url` viennent du layout Edge (`APP_URL`, jamais la requête).
 */
export function PageSeo({ title, description }: PageSeoProps) {
  return (
    <Head title={title}>
      <meta head-key="description" name="description" content={description} />
      <meta head-key="og:type" property="og:type" content="website" />
      <meta head-key="og:locale" property="og:locale" content="fr_FR" />
      <meta head-key="og:site_name" property="og:site_name" content={APP_NAME} />
      <meta head-key="og:title" property="og:title" content={`${title} - ${APP_NAME}`} />
      <meta head-key="og:description" property="og:description" content={description} />
      <meta head-key="twitter:card" name="twitter:card" content="summary" />
    </Head>
  )
}
