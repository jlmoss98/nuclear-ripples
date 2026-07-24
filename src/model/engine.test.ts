import { describe, expect, it } from 'vitest'
import { DEFAULT_AI_CONTROLS } from '../data/aiConditions'
import { ACTOR_IDS, ASEAN_IDS, BASELINE_SCORES, DEFAULT_SCENARIO } from './constants'
import { evaluateScenario } from './engine'

describe('evaluateScenario', () => {
  it('returns the exact July 2026 baseline', () => {
    const result = evaluateScenario(DEFAULT_SCENARIO)

    expect(result.riskScores).toEqual(BASELINE_SCORES)
    expect(result.triggeredRules).toHaveLength(0)
    expect(result.predictedPostures).toMatchObject({
      china: 0,
      'north-korea': 0,
      'south-korea': 0,
      japan: 0,
      'united-states': 'baseline',
    })
    expect(ACTOR_IDS).toHaveLength(18)
    expect(ASEAN_IDS).toHaveLength(11)
  })

  it('exposes selected AI assessments without changing any nuclear result', () => {
    const nuclear = evaluateScenario(DEFAULT_SCENARIO)
    const aiScenario = {
      ...DEFAULT_SCENARIO,
      mode: 'ai' as const,
      ai: {
        alliedMissileDefense: 'selected' as const,
        chinaMissileDefense: 'selected' as const,
        usEarlyWarning: 'selected' as const,
        chinaEarlyWarning: 'selected' as const,
        usNc3CyberTarget: 'north-korea' as const,
        chinaNc3Cyber: 'selected' as const,
        dprkNc3Cyber: 'selected' as const,
        usAutonomousNearChina: 'selected' as const,
        chinaAutonomousNearAllies: 'selected' as const,
        dprkSyntheticDeception: 'selected' as const,
      },
    }
    const ai = evaluateScenario(aiScenario)

    expect(ai.aiAssessments).toHaveLength(10)
    expect(ai.riskScores).toEqual(nuclear.riskScores)
    expect(ai.riskBands).toEqual(nuclear.riskBands)
    expect(ai.directPressure).toEqual(nuclear.directPressure)
    expect(ai.predictedPostures).toEqual(nuclear.predictedPostures)
    expect(ai.effectivePostures).toEqual(nuclear.effectivePostures)
    expect(ai.triggeredRules).toEqual(nuclear.triggeredRules)
    expect(ai.causalTraces).toEqual(nuclear.causalTraces)
    expect(ai.changedActors).toEqual(nuclear.changedActors)
  })

  it('hides AI assessments in Nuclear mode without clearing saved selections', () => {
    const result = evaluateScenario({
      ...DEFAULT_SCENARIO,
      ai: { ...DEFAULT_SCENARIO.ai, dprkNc3Cyber: 'selected' },
    })

    expect(result.aiAssessments).toEqual([])
  })

  it('turns a South Korean operational arsenal into Japanese pressure, not an automatic posture', () => {
    const result = evaluateScenario({
      ...DEFAULT_SCENARIO,
      postures: { ...DEFAULT_SCENARIO.postures, 'south-korea': 2 },
    })

    expect(result.directPressure.japan).toBe(2)
    expect(result.predictedPostures.japan).toBe(0)
    expect(result.predictedPostures['south-korea']).toBe(0)
    expect(result.effectivePostures.japan).toBe(0)
    expect(result.riskScores.china).toBe(65)
  })

  it('turns a Japanese operational arsenal into stronger South Korean pressure, not an automatic posture', () => {
    const result = evaluateScenario({
      ...DEFAULT_SCENARIO,
      postures: { ...DEFAULT_SCENARIO.postures, japan: 2 },
    })

    expect(result.directPressure['south-korea']).toBe(3)
    expect(result.predictedPostures['south-korea']).toBe(0)
    expect(result.predictedPostures.japan).toBe(0)
  })

  it('uses the approved South Korea–Japan asymmetry for a Korean Peninsula troop reduction', () => {
    const result = evaluateScenario({
      ...DEFAULT_SCENARIO,
      controls: { ...DEFAULT_SCENARIO.controls, conventionalPresence: 'reduced' },
    })

    expect(result.directPressure['south-korea']).toBe(2)
    expect(result.directPressure.japan).toBe(1)
  })

  it('retains equal China posture pressure on Japan and South Korea', () => {
    const result = evaluateScenario({
      ...DEFAULT_SCENARIO,
      postures: { ...DEFAULT_SCENARIO.postures, china: 2 },
    })

    expect(result.directPressure['south-korea']).toBe(2)
    expect(result.directPressure.japan).toBe(2)
  })

  it('uses 4/8 thresholds for Japan and South Korea and 5/9 for China and North Korea', () => {
    const result = evaluateScenario({
      ...DEFAULT_SCENARIO,
      controls: {
        ...DEFAULT_SCENARIO.controls,
        taiwanCrisis: 'open-conflict',
        koreanCrisis: 'major',
        assurance: 'withdrawn',
      },
    })

    expect(result.directPressure).toMatchObject({ china: 5, 'north-korea': 4, 'south-korea': 8, japan: 9 })
    expect(result.predictedPostures).toMatchObject({ china: 1, 'north-korea': 0, 'south-korea': 2, japan: 2 })
  })

  it('limits South Korean missile-defense direct effects to China, North Korea, and South Korea', () => {
    const result = evaluateScenario({
      ...DEFAULT_SCENARIO,
      controls: { ...DEFAULT_SCENARIO.controls, rokMissileDefense: 1 },
    })
    const effects = result.triggeredRules
      .filter((effect) => effect.ruleId === 'rok-missile-defense-1' && effect.metric === 'escalation')
      .map((effect) => effect.target)

    expect(effects).toEqual(['china', 'north-korea', 'south-korea'])
  })

  it('applies Taiwan open conflict to every modeled regional group', () => {
    const result = evaluateScenario({
      ...DEFAULT_SCENARIO,
      controls: { ...DEFAULT_SCENARIO.controls, taiwanCrisis: 'open-conflict' },
    })

    expect(result.riskScores).toMatchObject({ taiwan: 85, china: 85, 'hong-kong': 85, japan: 60, 'south-korea': 55 })
    for (const actor of ASEAN_IDS) expect(result.riskScores[actor]).toBe(25)
  })

  it('uses the blockade pressure effects when an open Taiwan conflict has an off-ramp', () => {
    const blockade = evaluateScenario({
      ...DEFAULT_SCENARIO,
      controls: { ...DEFAULT_SCENARIO.controls, taiwanCrisis: 'blockade' },
    })
    const offRamp = evaluateScenario({
      ...DEFAULT_SCENARIO,
      controls: {
        ...DEFAULT_SCENARIO.controls,
        taiwanCrisis: 'open-conflict',
        taiwanConflictOutcome: 'off-ramp',
      },
    })
    const decisiveSetback = evaluateScenario({
      ...DEFAULT_SCENARIO,
      controls: {
        ...DEFAULT_SCENARIO.controls,
        taiwanCrisis: 'open-conflict',
        taiwanConflictOutcome: 'decisive-setback',
      },
    })

    expect(offRamp.directPressure).toEqual(blockade.directPressure)
    expect(offRamp.riskScores).toEqual(decisiveSetback.riskScores)
    expect(decisiveSetback.directPressure.china).toBe(3)
    expect(decisiveSetback.directPressure.japan).toBe(3)
    expect(offRamp.directPressure.china).toBe(2)
    expect(offRamp.directPressure.japan).toBe(2)
  })

  it('does not change nuclear results when China low-yield options are available', () => {
    const notSpecified = evaluateScenario({
      ...DEFAULT_SCENARIO,
      controls: { ...DEFAULT_SCENARIO.controls, chinaLowYieldOptions: 'not-specified' },
    })
    const available = evaluateScenario({
      ...DEFAULT_SCENARIO,
      controls: { ...DEFAULT_SCENARIO.controls, chinaLowYieldOptions: 'available' },
    })

    expect(available).toEqual(notSpecified)
  })

  it('reconciles Hong Kong’s causal trace with its inherited China score', () => {
    const result = evaluateScenario({
      ...DEFAULT_SCENARIO,
      controls: {
        ...DEFAULT_SCENARIO.controls,
        taiwanCrisis: 'open-conflict',
      },
    })
    const traceDelta = result.causalTraces['hong-kong']
      .reduce((total, effect) => total + effect.delta, 0)

    expect(result.riskScores['hong-kong']).toBe(result.riskScores.china)
    expect(BASELINE_SCORES['hong-kong'] + traceDelta).toBe(result.riskScores['hong-kong'])
    expect(result.causalTraces['hong-kong'].every((effect) => effect.target === 'hong-kong')).toBe(true)
  })

  it('applies identical ASEAN-wide effects to all eleven members', () => {
    const result = evaluateScenario({
      ...DEFAULT_SCENARIO,
      controls: { ...DEFAULT_SCENARIO.controls, aseanCohesion: 'broken' },
    })

    expect(ASEAN_IDS.map((actor) => result.riskScores[actor])).toEqual(Array(11).fill(35))
  })

  it('treats governing-party support as pressure without forcing a weaponization decision', () => {
    const result = evaluateScenario({
      ...DEFAULT_SCENARIO,
      controls: { ...DEFAULT_SCENARIO.controls, japanDomestic: 'support' },
    })

    expect(result.postures.japan).toBe(0)
    expect(result.directPressure.japan).toBe(3)
    expect(result.predictedPostures.japan).toBe(0)
    expect(result.effectivePostures.japan).toBe(0)
    expect(result.triggeredRules.find(({ ruleId }) => ruleId === 'japan-domestic-support')?.explanation)
      .toMatch(/adds pressure.*does not itself authorize/i)
  })

  it('clamps escalation scores and pressure values', () => {
    const result = evaluateScenario({
      mode: 'nuclear',
      postures: { china: 2, 'north-korea': 2, 'south-korea': 2, japan: 2, 'united-states': 'expanded' },
      controls: {
        taiwanCrisis: 'open-conflict',
        koreanCrisis: 'major',
        assurance: 'withdrawn',
        conventionalPresence: 'expanded',
        rokMissileDefense: 2,
        japanCounterstrike: 2,
        japanRokCooperation: 'integrated',
        chinaDoctrine: 'first-use-ambiguity',
        aseanCohesion: 'broken',
        rokDomestic: 'support',
        japanDomestic: 'support',
        taiwanConflictOutcome: 'decisive-setback',
        chinaLowYieldOptions: 'not-specified',
      },
      ai: DEFAULT_AI_CONTROLS,
    })

    expect(Object.values(result.riskScores).every((score) => score >= 0 && score <= 100)).toBe(true)
    expect(Object.values(result.directPressure).every((score) => score >= 0 && score <= 10)).toBe(true)
  })
})
