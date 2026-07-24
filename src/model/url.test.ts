import { describe, expect, it } from 'vitest'
import { DEFAULT_SCENARIO } from './constants'
import { parseScenarioUrl, serializeScenarioUrl } from './url'

describe('scenario URL state', () => {
  it('round-trips every scenario field', () => {
    const scenario = {
      mode: 'ai' as const,
      postures: { china: 2 as const, 'north-korea': 1 as const, 'south-korea': 2 as const, japan: 1 as const, 'united-states': 'expanded' as const },
      controls: {
        taiwanCrisis: 'blockade' as const,
        taiwanConflictOutcome: 'off-ramp' as const,
        koreanCrisis: 'limited' as const,
        assurance: 'questioned' as const,
        conventionalPresence: 'reduced' as const,
        rokMissileDefense: 2 as const,
        japanCounterstrike: 1 as const,
        japanRokCooperation: 'degraded' as const,
        chinaDoctrine: 'launch-on-warning' as const,
        aseanCohesion: 'weakened' as const,
        rokDomestic: 'review' as const,
        japanDomestic: 'support' as const,
        chinaLowYieldOptions: 'available' as const,
      },
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

    expect(parseScenarioUrl(serializeScenarioUrl(scenario))).toEqual({ scenario, notices: [] })
  })

  it('recovers invalid values individually and reports a notice', () => {
    const parsed = parseScenarioUrl('?cn=9&nk=2&tw=unknown&aa=broken')

    expect(parsed.scenario.postures.china).toBe(DEFAULT_SCENARIO.postures.china)
    expect(parsed.scenario.postures['north-korea']).toBe(2)
    expect(parsed.scenario.controls.taiwanCrisis).toBe(DEFAULT_SCENARIO.controls.taiwanCrisis)
    expect(parsed.scenario.controls.aseanCohesion).toBe('broken')
    expect(parsed.notices).toHaveLength(2)
  })

  it('rejects invalid AI values independently', () => {
    const parsed = parseScenarioUrl('?mode=ai&amd=bad&ucy=china&ncy=selected')

    expect(parsed.scenario.mode).toBe('ai')
    expect(parsed.scenario.ai.alliedMissileDefense).toBe('off')
    expect(parsed.scenario.ai.usNc3CyberTarget).toBe('china')
    expect(parsed.scenario.ai.dprkNc3Cyber).toBe('selected')
    expect(parsed.notices).toHaveLength(1)
  })

  it('restores the Taiwan outcome and China low-yield defaults for invalid values', () => {
    const parsed = parseScenarioUrl('?to=unknown&ly=unknown')

    expect(parsed.scenario.controls.taiwanConflictOutcome).toBe(DEFAULT_SCENARIO.controls.taiwanConflictOutcome)
    expect(parsed.scenario.controls.chinaLowYieldOptions).toBe(DEFAULT_SCENARIO.controls.chinaLowYieldOptions)
    expect(parsed.notices).toHaveLength(2)
  })

  it('returns the July 2026 scenario for an empty URL', () => {
    expect(parseScenarioUrl('').scenario).toEqual(DEFAULT_SCENARIO)
  })
})
