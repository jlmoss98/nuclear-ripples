import { fireEvent, render, screen } from '@testing-library/react'
import type { Feature, FeatureCollection, Polygon } from 'geojson'
import { expect, it, vi } from 'vitest'
import { DEFAULT_SCENARIO, REGIONAL_ACTOR_IDS, evaluateScenario, type ActorId } from '../model'
import { PolicyMap } from './PolicyMap'

const square = (actorId: ActorId, offset: number): Feature<Polygon, { actorId: ActorId; name: string }> => ({
  type: 'Feature',
  properties: { actorId, name: actorId },
  geometry: { type: 'Polygon', coordinates: [[[100 + offset, 10], [101 + offset, 10], [101 + offset, 11], [100 + offset, 11], [100 + offset, 10]]] },
})

const geography: FeatureCollection<Polygon, { actorId: ActorId; name: string }> = {
  type: 'FeatureCollection',
  features: [...REGIONAL_ACTOR_IDS.map((actor, index) => square(actor, index)), square('united-states', -200)],
}

it('renders every scoped actor and an accessible United States inset', () => {
  render(<PolicyMap geography={geography} scenario={DEFAULT_SCENARIO} result={evaluateScenario(DEFAULT_SCENARIO)} reducedMotion />)

  expect(screen.getByRole('region', { name: /comparative escalation exposure map/i })).toBeInTheDocument()
  expect(document.querySelectorAll('[data-actor]')).toHaveLength(18)
  const inset = screen.getByLabelText(/United States strategic inset/i)
  expect(inset).toBeInTheDocument()
  const usaPath = inset.querySelector('path')
  const coordinates = usaPath?.getAttribute('d')?.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? []
  const xCoordinates = coordinates.filter((_, index) => index % 2 === 0)
  const yCoordinates = coordinates.filter((_, index) => index % 2 === 1)
  expect(Math.min(...xCoordinates)).toBeGreaterThanOrEqual(29)
  expect(Math.max(...xCoordinates)).toBeLessThanOrEqual(171)
  expect(Math.min(...yCoordinates)).toBeGreaterThanOrEqual(49)
  expect(Math.max(...yCoordinates)).toBeLessThanOrEqual(131)
  expect(usaPath).not.toHaveAttribute('tabindex')
  expect(document.querySelectorAll('.ripple')).toHaveLength(0)
})

it('positions the compact risk legend away from dense South Korea annotation stacks', () => {
  render(<PolicyMap geography={geography} scenario={DEFAULT_SCENARIO} result={evaluateScenario(DEFAULT_SCENARIO)} reducedMotion />)

  expect(screen.getByLabelText('Risk legend')).toHaveAttribute('transform', 'translate(18 552)')
})

it('renders separate first and second ripples when an actor is affected in both waves', () => {
  const scenario = {
    ...DEFAULT_SCENARIO,
    postures: { ...DEFAULT_SCENARIO.postures, 'south-korea': 2 as const },
    controls: { ...DEFAULT_SCENARIO.controls, assurance: 'questioned' as const },
  }
  const result = evaluateScenario(scenario)
  render(<PolicyMap geography={geography} scenario={scenario} result={result} reducedMotion={false} />)

  expect(document.querySelectorAll('[data-ripple-actor="china"]')).toHaveLength(2)
  expect(document.querySelector('[data-ripple-actor="china"].ripple--direct')).toBeInTheDocument()
  expect(document.querySelector('[data-ripple-actor="china"].ripple--second-order')).toBeInTheDocument()
})

it('renders three solid warheads for a selected South Korean Level 2 posture', () => {
  const scenario = { ...DEFAULT_SCENARIO, postures: { ...DEFAULT_SCENARIO.postures, 'south-korea': 2 as const } }
  render(<PolicyMap geography={geography} scenario={scenario} result={evaluateScenario(scenario)} reducedMotion />)

  const stack = screen.getByRole('button', { name: 'South Korea: selected nuclear posture Level 2' })
  expect(stack.querySelectorAll('[data-glyph="warhead"]')).toHaveLength(3)
  expect(stack.querySelectorAll('.map-glyph--selected')).toHaveLength(3)
})

it('shows an outlined predicted Japanese posture even when motion is reduced', () => {
  const scenario = {
    ...DEFAULT_SCENARIO,
    postures: { ...DEFAULT_SCENARIO.postures, 'south-korea': 2 as const },
    controls: { ...DEFAULT_SCENARIO.controls, assurance: 'questioned' as const },
  }
  render(<PolicyMap geography={geography} scenario={scenario} result={evaluateScenario(scenario)} reducedMotion />)

  const stack = screen.getByRole('button', { name: 'Japan: predicted nuclear posture Level 1' })
  expect(stack.querySelectorAll('[data-glyph="warhead"]')).toHaveLength(1)
  expect(stack.querySelector('.map-glyph--predicted')).toBeInTheDocument()
})

it('explains that symbol counts are qualitative rather than literal equipment totals', () => {
  render(<PolicyMap geography={geography} scenario={DEFAULT_SCENARIO} result={evaluateScenario(DEFAULT_SCENARIO)} reducedMotion />)
  expect(screen.getByText(/Counts show qualitative intensity, not literal equipment totals/i)).toBeInTheDocument()
})

it('keeps informational scenario annotations labeled without exposing them as controls', () => {
  const scenario = {
    ...DEFAULT_SCENARIO,
    postures: { ...DEFAULT_SCENARIO.postures, 'united-states': 'expanded' as const },
    controls: {
      ...DEFAULT_SCENARIO.controls,
      conventionalPresence: 'expanded' as const,
      aseanCohesion: 'broken' as const,
    },
  }
  const onSelectActor = vi.fn()
  render(
    <PolicyMap
      geography={geography}
      scenario={scenario}
      result={evaluateScenario(scenario)}
      reducedMotion
      onSelectActor={onSelectActor}
    />,
  )

  const informationalAnnotations = [
    ['posture-united-states-expanded', 'United States: expanded theater nuclear posture'],
    ['conventionalPresence-expanded', 'United States: expanded conventional force presence'],
    ['aseanCohesion-broken', 'ASEAN nuclear-free-zone cohesion: broken'],
  ] as const

  for (const [id, label] of informationalAnnotations) {
    const annotation = document.querySelector(`[data-annotation="${id}"]`)
    expect(annotation).toBeInTheDocument()
    expect(annotation?.querySelector('title')).toHaveTextContent(label)
    expect(annotation).not.toHaveAttribute('role')
    expect(annotation).not.toHaveAttribute('tabindex')
    expect(annotation).not.toHaveAttribute('aria-label')
    expect(annotation?.querySelector('[data-testid="annotation-hit-target"]')).not.toBeInTheDocument()
    expect(fireEvent.keyDown(annotation!, { key: 'Enter' })).toBe(true)
    fireEvent.click(annotation!)
  }

  expect(onSelectActor).not.toHaveBeenCalled()
})

it('keeps actor-linked Taiwan crisis annotations operable as buttons', () => {
  const scenario = {
    ...DEFAULT_SCENARIO,
    controls: { ...DEFAULT_SCENARIO.controls, taiwanCrisis: 'blockade' as const },
  }
  const onSelectActor = vi.fn()
  render(
    <PolicyMap
      geography={geography}
      scenario={scenario}
      result={evaluateScenario(scenario)}
      reducedMotion
      onSelectActor={onSelectActor}
    />,
  )

  const annotation = screen.getByRole('button', { name: 'Taiwan: blockade scenario' })
  expect(annotation).toHaveAttribute('tabindex', '0')

  fireEvent.click(annotation)
  expect(onSelectActor).toHaveBeenLastCalledWith('taiwan', annotation)

  fireEvent.keyDown(annotation, { key: 'Enter' })
  expect(onSelectActor).toHaveBeenCalledTimes(2)
  expect(onSelectActor).toHaveBeenLastCalledWith('taiwan', annotation)
})

it('gives actor-linked annotations a centered nonvisual pointer target at least 52 by 44 SVG units', () => {
  const scenario = {
    ...DEFAULT_SCENARIO,
    controls: { ...DEFAULT_SCENARIO.controls, taiwanCrisis: 'blockade' as const },
  }
  render(
    <PolicyMap
      geography={geography}
      scenario={scenario}
      result={evaluateScenario(scenario)}
      reducedMotion
    />,
  )

  const annotation = screen.getByRole('button', { name: 'Taiwan: blockade scenario' })
  const hitTarget = annotation.querySelector<SVGRectElement>('[data-testid="annotation-hit-target"]')
  const plate = annotation.querySelector<SVGRectElement>('.annotation-plate')
  const glyph = annotation.querySelector('[data-glyph]')

  expect(hitTarget).toBeInTheDocument()
  expect(Number(hitTarget?.getAttribute('width'))).toBeGreaterThanOrEqual(52)
  expect(Number(hitTarget?.getAttribute('height'))).toBeGreaterThanOrEqual(44)
  expect(hitTarget).toHaveAttribute('fill', 'transparent')
  expect(Number(hitTarget?.getAttribute('x')) + Number(hitTarget?.getAttribute('width')) / 2)
    .toBe(Number(plate?.getAttribute('x')) + Number(plate?.getAttribute('width')) / 2)
  expect(Number(hitTarget?.getAttribute('y')) + Number(hitTarget?.getAttribute('height')) / 2)
    .toBe(Number(plate?.getAttribute('y')) + Number(plate?.getAttribute('height')) / 2)
  expect(hitTarget!.compareDocumentPosition(glyph!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
})

it('keeps adjacent South Korea actor-linked targets from overlapping', () => {
  const scenario = {
    ...DEFAULT_SCENARIO,
    controls: {
      ...DEFAULT_SCENARIO.controls,
      koreanCrisis: 'limited' as const,
      assurance: 'questioned' as const,
    },
  }
  render(
    <PolicyMap
      geography={geography}
      scenario={scenario}
      result={evaluateScenario(scenario)}
      reducedMotion
    />,
  )

  const crisis = screen.getByRole('button', { name: 'Korean Peninsula: limited clash scenario' })
  const assurance = screen.getByRole('button', { name: 'South Korea: U.S. assurance questioned' })
  const translationY = (annotation: Element) => {
    const translation = annotation.getAttribute('transform')?.match(/^translate\([^ ]+ ([^)]+)\)$/)
    expect(translation).not.toBeNull()
    return Number(translation?.[1])
  }

  expect(Math.abs(translationY(assurance) - translationY(crisis))).toBeGreaterThanOrEqual(44)
})

it('keeps every target in a dense AI and nuclear stack inside the map viewBox', () => {
  const scenario = {
    ...DEFAULT_SCENARIO,
    mode: 'ai' as const,
    postures: { ...DEFAULT_SCENARIO.postures, 'south-korea': 1 as const },
    controls: {
      ...DEFAULT_SCENARIO.controls,
      koreanCrisis: 'major' as const,
      assurance: 'withdrawn' as const,
      rokMissileDefense: 2 as const,
      rokDomestic: 'support' as const,
    },
    ai: {
      ...DEFAULT_SCENARIO.ai,
      chinaMissileDefense: 'selected' as const,
      chinaEarlyWarning: 'selected' as const,
      chinaNc3Cyber: 'selected' as const,
      dprkNc3Cyber: 'selected' as const,
      chinaAutonomousNearAllies: 'selected' as const,
      dprkSyntheticDeception: 'selected' as const,
    },
  }
  render(
    <PolicyMap
      geography={geography}
      scenario={scenario}
      result={evaluateScenario(scenario)}
      reducedMotion
    />,
  )

  const hitTargets = Array.from(document.querySelectorAll<SVGRectElement>('[data-testid="annotation-hit-target"]'))
  expect(hitTargets.length).toBeGreaterThan(0)

  for (const hitTarget of hitTargets) {
    const translation = hitTarget.parentElement?.getAttribute('transform')?.match(/^translate\([^ ]+ ([^)]+)\)$/)
    expect(translation).not.toBeNull()
    const top = Number(translation?.[1]) + Number(hitTarget.getAttribute('y'))
    const bottom = top + Number(hitTarget.getAttribute('height'))
    expect(top).toBeGreaterThanOrEqual(0)
    expect(bottom).toBeLessThanOrEqual(600)
  }
})

it('identifies selected AI assessments as non-scoring circuit symbols without adding ripples', () => {
  const scenario = {
    ...DEFAULT_SCENARIO,
    mode: 'ai' as const,
    ai: { ...DEFAULT_SCENARIO.ai, dprkNc3Cyber: 'selected' as const },
  }
  render(<PolicyMap geography={geography} scenario={scenario} result={evaluateScenario(scenario)} reducedMotion={false} />)

  expect(screen.getByText('Circuit symbols = selected AI evidence assessments · no score change.')).toBeInTheDocument()
  expect(screen.getByRole('region', { name: /comparative escalation exposure map/i })).toHaveAccessibleDescription(/circuit symbols are selected zero-score evidence assessments/i)
  expect(document.querySelectorAll('[data-glyph="circuit"]')).toHaveLength(2)
  expect(document.querySelectorAll('.ripple')).toHaveLength(0)
})

it('keeps nuclear ripples visible in AI mode without adding ripples for AI assessments', () => {
  const nuclearInputs = {
    postures: { ...DEFAULT_SCENARIO.postures, 'south-korea': 2 as const },
    controls: { ...DEFAULT_SCENARIO.controls, assurance: 'questioned' as const },
  }
  const withAi = {
    ...DEFAULT_SCENARIO,
    ...nuclearInputs,
    mode: 'ai' as const,
    ai: { ...DEFAULT_SCENARIO.ai, dprkNc3Cyber: 'selected' as const },
  }
  const withoutAi = {
    ...withAi,
    ai: DEFAULT_SCENARIO.ai,
  }
  const { rerender } = render(<PolicyMap geography={geography} scenario={withAi} result={evaluateScenario(withAi)} reducedMotion={false} />)

  const rippleCount = document.querySelectorAll('.ripple').length
  expect(rippleCount).toBeGreaterThan(0)
  expect(document.querySelectorAll('[data-glyph="circuit"]')).toHaveLength(2)

  rerender(<PolicyMap geography={geography} scenario={withoutAi} result={evaluateScenario(withoutAi)} reducedMotion={false} />)

  expect(document.querySelectorAll('.ripple')).toHaveLength(rippleCount)
  expect(document.querySelectorAll('[data-glyph="circuit"]')).toHaveLength(0)
})

it('defines four distinct AI band patterns and omits them from Nuclear mode', () => {
  const aiScenario = { ...DEFAULT_SCENARIO, mode: 'ai' as const }
  const { rerender } = render(
    <PolicyMap geography={geography} scenario={aiScenario} result={evaluateScenario(aiScenario)} reducedMotion />,
  )

  const patterns = Array.from(document.querySelectorAll<SVGPatternElement>('pattern[data-ai-band]'))
  expect(patterns).toHaveLength(4)
  expect(new Set(patterns.map((pattern) => pattern.id))).toEqual(new Set([
    'ai-band-low',
    'ai-band-guarded',
    'ai-band-high',
    'ai-band-critical',
  ]))
  expect(new Set(patterns.map((pattern) => pattern.dataset.patternGeometry)).size).toBe(4)

  rerender(
    <PolicyMap geography={geography} scenario={DEFAULT_SCENARIO} result={evaluateScenario(DEFAULT_SCENARIO)} reducedMotion />,
  )
  expect(document.querySelectorAll('pattern[data-ai-band]')).toHaveLength(0)
})
