/** Fournisseur utilisé par les jobs d’analyse texte côté serveur (`AI_PROVIDER` dans `.env`). */
export const AI_PROVIDER_MODES = {
  MISTRAL: 'mistral',
  GEMINI: 'gemini',
  OPENAI: 'openai',
  NONE: 'none',
} as const

export type AiProviderMode = (typeof AI_PROVIDER_MODES)[keyof typeof AI_PROVIDER_MODES]

export const aiProviderModeValues = Object.values(AI_PROVIDER_MODES)
