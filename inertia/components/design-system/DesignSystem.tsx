import React, { useState } from 'react'
import Button from '../ui/Button'
import Card from '../ui/Card'
import Input from '../ui/Input'
import Badge from '../ui/Badge'
import NavButton from '../ui/NavButton'
import StatCard from '../ui/StatCard'

const DesignSystem: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [inputValue, setInputValue] = useState('')

  return (
    <div className="min-h-screen bg-slate-50 p-8 md:p-12 lg:p-16 animate-fadeIn">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Header */}
        <div className="flex justify-between items-end border-b border-brand-navy/10 pb-8">
          <div>
            <h1 className="text-5xl font-bold text-brand-navy tracking-tighter mb-2">
              Design System
            </h1>
            <p className="text-brand-navy/60 font-medium">
              France Transition Carrière (FTC) - UI Kit & Brand Guidelines
            </p>
          </div>
          <Button onClick={onBack} variant="secondary" size="sm">
            Retour au Bureau
          </Button>
        </div>

        {/* Colors Section */}
        <section className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-brand-navy uppercase tracking-widest opacity-30">
              01. Colors
            </h2>
            <p className="text-brand-navy/40 text-sm">
              Our core palette is professional, expert and human.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <ColorSwatch color="bg-brand-navy" name="Bleu Nuit" hex="#1E2F3F" />
            <ColorSwatch color="bg-brand-sage" name="Vert Sauge" hex="#6E8F80" />
            <ColorSwatch color="bg-brand-ivory" name="Ivoire Chaud" hex="#F4F1EA" />
            <ColorSwatch color="bg-brand-terracotta" name="Terracotta" hex="#C47652" />
            <ColorSwatch color="bg-brand-gray" name="Gris Technique" hex="#6B7280" />
            <ColorSwatch color="bg-white" name="Pure White" hex="#FFFFFF" />
          </div>
        </section>

        {/* Typography Section */}
        <section className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-brand-navy uppercase tracking-widest opacity-30">
              02. Typography
            </h2>
            <p className="text-brand-navy/40 text-sm">
              Using Inter & Manrope for a modern, structured feel.
            </p>
          </div>
          <div className="bg-white p-12 rounded-3xl border border-brand-navy/5 space-y-8">
            <div>
              <p className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest mb-4">
                Display Large
              </p>
              <h3 className="text-6xl font-bold text-brand-navy tracking-tighter">
                The future of career transition.
              </h3>
            </div>
            <div>
              <p className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest mb-4">
                Heading Medium
              </p>
              <h3 className="text-3xl font-bold text-brand-navy tracking-tight">
                Boostez votre parcours avec l'IA.
              </h3>
            </div>
            <div>
              <p className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest mb-4">
                Body Text
              </p>
              <p className="text-brand-navy/70 leading-relaxed max-w-2xl font-medium">
                FTC accompagne les cadres et dirigeants dans leur transition professionnelle. Notre
                approche combine expertise humaine et puissance technologique pour des résultats
                concrets.
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest mb-4">
                Micro Labels
              </p>
              <p className="text-[10px] font-bold text-brand-sage uppercase tracking-[0.2em]">
                Validation Session en cours...
              </p>
            </div>
          </div>
        </section>

        {/* Buttons Section */}
        <section className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-brand-navy uppercase tracking-widest opacity-30">
              03. Buttons
            </h2>
            <p className="text-brand-navy/40 text-sm">
              Interactive elements with structured hierarchy.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="space-y-6">
              <h4 className="text-xs font-bold text-brand-navy/40 uppercase tracking-widest mb-4">
                Variants
              </h4>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary">Primary Sage</Button>
                <Button variant="secondary">Secondary Navy</Button>
                <Button variant="terracotta">CTA Terracotta</Button>
                <Button variant="dark">Dark Expert</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
            </Card>
            <Card className="space-y-6">
              <h4 className="text-xs font-bold text-brand-navy/40 uppercase tracking-widest mb-4">
                Sizes & States
              </h4>
              <div className="flex flex-wrap items-center gap-4">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large Action</Button>
                <Button isLoading>Loading</Button>
                <Button disabled>Disabled</Button>
              </div>
            </Card>
          </div>
        </section>

        {/* Inputs & Forms Section */}
        <section className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-brand-navy uppercase tracking-widest opacity-30">
              04. Inputs
            </h2>
            <p className="text-brand-navy/40 text-sm">Clean, accessible form elements.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="space-y-6">
              <Input
                label="Nom complet"
                placeholder="Ex: Jean Dupont"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <Input
                label="Email"
                type="email"
                placeholder="jean@example.com"
                error="Veuillez entrer une adresse email valide"
              />
            </Card>
            <Card className="flex items-center justify-center bg-brand-navy">
              <div className="text-center space-y-4">
                <p className="text-white/50 font-bold uppercase text-[10px] tracking-widest">
                  Dark Context Input
                </p>
                <Input
                  placeholder="Rechercher..."
                  className="bg-white/10 border-white/10 text-white focus:bg-white/20"
                />
              </div>
            </Card>
          </div>
        </section>

        {/* Specialized Components */}
        <section className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-brand-navy uppercase tracking-widest opacity-30">
              05. Specialized Components
            </h2>
            <p className="text-brand-navy/40 text-sm">
              Components built for specific application needs.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <p className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest px-2">
                Stat Cards
              </p>
              <StatCard label="Total suivis" value={42} color="navy" />
              <StatCard label="En attente" value={12} color="terracotta" />
              <StatCard label="Validés" value="85%" color="sage" />
            </div>
            <div className="space-y-4">
              <p className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest px-2">
                Navigation
              </p>
              <div className="bg-white p-4 rounded-[32px] border border-brand-navy/5 space-y-2">
                <NavButton active={true} onClick={() => {}} icon="dashboard" label="Bureau" />
                <NavButton active={false} onClick={() => {}} icon="users" label="Candidats" />
                <NavButton active={false} onClick={() => {}} icon="settings" label="Réglages" />
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-[10px] font-bold text-brand-navy/40 uppercase tracking-widest px-2">
                Badges
              </p>
              <div className="bg-white p-8 rounded-[32px] border border-brand-navy/5 flex flex-wrap gap-3">
                <Badge variant="violet">Expert</Badge>
                <Badge variant="lime">Validé</Badge>
                <Badge variant="orange">En cours</Badge>
                <Badge variant="pink">Urgent</Badge>
                <Badge variant="cyan">Nouveau</Badge>
                <Badge variant="slate">Archivé</Badge>
              </div>
            </div>
          </div>
        </section>

        {/* Cards & Layout Section */}
        <section className="space-y-8 pb-20">
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-brand-navy uppercase tracking-widest opacity-30">
              06. Cards & Containers
            </h2>
            <p className="text-brand-navy/40 text-sm">Our signature "Vitaminé" containers.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card variant="default">
              <h4 className="text-xl font-bold text-brand-navy mb-4">Default Card</h4>
              <p className="text-brand-navy/60 text-sm">
                The standard container for most content blocks. Soft shadows and large radius.
              </p>
            </Card>
            <Card variant="dark">
              <h4 className="text-xl font-bold text-white mb-4">Dark Card</h4>
              <p className="text-white/60 text-sm">
                High contrast container for important highlights or dark-themed sections.
              </p>
            </Card>
            <Card variant="flat">
              <h4 className="text-xl font-bold text-brand-navy mb-4">Flat Card</h4>
              <p className="text-brand-navy/60 text-sm">
                Subtle background without shadow for nested content or secondary info.
              </p>
            </Card>
            <Card variant="amber" className="border-brand-terracotta/20">
              <h4 className="text-xl font-bold text-brand-terracotta mb-4">Terracotta Card</h4>
              <p className="text-brand-terracotta/80 text-sm">
                Warning or specialized feedback container with warm tones.
              </p>
            </Card>
          </div>
        </section>
      </div>
    </div>
  )
}

const ColorSwatch: React.FC<{ color: string; name: string; hex: string }> = ({
  color,
  name,
  hex,
}) => (
  <div className="space-y-3 group cursor-pointer">
    <div
      className={`h-24 w-full rounded-3xl ${color} shadow-sm transition-transform group-hover:scale-105 group-hover:shadow-lg`}
    ></div>
    <div>
      <p className="text-[10px] font-bold text-brand-navy uppercase tracking-tight">{name}</p>
      <p className="text-[9px] font-bold text-brand-navy/40 uppercase">{hex}</p>
    </div>
  </div>
)

export default DesignSystem
