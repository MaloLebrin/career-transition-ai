/**
 * Classes partagées des champs de formulaire (Input, Textarea).
 * Tokens : hauteur 36/40/44 px, bordure hairline-strong, focus primaire, erreur danger.
 */
export type FieldSize = 'sm' | 'md' | 'lg'

export interface FieldStateOptions {
  error?: boolean
  success?: boolean
}

export const FIELD_SIZE_CLASSES: Record<FieldSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-3.5 text-sm',
  lg: 'h-11 px-4 text-base',
}

/** Padding seul (sans hauteur) pour un champ multi-lignes. */
export const FIELD_TEXT_CLASSES: Record<FieldSize, string> = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-3.5 py-2.5 text-sm',
  lg: 'px-4 py-3 text-base',
}

export const LABEL_CLASSES = 'block text-sm font-medium text-ink'
export const REQUIRED_MARK_CLASSES = 'text-danger'
export const ERROR_MESSAGE_CLASSES = 'text-sm text-danger'
export const HINT_MESSAGE_CLASSES = 'text-sm text-muted'
export const ADDON_CLASSES = 'flex items-center text-muted bg-surface-soft'
export const ACTION_BUTTON_CLASSES =
  'p-1.5 rounded-md text-muted hover:text-ink hover:bg-surface-soft transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 cursor-pointer disabled:cursor-not-allowed'

/** Bordure + anneau de focus selon l'état, pour un champ seul (`focus:`). */
export function fieldStateClassName({ error, success }: FieldStateOptions): string {
  if (error) return 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/25'
  if (success) return 'border-success focus:border-success focus:ring-2 focus:ring-success/25'
  return 'border-hairline-strong focus:border-primary focus:ring-2 focus:ring-primary/25'
}

/** Même chose pour un conteneur (`focus-within:`) qui enveloppe l'input et ses boutons. */
export function wrapperStateClassName({ error, success }: FieldStateOptions): string {
  if (error)
    return 'border-danger focus-within:border-danger focus-within:ring-2 focus-within:ring-danger/25'
  if (success)
    return 'border-success focus-within:border-success focus-within:ring-2 focus-within:ring-success/25'
  return 'border-hairline-strong focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/25'
}

export const FIELD_BASE_CLASSES =
  'w-full bg-surface border rounded-lg outline-none text-ink transition-colors placeholder:text-muted-soft disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-surface-soft'

/** Classes d'un champ autonome (sans addon ni bouton d'action). */
export function fieldClassName({
  size = 'md',
  error,
  success,
  className = '',
}: FieldStateOptions & { size?: FieldSize; className?: string }): string {
  return [
    FIELD_BASE_CLASSES,
    FIELD_SIZE_CLASSES[size],
    fieldStateClassName({ error, success }),
    className,
  ]
    .filter(Boolean)
    .join(' ')
}

/** Classes du conteneur qui porte la bordure quand l'input est entouré d'addons ou d'actions. */
export function wrapperClassName({
  size = 'md',
  error,
  success,
  className = '',
}: FieldStateOptions & { size?: FieldSize; className?: string }): string {
  return [
    'flex items-stretch bg-surface border rounded-lg overflow-hidden transition-colors focus-within:outline-none',
    wrapperStateClassName({ error, success }),
    size === 'sm' ? 'min-h-9' : size === 'lg' ? 'min-h-11' : 'min-h-10',
    className,
  ]
    .filter(Boolean)
    .join(' ')
}

/** Classes de l'input nu à l'intérieur d'un conteneur bordé. */
export function innerFieldClassName(size: FieldSize = 'md'): string {
  return `flex-1 min-w-0 border-0 rounded-none bg-transparent outline-none focus:ring-0 text-ink placeholder:text-muted-soft disabled:opacity-60 disabled:cursor-not-allowed ${FIELD_SIZE_CLASSES[size]}`
}
