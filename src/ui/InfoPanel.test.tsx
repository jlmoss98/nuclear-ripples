import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { InfoPanel } from './InfoPanel'

function PanelFixture({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      <button type="button">Open information</button>
      {open && <InfoPanel view="methodology" onClose={onClose} />}
    </>
  )
}

it('moves focus from the opener to the close button when mounted', () => {
  const onClose = vi.fn()
  const { rerender } = render(<PanelFixture open={false} onClose={onClose} />)
  const opener = screen.getByRole('button', { name: 'Open information' })
  opener.focus()

  rerender(<PanelFixture open onClose={onClose} />)

  expect(screen.getByRole('button', { name: 'Close information panel' })).toHaveFocus()
})

it('requests close when Escape is pressed', async () => {
  const user = userEvent.setup()
  const onClose = vi.fn()
  render(<InfoPanel view="methodology" onClose={onClose} />)

  await user.keyboard('{Escape}')

  expect(onClose).toHaveBeenCalledOnce()
})

it('wraps Tab and Shift+Tab within the dialog', async () => {
  const user = userEvent.setup()
  render(
    <>
      <button type="button">Before dialog</button>
      <InfoPanel view="sources" onClose={vi.fn()} />
      <button type="button">After dialog</button>
    </>,
  )
  const closeButton = screen.getByRole('button', { name: 'Close information panel' })
  const links = screen.getAllByRole('link')
  const lastLink = links.at(-1)
  expect(lastLink).toBeDefined()

  lastLink!.focus()
  await user.tab()
  expect(closeButton).toHaveFocus()

  closeButton.focus()
  await user.tab({ shift: true })
  expect(lastLink).toHaveFocus()
})

it('identifies the language of bibliography entries before users open them', () => {
  render(<InfoPanel view="sources" onClose={vi.fn()} />)

  expect(screen.getByRole('link', { name: '新时代的中国军控、裁军与防扩散' })).toBeVisible()
  expect(screen.getAllByText('中文').length).toBeGreaterThanOrEqual(2)
  expect(screen.getAllByText('日本語').length).toBeGreaterThanOrEqual(1)
  expect(screen.getByRole('link', { name: '2022 Defense White Paper' }).closest('li')).toHaveTextContent(/Republic of Korea Ministry of National Defense, 2022 · English/i)
})

it('separates active evidence from background and explains review status', () => {
  render(<InfoPanel view="sources" onClose={vi.fn()} />)

  expect(screen.getByRole('heading', { name: 'Active evidence' })).toBeVisible()
  expect(screen.queryByRole('heading', { name: 'Full text available for review' })).not.toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Background or unavailable' })).toBeVisible()
  expect(screen.getAllByText('Full text reviewed').length).toBeGreaterThan(0)
  expect(screen.getAllByText('Relevant sections reviewed').length).toBeGreaterThan(0)
  expect(screen.getByRole('link', { name: 'Why Japan and South Korea Won’t Go Nuclear' }).closest('li'))
    .toHaveTextContent('Author reviewed')
  expect(screen.getByRole('link', { name: 'Wargaming Nuclear Deterrence and Its Failures in a U.S.–China Conflict over Taiwan' }).closest('li'))
    .toHaveTextContent('Full text reviewed')
})

it('explains that score increments are qualitative choices', () => {
  render(<InfoPanel view="methodology" onClose={vi.fn()} />)
  expect(screen.getByText(/increments are qualitative scenario-design choices/i)).toBeVisible()
  expect(screen.getByText(/not empirically estimated effect sizes/i)).toBeVisible()
})

it('separates fully reviewed AI assessments from scored nuclear evidence', () => {
  render(<InfoPanel view="sources" onClose={vi.fn()} />)

  expect(screen.getByRole('heading', { name: 'AI layer evidence' })).toBeVisible()
  expect(screen.getByRole('link', { name: 'Artificial Intelligence, Strategic Stability and Nuclear Risk' })).toBeVisible()
  expect(screen.getByText(/does not mean the source itself measured a zero effect/i)).toBeVisible()
})

it('explains the four-part AI evidence gate', () => {
  render(<InfoPanel view="methodology" onClose={vi.fn()} />)

  expect(screen.getByRole('heading', { name: 'How AI conditions are scored' })).toBeVisible()
  expect(screen.getByText(/actor is developing or deploying the exact application/i)).toBeVisible()
  expect(screen.getByText(/all current AI contributions are zero/i)).toBeVisible()
})
