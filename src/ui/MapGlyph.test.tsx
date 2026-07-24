import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { DEFAULT_SCENARIO, evaluateScenario } from '../model'
import { MapGlyph } from './MapGlyph'
import type { AnnotationKind } from './mapAnnotations'
import { ResultsTable } from './ResultsTable'

const kinds: AnnotationKind[] = ['warhead', 'warship', 'conflict', 'umbrella', 'radar', 'missile', 'link', 'warning', 'ring', 'document', 'circuit']

it.each(kinds)('renders the %s glyph as inline SVG', (kind) => {
  const { container } = render(<MapGlyph kind={kind} variant="selected" />)
  expect(container.querySelector(`[data-glyph="${kind}"]`)).toBeInTheDocument()
})

it('gives selected and predicted warheads distinct non-color classes', () => {
  const { container, rerender } = render(<MapGlyph kind="warhead" variant="selected" />)
  expect(container.querySelector('.map-glyph--selected')).toBeInTheDocument()

  rerender(<MapGlyph kind="warhead" variant="predicted" />)
  expect(container.querySelector('.map-glyph--predicted')).toBeInTheDocument()
})

it('gives the circuit glyph a distinct AI class', () => {
  const { container } = render(<MapGlyph kind="circuit" variant="ai" />)
  expect(container.querySelector('[data-glyph="circuit"].map-glyph--ai')).toBeInTheDocument()
})

it('adds keyboard-accessible zero AI columns while preserving nuclear scores', () => {
  const onSelect = vi.fn()
  render(<ResultsTable mode="ai" result={evaluateScenario({ ...DEFAULT_SCENARIO, mode: 'ai' })} onSelect={onSelect} />)

  expect(screen.getByRole('columnheader', { name: 'AI exposure' })).toBeInTheDocument()
  expect(screen.getByRole('columnheader', { name: 'AI pressure' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Why Japan has modeled AI exposure plus zero' })).toHaveTextContent('+0')
  const zeroButton = screen.getByRole('button', { name: 'Why Japan has modeled AI proliferation pressure plus zero' })
  zeroButton.click()
  expect(onSelect).toHaveBeenCalledWith('japan', zeroButton)
})
