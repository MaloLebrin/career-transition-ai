export const QUEUE_NAMES = {
  default: 'default',
  ai: 'ai',
  analytics: 'analytics',
  pdfs: 'pdfs',
} as const

export const QUEUE_NAMES_LIST = Object.values(QUEUE_NAMES)

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES]
