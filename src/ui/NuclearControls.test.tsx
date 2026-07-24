import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { DEFAULT_SCENARIO } from '../model'
import { NuclearControls } from './NuclearControls'

it('renders all nuclear posture choices as compact control fields', () => {
  render(<NuclearControls postures={DEFAULT_SCENARIO.postures} onChange={vi.fn()} />)

  expect(screen.getByRole('heading', { name: 'Nuclear choices' })).toBeVisible()
  expect(screen.getAllByRole('radiogroup')).toHaveLength(5)
  expect(screen.getByRole('radiogroup', { name: 'China nuclear posture' })).toBeVisible()
  expect(screen.getByRole('radiogroup', { name: 'United States nuclear posture' })).toBeVisible()
  expect(screen.getAllByText('Non-nuclear reference posture')).toHaveLength(2)
})

it('keeps the full level key in an expandable reference', async () => {
  const user = userEvent.setup()
  render(<NuclearControls postures={DEFAULT_SCENARIO.postures} onChange={vi.fn()} />)

  const reference = screen.getByText('What the levels mean').closest('details')
  expect(reference).not.toHaveAttribute('open')
  await user.click(screen.getByText('What the levels mean'))
  expect(reference).toHaveAttribute('open')
  expect(within(reference as HTMLElement).getByText(/Level 0 does not mean China or North Korea is non-nuclear/i)).toBeVisible()
})
