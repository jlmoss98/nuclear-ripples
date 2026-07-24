import { render, screen, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import { RiskLegend } from './RiskLegend'

it('defines all four proliferation-risk colors, ranges, and meanings', () => {
  render(<RiskLegend />)

  const legend = screen.getByRole('region', { name: 'Proliferation risk' })
  expect(within(legend).getByText(/not a probability or forecast/i)).toBeVisible()

  const expected = [
    ['Green · Low', '0–24', /limited exposure/i],
    ['Yellow · Guarded', '25–49', /meaningful but contained exposure/i],
    ['Orange · High', '50–74', /acquiring, expanding, or operationalizing nuclear capabilities/i],
    ['Red · Critical', '75–100', /strongly intensify incentives to acquire, expand, or operationalize/i],
  ] as const

  for (const [label, range, definition] of expected) {
    const item = within(legend).getByRole('listitem', { name: `${label} ${range}` })
    expect(within(item).getByText(label)).toBeVisible()
    expect(within(item).getByText(range)).toBeVisible()
    expect(within(item).getByText(definition)).toBeVisible()
  }
})
