import { CheckCircle2, Lock, ShieldCheck } from 'lucide-react'
import AppLink from '~/components/ui/AppLink'
import { FeatureCard } from './FeatureCard'
import { LegalDocument } from './LegalDocument'
import { LegalSection, Placeholder, Term } from './LegalSection'

const SECURITY_PILLARS = [
  {
    icon: <Lock size={20} />,
    title: 'Contrôle d’accès',
    description:
      'Rôles, permissions et séparation des espaces (cabinet / collaborateurs / candidats) selon le modèle.',
  },
  {
    icon: <ShieldCheck size={20} />,
    title: 'Protection des données',
    description:
      'Chiffrement en transit (HTTPS), mots de passe hachés, limitation des tentatives de connexion et pseudonymisation des données envoyées à l’IA.',
  },
  {
    icon: <CheckCircle2 size={20} />,
    title: 'Traçabilité',
    description:
      'Journalisation et supervision pour détecter les anomalies et investiguer en cas d’incident.',
  },
]

export default function SecurityPage() {
  return (
    <LegalDocument
      eyebrow="Sécurité"
      title="Sécurité & confidentialité"
      lead="Cette page résume les pratiques de sécurité et de confidentialité. Les points ci-dessous sont à compléter selon votre infrastructure et vos procédures internes."
      aside={
        <div className="grid gap-4 sm:grid-cols-3">
          {SECURITY_PILLARS.map((pillar) => (
            <FeatureCard
              key={pillar.title}
              icon={pillar.icon}
              title={pillar.title}
              description={pillar.description}
            />
          ))}
        </div>
      }
    >
      <LegalSection title="Hébergement & localisation">
        <p>
          Plateforme et base de données hébergées dans l&apos;Union européenne{' '}
          <Placeholder>[prestataire à compléter]</Placeholder>. Liste complète des sous-traitants
          dans la{' '}
          <AppLink
            href="/confidentialite"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            politique de confidentialité
          </AppLink>
          .
        </p>
      </LegalSection>

      <LegalSection title="Intelligence artificielle">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <Term>Fournisseur</Term> : Mistral AI, société française, traitement dans l&apos;UE
          </li>
          <li>
            <Term>Analyses pseudonymisées</Term> : le nom et l&apos;e-mail du candidat sont retirés
            avant envoi au modèle
          </li>
          <li>Aucune utilisation des données pour l&apos;entraînement des modèles</li>
          <li>Analyses relues par le conseiller, jamais de décision automatisée</li>
        </ul>
      </LegalSection>

      <LegalSection title="Gestion des accès">
        <ul className="list-disc space-y-2 pl-5">
          <li>Principe du moindre privilège</li>
          <li>Accès administrateurs encadrés</li>
          <li>Révocation / rotation selon procédures internes</li>
        </ul>
      </LegalSection>

      <LegalSection title="Sauvegardes & continuité">
        <p>
          Politique de sauvegarde, tests de restauration, objectifs RPO/RTO. <Placeholder />
        </p>
      </LegalSection>

      <LegalSection title="Gestion des incidents">
        <p>
          Process de notification, analyse, remédiation et communication. <Placeholder />
        </p>
      </LegalSection>
    </LegalDocument>
  )
}
