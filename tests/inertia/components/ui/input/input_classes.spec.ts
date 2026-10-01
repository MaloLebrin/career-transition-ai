import { describe, expect, test } from 'vitest'
import {
  fieldClassName,
  fieldStateClassName,
  innerFieldClassName,
  wrapperClassName,
  wrapperStateClassName,
} from '../../../../../inertia/components/ui/input/input_classes'

describe('input_classes', () => {
  test('fieldClassName combines size, state and extra classes', () => {
    const classes = fieldClassName({ size: 'lg', className: 'w-24' })
    expect(classes).toContain('h-11')
    expect(classes).toContain('border-hairline-strong')
    expect(classes).toContain('w-24')
  })

  test('state helpers prioritise error over success', () => {
    expect(fieldStateClassName({ error: true, success: true })).toContain('border-danger')
    expect(fieldStateClassName({ success: true })).toContain('border-success')
    expect(wrapperStateClassName({ error: true })).toContain('focus-within:ring-danger/25')
    expect(wrapperStateClassName({})).toContain('focus-within:border-primary')
  })

  test('wrapper and inner field classes follow the size', () => {
    expect(wrapperClassName({ size: 'sm' })).toContain('min-h-9')
    expect(wrapperClassName({})).toContain('min-h-10')
    expect(innerFieldClassName('lg')).toContain('text-base')
  })
})
