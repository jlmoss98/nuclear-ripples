import { DEFAULT_AI_CONTROLS } from '../data/aiConditions'
import {
  ACTOR_IDS,
  ASEAN_IDS,
  NUCLEAR_ACTOR_IDS,
  REGIONAL_ACTOR_IDS,
  type ReactiveActorId,
  type RegionalActorId,
  type ScenarioInput,
} from './types'

export { ACTOR_IDS, ASEAN_IDS, NUCLEAR_ACTOR_IDS, REGIONAL_ACTOR_IDS }

export const BASELINE_SCORES: Record<RegionalActorId, number> = {
  china: 45,
  'hong-kong': 45,
  taiwan: 35,
  'north-korea': 55,
  'south-korea': 45,
  japan: 40,
  brunei: 15,
  cambodia: 15,
  indonesia: 15,
  laos: 15,
  malaysia: 15,
  myanmar: 15,
  philippines: 15,
  singapore: 15,
  thailand: 15,
  'timor-leste': 15,
  vietnam: 15,
}

export const PREDICTION_THRESHOLDS: Record<ReactiveActorId, readonly [number, number]> = {
  china: [5, 9],
  'north-korea': [5, 9],
  'south-korea': [4, 8],
  japan: [4, 8],
}

export const DEFAULT_SCENARIO: ScenarioInput = {
  mode: 'nuclear',
  postures: { china: 0, 'north-korea': 0, 'south-korea': 0, japan: 0, 'united-states': 'baseline' },
  controls: {
    taiwanCrisis: 'none',
    taiwanConflictOutcome: 'decisive-setback',
    koreanCrisis: 'none',
    assurance: 'baseline',
    conventionalPresence: 'baseline',
    rokMissileDefense: 0,
    japanCounterstrike: 0,
    japanRokCooperation: 'baseline',
    chinaDoctrine: 'baseline',
    aseanCohesion: 'intact',
    rokDomestic: 'none',
    japanDomestic: 'none',
    chinaLowYieldOptions: 'not-specified',
  },
  ai: DEFAULT_AI_CONTROLS,
}

export const ACTOR_NAMES: Record<(typeof ACTOR_IDS)[number], string> = {
  china: 'China',
  'hong-kong': 'Hong Kong',
  taiwan: 'Taiwan',
  'north-korea': 'North Korea',
  'south-korea': 'South Korea',
  japan: 'Japan',
  'united-states': 'United States',
  brunei: 'Brunei',
  cambodia: 'Cambodia',
  indonesia: 'Indonesia',
  laos: 'Laos',
  malaysia: 'Malaysia',
  myanmar: 'Myanmar',
  philippines: 'Philippines',
  singapore: 'Singapore',
  thailand: 'Thailand',
  'timor-leste': 'Timor-Leste',
  vietnam: 'Vietnam',
}
