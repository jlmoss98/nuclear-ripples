import { fireEvent, render, screen, within } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { DEFAULT_SCENARIO } from '../model'
import { POSTURE_DEFINITIONS } from '../data/postureDefinitions'
import { ControlsPanel } from './ControlsPanel'

it('places five nuclear choices before the strategic controls in one drawer', () => {
  render(
    <ControlsPanel
      scenario={DEFAULT_SCENARIO}
      onPostureChange={vi.fn()}
      onChange={vi.fn()}
      onAiChange={vi.fn()}
    />,
  )

  expect(screen.getByText('16 choices')).toBeVisible()
  const headings = screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)
  expect(headings[0]).toBe('Nuclear choices')
  expect(headings[1]).toBe('Crisis conditions')
})

it('reveals Taiwan conflict follow-ups only for an open conflict', () => {
  const onChange = vi.fn()
  const { rerender } = render(
    <ControlsPanel
      scenario={DEFAULT_SCENARIO}
      onPostureChange={vi.fn()}
      onChange={onChange}
      onAiChange={vi.fn()}
    />,
  )

  expect(screen.queryByRole('radiogroup', { name: 'Open-conflict outcome' })).not.toBeInTheDocument()
  expect(screen.queryByRole('radiogroup', { name: 'Chinese low-yield nuclear options' })).not.toBeInTheDocument()
  expect(screen.getByText('16 choices')).toBeVisible()

  rerender(
    <ControlsPanel
      scenario={{ ...DEFAULT_SCENARIO, controls: { ...DEFAULT_SCENARIO.controls, taiwanCrisis: 'blockade' } }}
      onPostureChange={vi.fn()}
      onChange={onChange}
      onAiChange={vi.fn()}
    />,
  )

  expect(screen.queryByRole('radiogroup', { name: 'Open-conflict outcome' })).not.toBeInTheDocument()
  expect(screen.queryByRole('radiogroup', { name: 'Chinese low-yield nuclear options' })).not.toBeInTheDocument()
  expect(screen.getByText('16 choices')).toBeVisible()

  rerender(
    <ControlsPanel
      scenario={{ ...DEFAULT_SCENARIO, controls: { ...DEFAULT_SCENARIO.controls, taiwanCrisis: 'open-conflict' } }}
      onPostureChange={vi.fn()}
      onChange={onChange}
      onAiChange={vi.fn()}
    />,
  )

  expect(screen.getByRole('radiogroup', { name: 'Open-conflict outcome' })).toBeVisible()
  expect(screen.getByRole('radiogroup', { name: 'Chinese low-yield nuclear options' })).toBeVisible()
  expect(screen.getByText('18 choices')).toBeVisible()
  expect(screen.getByText('Informational only · changes explanation, not scores or proliferation pressure.')).toBeVisible()

  fireEvent.click(screen.getByRole('radio', { name: 'Face-saving off-ramp' }))
  expect(onChange).toHaveBeenCalledWith(
    'taiwanConflictOutcome',
    'off-ramp',
    'Face-saving off-ramp',
    'Open-conflict outcome',
  )

  fireEvent.click(screen.getByRole('radio', { name: 'Available' }))
  expect(onChange).toHaveBeenCalledWith(
    'chinaLowYieldOptions',
    'available',
    'Available',
    'Chinese low-yield nuclear options',
  )
})

it('renders the complete canonical U.S. posture reference and its qualitative-category caveat', () => {
  render(
    <ControlsPanel
      scenario={DEFAULT_SCENARIO}
      onPostureChange={vi.fn()}
      onChange={vi.fn()}
      onAiChange={vi.fn()}
    />,
  )

  const reference = screen.getByText('United States posture reference').closest('details')
  expect(reference).not.toBeNull()

  for (const definition of POSTURE_DEFINITIONS['united-states']) {
    expect(within(reference!).getByText(definition.label)).toBeVisible()
    expect(within(reference!).getByText(definition.title)).toBeVisible()
    expect(within(reference!).getByText(definition.description)).toBeVisible()
  }
  const caveat = 'These are qualitative scenario categories, not arsenal counts or forecasts.'
  expect(within(reference!).getByText(caveat)).toBeVisible()
  expect(screen.getAllByText(caveat)).toHaveLength(1)
})
