import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react'
import type { LucideIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import React, { useState } from 'react'
import { MARKETING_TINTS, type MarketingTint } from './tints'

export interface FeatureTab {
  label: string
  icon: LucideIcon
  tint: MarketingTint
  title: string
  description: string
  /** Points concrets sous la description. */
  points?: string[]
  /** Mockup vivant affiché à droite. */
  visual: React.ReactNode
}

/**
 * Fonctionnalités en onglets, à la Stripe : la liste à gauche, le mockup de l'onglet actif
 * à droite, qui entre en fondu (Headless UI `TabGroup` : flèches, Origine/Fin au clavier).
 */
export const FeatureTabs: React.FC<{ tabs: FeatureTab[] }> = ({ tabs }) => {
  const [selected, setSelected] = useState(0)

  return (
    <TabGroup
      selectedIndex={selected}
      onChange={setSelected}
      vertical
      className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12"
    >
      <TabList className="flex gap-2 overflow-x-auto pb-1 lg:col-span-5 lg:flex-col lg:overflow-visible">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const tint = MARKETING_TINTS[tab.tint]
          return (
            <Tab
              key={tab.label}
              className="group flex shrink-0 cursor-pointer items-start gap-4 rounded-xl border border-transparent p-4 text-left transition-colors hover:bg-surface-soft focus:outline-none data-focus:outline-2 data-focus:outline-accent data-selected:border-hairline data-selected:bg-surface data-selected:shadow-card"
            >
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tint.surface} ${tint.ink}`}
                aria-hidden="true"
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="flex flex-col gap-1">
                <span className="text-title-sm text-ink">{tab.label}</span>
                <span className="hidden text-sm text-muted group-data-selected:block lg:block">
                  {tab.title}
                </span>
              </span>
            </Tab>
          )
        })}
      </TabList>
      <TabPanels className="lg:col-span-7">
        {tabs.map((tab, index) => (
          <TabPanel key={tab.label} className="focus:outline-none">
            <AnimatePresence mode="wait">
              {selected === index && (
                <motion.div
                  key={tab.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <h3 className="text-title-lg">{tab.title}</h3>
                    <p className="text-body-lg text-muted">{tab.description}</p>
                    {tab.points && (
                      <ul className="flex flex-wrap gap-x-5 gap-y-1 pt-1 text-sm text-ink-soft">
                        {tab.points.map((point) => (
                          <li key={point} className="flex items-center gap-2">
                            <span
                              className="h-1.5 w-1.5 rounded-full bg-accent"
                              aria-hidden="true"
                            />
                            {point}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {tab.visual}
                </motion.div>
              )}
            </AnimatePresence>
          </TabPanel>
        ))}
      </TabPanels>
    </TabGroup>
  )
}
