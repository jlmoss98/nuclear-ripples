import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { App } from './App'
import type { MapGeography } from './ui/PolicyMap'

const mapGeography: MapGeography = {
  type: 'FeatureCollection',
  features: [{
    type: 'Feature',
    properties: { actorId: 'china', name: 'China' },
    geometry: {
      type: 'Polygon',
      coordinates: [[[100, 10], [101, 10], [101, 11], [100, 11], [100, 10]]],
    },
  }],
}

afterEach(() => {
  vi.unstubAllGlobals()
  window.history.replaceState({}, '', '/')
})

it('opens directly on the map and unified controls without a stage transition', () => {
  vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => undefined)))
  render(<App />)

  expect(screen.getByRole('heading', { name: 'Scenario atlas' })).toBeVisible()
  expect(screen.getByRole('heading', { name: 'Nuclear choices' })).toBeVisible()
  expect(screen.getByRole('radiogroup', { name: 'Taiwan Strait' })).toBeVisible()
  expect(screen.queryByRole('button', { name: /Open the policy atlas/i })).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Nuclear choices' })).not.toBeInTheDocument()
})

it('switches to a dark AI mode without showing nuclear controls', async () => {
  const user = userEvent.setup()
  vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => undefined)))
  render(<App />)

  await user.click(screen.getByRole('radio', { name: 'AI' }))

  expect(screen.getByRole('heading', { name: 'AI conditions' })).toBeVisible()
  expect(screen.queryByRole('heading', { name: 'Nuclear choices' })).not.toBeInTheDocument()
  expect(document.querySelector('.app-shell')).toHaveClass('app-shell--ai')
  expect(screen.getByText('Interactive AI evidence layer · July 2026 reference')).toBeVisible()
  expect(screen.getByText('Current modeled AI contributions are zero.')).toBeVisible()
  expect(screen.getByText('AI options remain interactive; current evidence-supported contribution: +0.')).toBeVisible()
})

it('keeps the complete proliferation-risk legend visible in Nuclear and AI modes', async () => {
  const user = userEvent.setup()
  vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => undefined)))
  render(<App />)

  const legend = screen.getByRole('region', { name: 'Proliferation risk' })
  expect(within(legend).getByText('Green · Low')).toBeVisible()
  expect(within(legend).getByText('0–24')).toBeVisible()

  await user.click(screen.getByRole('radio', { name: 'AI' }))

  expect(screen.getByRole('region', { name: 'Proliferation risk' })).toBeVisible()
  expect(document.querySelector('.app-shell')).toHaveClass('app-shell--ai')
})

it('keeps scores unchanged while an AI option is selected', async () => {
  const user = userEvent.setup()
  vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => undefined)))
  render(<App />)

  await user.click(screen.getByRole('radio', { name: 'AI' }))
  await user.click(screen.getAllByRole('radio', { name: 'Selected' })[0])

  expect(screen.getByText(/modeled comparative exposure under the current evidence standard: \+0/i)).toBeVisible()
  expect(screen.getByText(/modeled proliferation pressure under the current evidence standard: \+0/i)).toBeVisible()
})

it('does not add mode switches to undo history and resets AI selections with the mode', async () => {
  const user = userEvent.setup()
  vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => undefined)))
  render(<App />)

  const undo = screen.getByRole('button', { name: 'Undo' })
  await user.click(screen.getByRole('radio', { name: 'AI' }))
  expect(undo).toBeDisabled()

  const missileDefense = screen.getByRole('radiogroup', { name: 'U.S.–Japan–South Korea AI-integrated missile defense' })
  await user.click(within(missileDefense).getByRole('radio', { name: 'Selected' }))
  expect(undo).toBeEnabled()

  await user.click(undo)
  expect(screen.getByRole('radio', { name: 'AI' })).toHaveAttribute('aria-checked', 'true')
  expect(within(missileDefense).getByRole('radio', { name: 'Not selected' })).toHaveAttribute('aria-checked', 'true')
  expect(undo).toBeDisabled()

  await user.click(within(missileDefense).getByRole('radio', { name: 'Selected' }))
  await user.click(screen.getByRole('button', { name: 'Reset' }))
  expect(screen.getByRole('radio', { name: 'Nuclear' })).toHaveAttribute('aria-checked', 'true')
  expect(screen.getByRole('heading', { name: 'Nuclear choices' })).toBeVisible()

  await user.click(screen.getByRole('radio', { name: 'AI' }))
  expect(within(screen.getByRole('radiogroup', { name: 'U.S.–Japan–South Korea AI-integrated missile defense' }))
    .getByRole('radio', { name: 'Not selected' })).toHaveAttribute('aria-checked', 'true')
})

it('keeps AI mode active when undoing a Nuclear edit made before the mode switch', async () => {
  const user = userEvent.setup()
  vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => undefined)))
  render(<App />)

  const chinaPosture = screen.getByRole('radiogroup', { name: 'China nuclear posture' })
  await user.click(within(chinaPosture).getByRole('radio', { name: 'Level 2' }))
  await user.click(screen.getByRole('radio', { name: 'AI' }))
  await user.click(screen.getByRole('button', { name: 'Undo' }))

  expect(screen.getByRole('radio', { name: 'AI' })).toHaveAttribute('aria-checked', 'true')
  expect(screen.getByRole('heading', { name: 'AI conditions' })).toBeVisible()

  await user.click(screen.getByRole('radio', { name: 'Nuclear' }))
  expect(within(screen.getByRole('radiogroup', { name: 'China nuclear posture' }))
    .getByRole('radio', { name: 'July 2026' })).toHaveAttribute('aria-checked', 'true')
})

it('keeps Nuclear mode active when undoing an AI edit made before the mode switch', async () => {
  const user = userEvent.setup()
  vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => undefined)))
  render(<App />)

  await user.click(screen.getByRole('radio', { name: 'AI' }))
  const missileDefense = screen.getByRole('radiogroup', { name: 'U.S.–Japan–South Korea AI-integrated missile defense' })
  await user.click(within(missileDefense).getByRole('radio', { name: 'Selected' }))
  await user.click(screen.getByRole('radio', { name: 'Nuclear' }))
  await user.click(screen.getByRole('button', { name: 'Undo' }))

  expect(screen.getByRole('radio', { name: 'Nuclear' })).toHaveAttribute('aria-checked', 'true')
  expect(screen.getByRole('heading', { name: 'Nuclear choices' })).toBeVisible()

  await user.click(screen.getByRole('radio', { name: 'AI' }))
  expect(within(screen.getByRole('radiogroup', { name: 'U.S.–Japan–South Korea AI-integrated missile defense' }))
    .getByRole('radio', { name: 'Not selected' })).toHaveAttribute('aria-checked', 'true')
})

it('moves focus into an AI explanation drawer and restores the exact invoking zero button', async () => {
  const user = userEvent.setup()
  vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => undefined)))
  render(<App />)

  await user.click(screen.getByRole('radio', { name: 'AI' }))
  await user.click(screen.getByText('Country results table'))
  const zeroButton = screen.getByRole('button', { name: 'Why China has modeled AI exposure plus zero' })

  await user.click(zeroButton)
  expect(screen.getByRole('dialog', { name: 'China' })).toBeVisible()
  expect(screen.getByRole('button', { name: 'Close explanation' })).toHaveFocus()

  await user.keyboard('{Escape}')
  expect(screen.queryByRole('dialog', { name: 'China' })).not.toBeInTheDocument()
  expect(zeroButton).toHaveFocus()

  await user.click(zeroButton)
  await user.click(screen.getByRole('button', { name: 'Close explanation' }))
  expect(screen.queryByRole('dialog', { name: 'China' })).not.toBeInTheDocument()
  expect(zeroButton).toHaveFocus()
})

it('restores focus to the current map actor after a scenario update remounts the map', async () => {
  const user = userEvent.setup()
  vi.stubGlobal('fetch', vi.fn(async () => ({
    ok: true,
    json: async () => mapGeography,
  }) as Response))
  render(<App />)

  const originalChina = await screen.findByRole('button', { name: /^China:/ })
  await user.click(originalChina)
  expect(screen.getByRole('dialog', { name: 'China' })).toBeVisible()

  const taiwanStrait = screen.getByRole('radiogroup', { name: 'Taiwan Strait' })
  await user.click(within(taiwanStrait).getByRole('radio', { name: 'Blockade' }))

  const currentChina = screen.getByRole('button', { name: /^China:/ })
  expect(currentChina).not.toBe(originalChina)
  expect(originalChina.isConnected).toBe(false)

  await user.click(screen.getByRole('button', { name: 'Close explanation' }))

  expect(currentChina).toHaveFocus()
  expect(document.activeElement?.isConnected).toBe(true)
})

it('passes selected crisis controls into a nuclear explanation drawer', async () => {
  const user = userEvent.setup()
  vi.stubGlobal('fetch', vi.fn(async () => ({
    ok: true,
    json: async () => mapGeography,
  }) as Response))
  render(<App />)

  const koreanPeninsula = screen.getByRole('radiogroup', { name: 'Korean Peninsula' })
  await user.click(within(koreanPeninsula).getByRole('radio', { name: 'Major conflict' }))
  await user.click(await screen.findByRole('button', { name: /^China:/ }))

  expect(screen.getByRole('region', { name: 'How nuclear escalation could occur' })).toBeVisible()
})

it('restores focus to the Methodology button after its dialog closes', async () => {
  const user = userEvent.setup()
  vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => undefined)))
  render(<App />)
  const methodologyButton = screen.getByRole('button', { name: 'Methodology' })

  await user.click(methodologyButton)
  expect(screen.getByRole('dialog', { name: 'Methodology' })).toBeVisible()

  await user.click(screen.getByRole('button', { name: 'Close information panel' }))

  expect(screen.queryByRole('dialog', { name: 'Methodology' })).not.toBeInTheDocument()
  expect(methodologyButton).toHaveFocus()
})
