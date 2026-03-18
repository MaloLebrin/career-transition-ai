import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import DefaultResultView from '../../../../../inertia/components/exercises/results/DefaultResultView'

describe('DefaultResultView', () => {
  test('renders without crashing with empty object', () => {
    expect(() => render(<DefaultResultView data={{}} />)).not.toThrow()
    expect(screen.getByText('{}')).toBeInTheDocument()
  })

  test('renders JSON data correctly', () => {
    const data = { key: 'value', number: 42 }
    render(<DefaultResultView data={data} />)

    const pre = screen.getByText(/"key": "value"/, { exact: false })
    expect(pre).toBeInTheDocument()
  })

  test('renders null data', () => {
    render(<DefaultResultView data={null} />)
    expect(screen.getByText('null')).toBeInTheDocument()
  })

  test('renders array data', () => {
    const data = [1, 2, 3]
    render(<DefaultResultView data={data} />)

    expect(screen.getByText(/1/, { exact: false })).toBeInTheDocument()
    expect(screen.getByText(/2/, { exact: false })).toBeInTheDocument()
    expect(screen.getByText(/3/, { exact: false })).toBeInTheDocument()
  })
})
