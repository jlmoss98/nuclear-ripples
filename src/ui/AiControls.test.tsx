import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { expect, it, vi } from 'vitest'
import { AI_CONTROL_GROUPS, DEFAULT_AI_CONTROLS } from '../data/aiConditions'
import type { AiControls as AiControlsState } from '../model'
import { AiControls } from './AiControls'

type AiControlChange = <K extends keyof AiControlsState>(key: K, value: AiControlsState[K], label: string) => void

function StatefulAiControls({ onChange }: { onChange?: AiControlChange }) {
  const [controls, setControls] = useState(DEFAULT_AI_CONTROLS)

  return (
    <AiControls
      controls={controls}
      onChange={(key, value, label) => {
        setControls((current) => ({ ...current, [key]: value }))
        onChange?.(key, value, label)
      }}
    />
  )
}

it('only displays an AI selection after its parent applies the new control value', async () => {
  const user = userEvent.setup()
  const onChange = vi.fn()
  const firstControl = AI_CONTROL_GROUPS[0].controls[0]
  render(<AiControls controls={DEFAULT_AI_CONTROLS} onChange={onChange} />)

  const firstControlGroup = screen.getByRole('radiogroup', { name: firstControl.label })
  await user.click(within(firstControlGroup).getByRole('radio', { name: 'Selected' }))

  expect(onChange).toHaveBeenCalledWith(firstControl.key, 'selected', 'Selected')
  expect(within(firstControlGroup).getByRole('radio', { name: 'Not selected' })).toHaveAttribute('aria-checked', 'true')
  expect(screen.queryByText('Why +0?')).not.toBeInTheDocument()
})

it('renders all canonical controls and updates from stateful or replacement parent values', async () => {
  const user = userEvent.setup()
  const firstControl = AI_CONTROL_GROUPS[0].controls[0]
  const usNc3Control = AI_CONTROL_GROUPS[2].controls[0]
  const { rerender } = render(<StatefulAiControls />)

  expect(screen.getByText('Experimental AI layer. These options model hypothetical escalation exposure. They contribute 0 proliferation-pressure points and cannot trigger a modeled nuclear-posture reaction.')).toBeVisible()
  AI_CONTROL_GROUPS.forEach(({ title, controls }) => {
    expect(screen.getByRole('heading', { name: title })).toBeVisible()
    controls.forEach(({ label }) => expect(screen.getByRole('radiogroup', { name: label })).toBeVisible())
  })
  expect(screen.getAllByText('Exact condition not established')).toHaveLength(10)
  expect(screen.getByText('China or North Korea (one target at a time)')).toBeVisible()

  const targetControl = screen.getByRole('radiogroup', { name: usNc3Control.label })
  expect(within(targetControl).getByRole('radio', { name: 'None' })).toBeVisible()
  expect(within(targetControl).getByRole('radio', { name: 'China' })).toBeVisible()
  expect(within(targetControl).getByRole('radio', { name: 'North Korea' })).toBeVisible()

  const firstControlGroup = screen.getByRole('radiogroup', { name: firstControl.label })
  await user.click(within(firstControlGroup).getByRole('radio', { name: 'Selected' }))
  expect(within(firstControlGroup).getByRole('radio', { name: 'Selected' })).toHaveAttribute('aria-checked', 'true')
  expect(screen.getByText('Why +0?')).toBeVisible()

  rerender(<AiControls controls={{ ...DEFAULT_AI_CONTROLS, [firstControl.key]: 'selected' }} onChange={vi.fn()} />)
  expect(within(screen.getByRole('radiogroup', { name: firstControl.label })).getByRole('radio', { name: 'Selected' })).toHaveAttribute('aria-checked', 'true')
  expect(screen.getByText('Why +0?')).toBeVisible()

  rerender(<AiControls controls={DEFAULT_AI_CONTROLS} onChange={vi.fn()} />)
  expect(within(screen.getByRole('radiogroup', { name: firstControl.label })).getByRole('radio', { name: 'Not selected' })).toHaveAttribute('aria-checked', 'true')
  expect(screen.queryByText('Why +0?')).not.toBeInTheDocument()
})

it('renders complete zero-score evidence for every active condition', () => {
  const controls: AiControlsState = {
    alliedMissileDefense: 'selected',
    chinaMissileDefense: 'selected',
    usEarlyWarning: 'selected',
    chinaEarlyWarning: 'selected',
    usNc3CyberTarget: 'china',
    chinaNc3Cyber: 'selected',
    dprkNc3Cyber: 'selected',
    usAutonomousNearChina: 'selected',
    chinaAutonomousNearAllies: 'selected',
    dprkSyntheticDeception: 'selected',
  }
  const { container } = render(<AiControls controls={controls} onChange={vi.fn()} />)
  const evidencePanels = Array.from(container.querySelectorAll<HTMLDetailsElement>('.ai-evidence'))

  expect(evidencePanels).toHaveLength(10)
  evidencePanels.forEach((panel) => {
    expect(panel).toHaveAttribute('open')
    expect(within(panel).getByText(/selected proposed affected countries:/i)).toBeVisible()
    expect(within(panel).getByText(/modeled comparative exposure under the current evidence standard: \+0/i)).toBeVisible()
    expect(within(panel).getByText(/modeled proliferation pressure under the current evidence standard: \+0/i)).toBeVisible()
    expect(within(panel).getAllByRole('link').length).toBeGreaterThan(0)
  })
})
