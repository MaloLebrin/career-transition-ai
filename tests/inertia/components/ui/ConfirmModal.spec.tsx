import { render, screen } from '@testing-library/react'
import { test, expect, vi } from 'vitest'
import ConfirmModal from '~/components/ui/ConfirmModal'

test('ConfirmModal does not render when closed', () => {
  render(<ConfirmModal isOpen={false} title="Delete" onCancel={vi.fn()} onConfirm={vi.fn()} />)
  expect(screen.queryByText('Delete')).not.toBeInTheDocument()
})

test('ConfirmModal renders title, description and actions', () => {
  render(
    <ConfirmModal
      isOpen
      title="Supprimer"
      description="Cette action est définitive."
      cancelLabel="Annuler"
      confirmLabel="Supprimer"
      onCancel={vi.fn()}
      onConfirm={vi.fn()}
    />
  )

  expect(screen.getByRole('dialog')).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Supprimer' })).toBeInTheDocument()
  expect(screen.getByText('Cette action est définitive.')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Annuler' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Supprimer' })).toBeInTheDocument()
})

test('ConfirmModal disables cancel while loading', () => {
  render(
    <ConfirmModal
      isOpen
      title="Supprimer"
      state="loading"
      cancelLabel="Annuler"
      confirmLabel="Supprimer"
      onCancel={vi.fn()}
      onConfirm={vi.fn()}
    />
  )

  expect(screen.getByRole('button', { name: 'Annuler' })).toBeDisabled()
})

test('ConfirmModal shows error message in error state', () => {
  render(
    <ConfirmModal
      isOpen
      title="Supprimer"
      state="error"
      errorMessage="Impossible."
      onCancel={vi.fn()}
      onConfirm={vi.fn()}
    />
  )

  expect(screen.getByRole('alert')).toHaveTextContent('Impossible.')
})

test('ConfirmModal maps every variant onto a real button variant (no `undefined` class)', () => {
  const { rerender } = render(
    <ConfirmModal
      isOpen
      title="?"
      variant="warning"
      confirmLabel="Oui"
      onCancel={vi.fn()}
      onConfirm={vi.fn()}
    />
  )
  expect(screen.getByRole('button', { name: 'Oui' })).toHaveClass('bg-sun')
  expect(screen.getByRole('button', { name: 'Oui' }).className).not.toContain('undefined')

  rerender(
    <ConfirmModal
      isOpen
      title="?"
      variant="success"
      confirmLabel="Oui"
      onCancel={vi.fn()}
      onConfirm={vi.fn()}
    />
  )
  expect(screen.getByRole('button', { name: 'Oui' })).toHaveClass('bg-primary')
  expect(screen.getByRole('button', { name: 'Oui' }).className).not.toContain('undefined')

  rerender(
    <ConfirmModal
      isOpen
      title="?"
      variant="danger"
      confirmLabel="Oui"
      onCancel={vi.fn()}
      onConfirm={vi.fn()}
    />
  )
  expect(screen.getByRole('button', { name: 'Oui' })).toHaveClass('bg-danger')
})
