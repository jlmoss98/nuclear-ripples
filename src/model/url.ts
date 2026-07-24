import { DEFAULT_SCENARIO } from './constants'
import type { PostureLevel, ScenarioInput, UsPosture } from './types'

export interface ParsedScenarioUrl {
  scenario: ScenarioInput
  notices: string[]
}

function choose<T extends string>(
  params: URLSearchParams,
  key: string,
  allowed: readonly T[],
  fallback: T,
  notices: string[],
): T {
  const value = params.get(key)
  if (value === null || value === '') return fallback
  if (allowed.includes(value as T)) return value as T
  notices.push(`Ignored invalid “${key}” value and restored its July 2026 default.`)
  return fallback
}

function level(params: URLSearchParams, key: string, fallback: PostureLevel, notices: string[]): PostureLevel {
  const value = choose(params, key, ['0', '1', '2'] as const, String(fallback) as '0' | '1' | '2', notices)
  return Number(value) as PostureLevel
}

export function parseScenarioUrl(value: string | URLSearchParams = window.location.search): ParsedScenarioUrl {
  const params = typeof value === 'string' ? new URLSearchParams(value.startsWith('?') ? value.slice(1) : value) : value
  const notices: string[] = []

  return {
    scenario: {
      mode: choose(params, 'mode', ['nuclear', 'ai'] as const, DEFAULT_SCENARIO.mode, notices),
      postures: {
        china: level(params, 'cn', DEFAULT_SCENARIO.postures.china, notices),
        'north-korea': level(params, 'nk', DEFAULT_SCENARIO.postures['north-korea'], notices),
        'south-korea': level(params, 'sk', DEFAULT_SCENARIO.postures['south-korea'], notices),
        japan: level(params, 'jp', DEFAULT_SCENARIO.postures.japan, notices),
        'united-states': choose(params, 'us', ['reduced', 'baseline', 'forward', 'expanded'] as const, DEFAULT_SCENARIO.postures['united-states'] as UsPosture, notices),
      },
      controls: {
        taiwanCrisis: choose(params, 'tw', ['none', 'blockade', 'open-conflict'] as const, DEFAULT_SCENARIO.controls.taiwanCrisis, notices),
        taiwanConflictOutcome: choose(params, 'to', ['off-ramp', 'decisive-setback'] as const, DEFAULT_SCENARIO.controls.taiwanConflictOutcome, notices),
        koreanCrisis: choose(params, 'kc', ['none', 'limited', 'major'] as const, DEFAULT_SCENARIO.controls.koreanCrisis, notices),
        assurance: choose(params, 'as', ['strengthened', 'baseline', 'questioned', 'withdrawn'] as const, DEFAULT_SCENARIO.controls.assurance, notices),
        conventionalPresence: choose(params, 'cp', ['reduced', 'baseline', 'expanded'] as const, DEFAULT_SCENARIO.controls.conventionalPresence, notices),
        rokMissileDefense: level(params, 'md', DEFAULT_SCENARIO.controls.rokMissileDefense, notices),
        japanCounterstrike: level(params, 'cs', DEFAULT_SCENARIO.controls.japanCounterstrike, notices),
        japanRokCooperation: choose(params, 'jr', ['degraded', 'baseline', 'integrated'] as const, DEFAULT_SCENARIO.controls.japanRokCooperation, notices),
        chinaDoctrine: choose(params, 'cd', ['baseline', 'launch-on-warning', 'first-use-ambiguity'] as const, DEFAULT_SCENARIO.controls.chinaDoctrine, notices),
        aseanCohesion: choose(params, 'aa', ['intact', 'weakened', 'broken'] as const, DEFAULT_SCENARIO.controls.aseanCohesion, notices),
        rokDomestic: choose(params, 'rd', ['none', 'review', 'support'] as const, DEFAULT_SCENARIO.controls.rokDomestic, notices),
        japanDomestic: choose(params, 'jd', ['none', 'review', 'support'] as const, DEFAULT_SCENARIO.controls.japanDomestic, notices),
        chinaLowYieldOptions: choose(params, 'ly', ['not-specified', 'available'] as const, DEFAULT_SCENARIO.controls.chinaLowYieldOptions, notices),
      },
      ai: {
        alliedMissileDefense: choose(params, 'amd', ['off', 'selected'] as const, DEFAULT_SCENARIO.ai.alliedMissileDefense, notices),
        chinaMissileDefense: choose(params, 'cmd', ['off', 'selected'] as const, DEFAULT_SCENARIO.ai.chinaMissileDefense, notices),
        usEarlyWarning: choose(params, 'uew', ['off', 'selected'] as const, DEFAULT_SCENARIO.ai.usEarlyWarning, notices),
        chinaEarlyWarning: choose(params, 'cew', ['off', 'selected'] as const, DEFAULT_SCENARIO.ai.chinaEarlyWarning, notices),
        usNc3CyberTarget: choose(params, 'ucy', ['none', 'china', 'north-korea'] as const, DEFAULT_SCENARIO.ai.usNc3CyberTarget, notices),
        chinaNc3Cyber: choose(params, 'ccy', ['off', 'selected'] as const, DEFAULT_SCENARIO.ai.chinaNc3Cyber, notices),
        dprkNc3Cyber: choose(params, 'ncy', ['off', 'selected'] as const, DEFAULT_SCENARIO.ai.dprkNc3Cyber, notices),
        usAutonomousNearChina: choose(params, 'uac', ['off', 'selected'] as const, DEFAULT_SCENARIO.ai.usAutonomousNearChina, notices),
        chinaAutonomousNearAllies: choose(params, 'cac', ['off', 'selected'] as const, DEFAULT_SCENARIO.ai.chinaAutonomousNearAllies, notices),
        dprkSyntheticDeception: choose(params, 'nsd', ['off', 'selected'] as const, DEFAULT_SCENARIO.ai.dprkSyntheticDeception, notices),
      },
    },
    notices,
  }
}

export function serializeScenarioUrl(scenario: ScenarioInput): string {
  const params = new URLSearchParams({
    mode: scenario.mode,
    cn: String(scenario.postures.china),
    nk: String(scenario.postures['north-korea']),
    sk: String(scenario.postures['south-korea']),
    jp: String(scenario.postures.japan),
    us: scenario.postures['united-states'],
    tw: scenario.controls.taiwanCrisis,
    to: scenario.controls.taiwanConflictOutcome,
    kc: scenario.controls.koreanCrisis,
    as: scenario.controls.assurance,
    cp: scenario.controls.conventionalPresence,
    md: String(scenario.controls.rokMissileDefense),
    cs: String(scenario.controls.japanCounterstrike),
    jr: scenario.controls.japanRokCooperation,
    cd: scenario.controls.chinaDoctrine,
    aa: scenario.controls.aseanCohesion,
    rd: scenario.controls.rokDomestic,
    jd: scenario.controls.japanDomestic,
    ly: scenario.controls.chinaLowYieldOptions,
    amd: scenario.ai.alliedMissileDefense,
    cmd: scenario.ai.chinaMissileDefense,
    uew: scenario.ai.usEarlyWarning,
    cew: scenario.ai.chinaEarlyWarning,
    ucy: scenario.ai.usNc3CyberTarget,
    ccy: scenario.ai.chinaNc3Cyber,
    ncy: scenario.ai.dprkNc3Cyber,
    uac: scenario.ai.usAutonomousNearChina,
    cac: scenario.ai.chinaAutonomousNearAllies,
    nsd: scenario.ai.dprkSyntheticDeception,
  })
  return `?${params.toString()}`
}
