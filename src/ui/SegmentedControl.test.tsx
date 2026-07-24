import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { SegmentedControl } from './SegmentedControl'

const options = [
  { value: 'first', label: 'First' },
  { value: 'middle', label: 'Middle' },
  { value: 'last', label: 'Last' },
]

it('does not report the already-selected option when it is clicked', async () => {
  const user = userEvent.setup()
  const onChange = vi.fn()
  render(<SegmentedControl label="Example" value="middle" options={options} onChange={onChange} />)

  await user.click(screen.getByRole('radio', { name: 'Middle' }))

  expect(onChange).not.toHaveBeenCalled()
})

it('keeps focus at the selected first option without reporting Home as a change', async () => {
  const user = userEvent.setup()
  const onChange = vi.fn()
  render(<SegmentedControl label="Example" value="first" options={options} onChange={onChange} />)
  const first = screen.getByRole('radio', { name: 'First' })

  first.focus()
  await user.keyboard('{Home}')

  expect(onChange).not.toHaveBeenCalled()
  expect(first).toHaveFocus()
})

it('keeps focus at the selected last option without reporting End as a change', async () => {
  const user = userEvent.setup()
  const onChange = vi.fn()
  render(<SegmentedControl label="Example" value="last" options={options} onChange={onChange} />)
  const last = screen.getByRole('radio', { name: 'Last' })

  last.focus()
  await user.keyboard('{End}')

  expect(onChange).not.toHaveBeenCalled()
  expect(last).toHaveFocus()
})

it('reports a different option once and moves keyboard focus to it', async () => {
  const user = userEvent.setup()
  const onChange = vi.fn()
  render(<SegmentedControl label="Example" value="middle" options={options} onChange={onChange} />)
  const middle = screen.getByRole('radio', { name: 'Middle' })
  const last = screen.getByRole('radio', { name: 'Last' })

  await user.click(screen.getByRole('radio', { name: 'First' }))
  expect(onChange).toHaveBeenCalledTimes(1)
  expect(onChange).toHaveBeenLastCalledWith('first', 'First')

  onChange.mockClear()
  middle.focus()
  await user.keyboard('{End}')

  expect(onChange).toHaveBeenCalledTimes(1)
  expect(onChange).toHaveBeenLastCalledWith('last', 'Last')
  expect(last).toHaveFocus()
})
