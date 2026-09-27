import type { ReactElement } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

/**
 * Monte un composant et renvoie, en plus du résultat de `render`, une instance
 * `user` de `@testing-library/user-event` prête à simuler les interactions.
 */
export function renderWithUser(ui: ReactElement, options?: RenderOptions) {
  const user = userEvent.setup()
  return { user, ...render(ui, options) }
}
