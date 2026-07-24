import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { ShareMenu } from './ShareMenu'

const scenarioUrl = 'https://example.test/atlas?cn=2&tw=blockade'

afterEach(() => vi.restoreAllMocks())

it('opens an accessible panel with the approved share destinations', async () => {
  const user = userEvent.setup()
  render(<ShareMenu url={scenarioUrl} />)

  const trigger = screen.getByRole('button', { name: 'Share scenario' })
  await user.click(trigger)

  expect(trigger).toHaveAttribute('aria-expanded', 'true')
  expect(screen.getByRole('dialog', { name: 'Share this scenario' })).toBeInTheDocument()
  expect(screen.getByRole('textbox', { name: 'Shareable scenario link' })).toHaveValue(scenarioUrl)

  const bluesky = screen.getByRole('link', { name: 'Share on Bluesky' })
  const linkedIn = screen.getByRole('link', { name: 'Share on LinkedIn' })
  const email = screen.getByRole('link', { name: 'Share by Email' })

  expect(new URL(bluesky.getAttribute('href')!).searchParams.get('text')).toContain(scenarioUrl)
  expect(new URL(linkedIn.getAttribute('href')!).searchParams.get('url')).toBe(scenarioUrl)
  expect(decodeURIComponent(email.getAttribute('href')!)).toContain(scenarioUrl)
  expect(screen.queryByRole('link', { name: /X|Facebook/i })).not.toBeInTheDocument()

  await user.keyboard('{Escape}')
  expect(screen.queryByRole('dialog', { name: 'Share this scenario' })).not.toBeInTheDocument()
  expect(trigger).toHaveFocus()
})

it('shows visible success after copying the scenario link', async () => {
  const user = userEvent.setup()
  const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)
  render(<ShareMenu url={scenarioUrl} />)

  await user.click(screen.getByRole('button', { name: 'Share scenario' }))
  await user.click(screen.getByRole('button', { name: 'Copy link' }))

  expect(writeText).toHaveBeenCalledWith(scenarioUrl)
  expect(screen.getByRole('button', { name: 'Copied!' })).toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent('Scenario link copied.')
})

it('keeps the URL available when automatic copying fails', async () => {
  const user = userEvent.setup()
  vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('Clipboard unavailable'))
  render(<ShareMenu url={scenarioUrl} />)

  await user.click(screen.getByRole('button', { name: 'Share scenario' }))
  await user.click(screen.getByRole('button', { name: 'Copy link' }))

  expect(screen.getByRole('textbox', { name: 'Shareable scenario link' })).toHaveValue(scenarioUrl)
  expect(screen.getByRole('status')).toHaveTextContent('Copy didn’t work automatically. Select and copy the link above.')
})

it('closes when the user clicks outside the panel', async () => {
  const user = userEvent.setup()
  render(<><button type="button">Outside</button><ShareMenu url={scenarioUrl} /></>)

  await user.click(screen.getByRole('button', { name: 'Share scenario' }))
  await user.click(screen.getByRole('button', { name: 'Outside' }))

  expect(screen.queryByRole('dialog', { name: 'Share this scenario' })).not.toBeInTheDocument()
})
