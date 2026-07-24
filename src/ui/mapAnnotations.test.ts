import { describe, expect, it } from 'vitest'
import { DEFAULT_SCENARIO, evaluateScenario, type ScenarioInput } from '../model'
import { buildMapAnnotations } from './mapAnnotations'

const annotate = (scenario: ScenarioInput) => buildMapAnnotations(scenario, evaluateScenario(scenario))

describe('buildMapAnnotations', () => {
  it.each([[1, 1], [2, 3]] as const)('maps a selected Japanese Level %s posture to %s solid warhead icon(s)', (level, count) => {
    const scenario = { ...DEFAULT_SCENARIO, postures: { ...DEFAULT_SCENARIO.postures, japan: level } }
    expect(annotate(scenario)).toContainEqual(expect.objectContaining({
      id: `posture-japan-selected-${level}`,
      actor: 'japan',
      kind: 'warhead',
      count,
      variant: 'selected',
    }))
  })

  it('separates a predicted Japanese reaction from South Korea’s selected Level 2 posture', () => {
    const scenario = {
      ...DEFAULT_SCENARIO,
      postures: { ...DEFAULT_SCENARIO.postures, 'south-korea': 2 as const },
      controls: { ...DEFAULT_SCENARIO.controls, assurance: 'questioned' as const },
    }
    expect(annotate(scenario)).toContainEqual(expect.objectContaining({
      id: 'posture-japan-predicted-1',
      actor: 'japan',
      kind: 'warhead',
      count: 1,
      variant: 'predicted',
    }))
  })

  it.each([
    ['rokMissileDefense', 1, 'radar', 1],
    ['rokMissileDefense', 2, 'radar', 3],
    ['japanCounterstrike', 1, 'missile', 1],
    ['japanCounterstrike', 2, 'missile', 3],
  ] as const)('maps %s Level %s to the expected capability symbol', (key, value, kind, count) => {
    const scenario = { ...DEFAULT_SCENARIO, controls: { ...DEFAULT_SCENARIO.controls, [key]: value } }
    expect(annotate(scenario)).toContainEqual(expect.objectContaining({ id: `${key}-${value}`, kind, count }))
  })

  it.each([
    ['reduced', 1, 'negative'],
    ['expanded', 3, 'positive'],
  ] as const)('maps %s conventional presence to a distinct warship annotation', (value, count, variant) => {
    const scenario = { ...DEFAULT_SCENARIO, controls: { ...DEFAULT_SCENARIO.controls, conventionalPresence: value } }
    expect(annotate(scenario)).toContainEqual(expect.objectContaining({
      id: `conventionalPresence-${value}`,
      kind: 'warship',
      count,
      variant,
    }))
  })

  it.each([
    ['taiwanCrisis', 'blockade'], ['taiwanCrisis', 'open-conflict'],
    ['koreanCrisis', 'limited'], ['koreanCrisis', 'major'],
    ['assurance', 'strengthened'], ['assurance', 'questioned'], ['assurance', 'withdrawn'],
    ['japanRokCooperation', 'degraded'], ['japanRokCooperation', 'integrated'],
    ['chinaDoctrine', 'launch-on-warning'], ['chinaDoctrine', 'first-use-ambiguity'],
    ['aseanCohesion', 'weakened'], ['aseanCohesion', 'broken'],
    ['rokDomestic', 'review'], ['rokDomestic', 'support'],
    ['japanDomestic', 'review'], ['japanDomestic', 'support'],
  ] as const)('creates a presentation annotation for %s=%s', (key, value) => {
    const scenario = { ...DEFAULT_SCENARIO, controls: { ...DEFAULT_SCENARIO.controls, [key]: value } } as ScenarioInput
    expect(annotate(scenario).some((annotation) => annotation.id.startsWith(`${key}-`))).toBe(true)
  })

  it('names the open-conflict outcome while retaining the conflict glyph and count', () => {
    const offRampScenario = {
      ...DEFAULT_SCENARIO,
      controls: {
        ...DEFAULT_SCENARIO.controls,
        taiwanCrisis: 'open-conflict' as const,
        taiwanConflictOutcome: 'off-ramp' as const,
      },
    }
    const setbackScenario = {
      ...offRampScenario,
      controls: { ...offRampScenario.controls, taiwanConflictOutcome: 'decisive-setback' as const },
    }

    const offRamp = annotate(offRampScenario).find(({ id }) => id === 'taiwanCrisis-open-conflict')
    const setback = annotate(setbackScenario).find(({ id }) => id === 'taiwanCrisis-open-conflict')

    expect(offRamp).toMatchObject({ kind: 'conflict', count: 3, label: 'Taiwan: open conflict — face-saving off-ramp' })
    expect(setback).toMatchObject({ kind: 'conflict', count: 3, label: 'Taiwan: open conflict — defeat or CCP-legitimacy threat' })
  })

  it('emits no change annotations for the reference scenario', () => {
    expect(annotate(DEFAULT_SCENARIO)).toEqual([])
  })

  it('shows AI selection symbols without creating changed actors', () => {
    const scenario = {
      ...DEFAULT_SCENARIO,
      mode: 'ai' as const,
      ai: { ...DEFAULT_SCENARIO.ai, dprkNc3Cyber: 'selected' as const },
    }
    const result = evaluateScenario(scenario)
    const annotations = buildMapAnnotations(scenario, result)

    expect(annotations.filter(({ variant }) => variant === 'ai').map(({ actor }) => actor))
      .toEqual(['japan', 'south-korea'])
    expect(result.changedActors.direct).toEqual([])
    expect(result.changedActors.secondOrder).toEqual([])
  })

  it('orders mixed annotations by policy category while preserving order within each category', () => {
    const scenario = {
      ...DEFAULT_SCENARIO,
      mode: 'ai' as const,
      postures: { ...DEFAULT_SCENARIO.postures, 'united-states': 'forward' as const },
      controls: {
        ...DEFAULT_SCENARIO.controls,
        taiwanCrisis: 'blockade' as const,
        koreanCrisis: 'limited' as const,
        assurance: 'strengthened' as const,
        conventionalPresence: 'expanded' as const,
        rokMissileDefense: 1 as const,
        japanCounterstrike: 1 as const,
        japanRokCooperation: 'integrated' as const,
        chinaDoctrine: 'launch-on-warning' as const,
        aseanCohesion: 'weakened' as const,
        rokDomestic: 'review' as const,
        japanDomestic: 'support' as const,
      },
      ai: { ...DEFAULT_SCENARIO.ai, dprkNc3Cyber: 'selected' as const },
    }

    expect(annotate(scenario).map(({ id }) => id)).toEqual([
      'posture-china-predicted-1',
      'posture-north-korea-predicted-2',
      'posture-south-korea-predicted-1',
      'posture-japan-predicted-1',
      'posture-united-states-forward',
      'rokMissileDefense-1',
      'japanCounterstrike-1',
      'chinaDoctrine-launch-on-warning',
      'ai-dprk-nc3-cyber-japan',
      'ai-dprk-nc3-cyber-south-korea',
      'assurance-strengthened-south-korea',
      'assurance-strengthened-japan',
      'conventionalPresence-expanded',
      'japanRokCooperation-integrated',
      'aseanCohesion-weakened',
      'taiwanCrisis-blockade',
      'koreanCrisis-limited',
      'rokDomestic-review',
      'japanDomestic-support',
    ])
  })
})
