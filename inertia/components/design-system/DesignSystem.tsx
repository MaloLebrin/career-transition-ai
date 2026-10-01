import React from 'react'
import Button from '~/components/ui/Button'
import { SectionHeading } from '~/components/ui/SectionHeading'
import { ColorsShowcase } from './sections/ColorsShowcase'
import { ComponentsShowcase } from './sections/ComponentsShowcase'
import { TypographyShowcase } from './sections/TypographyShowcase'

interface DesignSystemProps {
  onBack: () => void
}

/** Vitrine interne (super admin) des tokens et primitives décrits dans DESIGN.md. */
const DesignSystem: React.FC<DesignSystemProps> = ({ onBack }) => (
  <div className="space-y-16">
    <div className="flex flex-col gap-6 border-b border-hairline pb-8 md:flex-row md:items-end md:justify-between">
      <SectionHeading
        level={1}
        size="display-md"
        eyebrow="Transition Carrière"
        title="Design system"
        description="Référence vivante des tokens et composants. Le contrat complet est dans DESIGN.md à la racine du dépôt."
      />
      <Button onClick={onBack} variant="outline" size="sm">
        Retour au bureau
      </Button>
    </div>
    <ColorsShowcase />
    <TypographyShowcase />
    <ComponentsShowcase />
  </div>
)

export default DesignSystem
