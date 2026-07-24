import { render, screen, within } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { DEFAULT_SCENARIO } from '../model/constants'
import { evaluateScenario } from '../model/engine'
import { ExplanationDrawer } from './ExplanationDrawer'

it('shows review provenance only for eligible causal-trace sources', () => {
  const scenario = {
    ...DEFAULT_SCENARIO,
    controls: { ...DEFAULT_SCENARIO.controls, chinaDoctrine: 'launch-on-warning' as const },
  }
  const result = evaluateScenario(scenario)

  render(<ExplanationDrawer actor="china" mode="nuclear" controls={scenario.controls} result={result} onClose={vi.fn()} />)

  const cmprLink = screen.getByRole('link', { name: 'Military and Security Developments Involving the People’s Republic of China 2025' })
  const cmprItem = cmprLink.closest('li')
  expect(cmprItem).not.toBeNull()
  expect(within(cmprItem!).getByText('Full text reviewed')).toBeInTheDocument()
  expect(screen.queryByText('Could not access')).not.toBeInTheDocument()
})

it('groups multiple direct effects before modeled reactions', () => {
  const result = evaluateScenario({
    ...DEFAULT_SCENARIO,
    postures: {
      ...DEFAULT_SCENARIO.postures,
      'north-korea': 2,
      'south-korea': 2,
    },
  })

  render(<ExplanationDrawer actor="china" mode="nuclear" controls={DEFAULT_SCENARIO.controls} result={result} onClose={vi.fn()} />)

  const directGroup = screen.getByRole('region', { name: 'First ripple — direct effects' })
  const reactionGroup = screen.getByRole('region', { name: 'Second ripple — modeled reactions' })

  expect(screen.getAllByRole('heading', { name: 'First ripple — direct effects' })).toHaveLength(1)
  expect(screen.getAllByRole('heading', { name: 'Second ripple — modeled reactions' })).toHaveLength(1)
  expect(within(directGroup).getByText(/North Korean nuclear posture level 2/)).toBeInTheDocument()
  expect(within(directGroup).getByText(/South Korean nuclear posture level 2/)).toBeInTheDocument()
  expect(within(directGroup).queryByText(/Japanese nuclear posture level 1/)).not.toBeInTheDocument()
  expect(within(reactionGroup).getByText(/Japanese nuclear posture level 1/)).toBeInTheDocument()
})

it('omits ripple headings for empty groups', () => {
  const directOnly = evaluateScenario({
    ...DEFAULT_SCENARIO,
    postures: { ...DEFAULT_SCENARIO.postures, 'north-korea': 1 },
  })
  const { rerender } = render(<ExplanationDrawer actor="china" mode="nuclear" controls={DEFAULT_SCENARIO.controls} result={directOnly} onClose={vi.fn()} />)

  expect(screen.getByRole('heading', { name: 'First ripple — direct effects' })).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'Second ripple — modeled reactions' })).not.toBeInTheDocument()

  rerender(<ExplanationDrawer actor="china" mode="nuclear" controls={DEFAULT_SCENARIO.controls} result={evaluateScenario(DEFAULT_SCENARIO)} onClose={vi.fn()} />)

  expect(screen.queryByRole('heading', { name: 'First ripple — direct effects' })).not.toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'Second ripple — modeled reactions' })).not.toBeInTheDocument()
  expect(screen.getByText('The current scenario does not trigger a modeled relationship for this actor.')).toBeInTheDocument()
})

it('cites the literature behind each selected zero AI contribution', () => {
  const scenario = {
    ...DEFAULT_SCENARIO,
    mode: 'ai' as const,
    ai: { ...DEFAULT_SCENARIO.ai, dprkNc3Cyber: 'selected' as const },
  }
  render(<ExplanationDrawer actor="south-korea" mode="ai" controls={scenario.controls} result={evaluateScenario(scenario)} onClose={vi.fn()} />)

  expect(screen.getByRole('heading', { name: 'AI layer — hypothetical exposure' })).toBeVisible()
  expect(screen.getByText(/modeled comparative exposure.*\+0/i)).toBeVisible()
  expect(screen.getByText(/modeled proliferation pressure.*\+0/i)).toBeVisible()
  expect(screen.getByRole('link', { name: 'Disrupting Malicious Uses of Our Models: An Update' })).toBeVisible()
  expect(screen.getByText(/no reviewed source establishes NC3 targeting/i)).toBeVisible()
})

it('explains a zero AI contribution when no selected assessment applies to the country', () => {
  const scenario = {
    ...DEFAULT_SCENARIO,
    mode: 'ai' as const,
    ai: { ...DEFAULT_SCENARIO.ai, dprkNc3Cyber: 'selected' as const },
  }
  render(<ExplanationDrawer actor="china" mode="ai" controls={scenario.controls} result={evaluateScenario(scenario)} onClose={vi.fn()} />)

  expect(screen.getByText('No selected AI assessment identifies this country as a proposed affected actor. Modeled AI exposure: +0. Modeled AI proliferation pressure: +0.')).toBeVisible()
})

it('separates AI confidence from underlying nuclear confidence and citations', () => {
  const scenario = {
    ...DEFAULT_SCENARIO,
    mode: 'ai' as const,
    controls: { ...DEFAULT_SCENARIO.controls, chinaDoctrine: 'launch-on-warning' as const },
    ai: { ...DEFAULT_SCENARIO.ai, dprkNc3Cyber: 'selected' as const },
  }
  render(<ExplanationDrawer actor="south-korea" mode="ai" controls={scenario.controls} result={evaluateScenario(scenario)} onClose={vi.fn()} />)

  const aiConfidence = screen.getByRole('region', { name: 'AI assessment confidence' })
  const nuclearEvidence = screen.getByRole('region', { name: 'Underlying nuclear confidence and evidence' })

  expect(within(aiConfidence).getByText(/Speculative describes the proposed escalation mechanism/)).toBeVisible()
  expect(within(nuclearEvidence).getByText(/Medium-low.*Confidence describes the evidence behind each relationship/)).toBeVisible()
  expect(within(nuclearEvidence).getByRole('link', { name: 'Military and Security Developments Involving the People’s Republic of China 2025' })).toBeVisible()
  expect(within(aiConfidence).queryByRole('link')).not.toBeInTheDocument()
})

it('shows cited Korean escalation pathways only for a major crisis', () => {
  const majorScenario = {
    ...DEFAULT_SCENARIO,
    controls: { ...DEFAULT_SCENARIO.controls, koreanCrisis: 'major' as const },
  }
  const { rerender } = render(
    <ExplanationDrawer actor="china" mode="nuclear" controls={majorScenario.controls} result={evaluateScenario(majorScenario)} onClose={vi.fn()} />,
  )

  const pathways = screen.getByRole('region', { name: 'How nuclear escalation could occur' })
  expect(within(pathways).getByText('Nautilus identifies false warning or mistake, delegated or unauthorized action, command-and-control loss, lower-level error, and deliberate escalation as distinct pathways. They are prevention-oriented cases, not separately scored outcomes.')).toBeVisible()
  expect(within(pathways).getByRole('link', { name: 'Nuclear-Use Cases for Contemplating Crisis and Conflict on the Korean Peninsula' })).toBeVisible()

  const limitedScenario = {
    ...DEFAULT_SCENARIO,
    controls: { ...DEFAULT_SCENARIO.controls, koreanCrisis: 'limited' as const },
  }
  rerender(<ExplanationDrawer actor="china" mode="nuclear" controls={limitedScenario.controls} result={evaluateScenario(limitedScenario)} onClose={vi.fn()} />)

  expect(screen.queryByRole('region', { name: 'How nuclear escalation could occur' })).not.toBeInTheDocument()
})

it('shows cited low-yield availability only when it is selected for open conflict', () => {
  const availableScenario = {
    ...DEFAULT_SCENARIO,
    controls: {
      ...DEFAULT_SCENARIO.controls,
      taiwanCrisis: 'open-conflict' as const,
      chinaLowYieldOptions: 'available' as const,
    },
  }
  const { rerender } = render(
    <ExplanationDrawer actor="china" mode="nuclear" controls={availableScenario.controls} result={evaluateScenario(availableScenario)} onClose={vi.fn()} />,
  )

  const lowYield = screen.getByRole('region', { name: 'Low-yield availability — informational only' })
  expect(within(lowYield).getByText('The CSIS–MIT games indicate that lower-yield availability can shape weapon choice and concepts of limited use, but did not establish a reliable increase in first-use propensity. This selection changes no score or proliferation pressure.')).toBeVisible()
  expect(within(lowYield).getByRole('link', { name: 'Wargaming Nuclear Deterrence and Its Failures in a U.S.–China Conflict over Taiwan' })).toBeVisible()

  const unspecifiedScenario = {
    ...availableScenario,
    controls: { ...availableScenario.controls, chinaLowYieldOptions: 'not-specified' as const },
  }
  rerender(<ExplanationDrawer actor="china" mode="nuclear" controls={unspecifiedScenario.controls} result={evaluateScenario(unspecifiedScenario)} onClose={vi.fn()} />)

  expect(screen.queryByRole('region', { name: 'Low-yield availability — informational only' })).not.toBeInTheDocument()
})
