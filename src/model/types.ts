export const ASEAN_IDS = [
  'brunei',
  'cambodia',
  'indonesia',
  'laos',
  'malaysia',
  'myanmar',
  'philippines',
  'singapore',
  'thailand',
  'timor-leste',
  'vietnam',
] as const

export const NUCLEAR_ACTOR_IDS = ['china', 'north-korea', 'south-korea', 'japan', 'united-states'] as const
export const REGIONAL_ACTOR_IDS = [
  'china',
  'hong-kong',
  'taiwan',
  'north-korea',
  'south-korea',
  'japan',
  ...ASEAN_IDS,
] as const
export const ACTOR_IDS = [...REGIONAL_ACTOR_IDS, 'united-states'] as const

export type AseanId = (typeof ASEAN_IDS)[number]
export type NuclearActorId = (typeof NUCLEAR_ACTOR_IDS)[number]
export type RegionalActorId = (typeof REGIONAL_ACTOR_IDS)[number]
export type ActorId = (typeof ACTOR_IDS)[number]
export type ReactiveActorId = Exclude<NuclearActorId, 'united-states'>
export type PostureLevel = 0 | 1 | 2
export type UsPosture = 'reduced' | 'baseline' | 'forward' | 'expanded'
export type Confidence = 'High' | 'Medium' | 'Medium-low' | 'Speculative'
export type RiskBand = 'Low' | 'Guarded' | 'High' | 'Critical'
export type EffectMetric = 'escalation' | 'proliferation'
export type EffectOrder = 'direct' | 'second-order'

export interface NuclearPostures {
  china: PostureLevel
  'north-korea': PostureLevel
  'south-korea': PostureLevel
  japan: PostureLevel
  'united-states': UsPosture
}

export interface StrategicControls {
  taiwanCrisis: 'none' | 'blockade' | 'open-conflict'
  taiwanConflictOutcome: 'off-ramp' | 'decisive-setback'
  koreanCrisis: 'none' | 'limited' | 'major'
  assurance: 'strengthened' | 'baseline' | 'questioned' | 'withdrawn'
  conventionalPresence: 'reduced' | 'baseline' | 'expanded'
  rokMissileDefense: PostureLevel
  japanCounterstrike: PostureLevel
  japanRokCooperation: 'degraded' | 'baseline' | 'integrated'
  chinaDoctrine: 'baseline' | 'launch-on-warning' | 'first-use-ambiguity'
  aseanCohesion: 'intact' | 'weakened' | 'broken'
  rokDomestic: 'none' | 'review' | 'support'
  japanDomestic: 'none' | 'review' | 'support'
  chinaLowYieldOptions: 'not-specified' | 'available'
}

export type AtlasMode = 'nuclear' | 'ai'
export type BinaryAiState = 'off' | 'selected'
export type UsNc3CyberTarget = 'none' | 'china' | 'north-korea'

export interface AiControls {
  alliedMissileDefense: BinaryAiState
  chinaMissileDefense: BinaryAiState
  usEarlyWarning: BinaryAiState
  chinaEarlyWarning: BinaryAiState
  usNc3CyberTarget: UsNc3CyberTarget
  chinaNc3Cyber: BinaryAiState
  dprkNc3Cyber: BinaryAiState
  usAutonomousNearChina: BinaryAiState
  chinaAutonomousNearAllies: BinaryAiState
  dprkSyntheticDeception: BinaryAiState
}

export type AiConditionId =
  | 'allied-missile-defense'
  | 'china-missile-defense'
  | 'us-early-warning'
  | 'china-early-warning'
  | 'us-nc3-cyber'
  | 'china-nc3-cyber'
  | 'dprk-nc3-cyber'
  | 'us-autonomous-near-china'
  | 'china-autonomous-near-allies'
  | 'dprk-synthetic-deception'

export interface AiAssessment {
  id: AiConditionId
  label: string
  affectedActors: RegionalActorId[]
  exposureDelta: 0
  pressureDelta: 0
  evidenceStatus: 'exact-condition-not-established'
  supportedFinding: string
  missingEvidence: string
  stabilizingPathway: string
  sourceIds: string[]
}

export interface ScenarioInput {
  mode: AtlasMode
  postures: NuclearPostures
  controls: StrategicControls
  ai: AiControls
}

export interface RuleEffect {
  ruleId: string
  target: RegionalActorId | ReactiveActorId
  metric: EffectMetric
  delta: number
  confidence: Confidence
  explanation: string
  rationale: string
  sourceIds: string[]
  order: EffectOrder
}

export interface ScenarioResult {
  postures: NuclearPostures
  riskScores: Record<RegionalActorId, number>
  riskBands: Record<RegionalActorId, RiskBand>
  directPressure: Record<ReactiveActorId, number>
  predictedPostures: NuclearPostures
  effectivePostures: NuclearPostures
  triggeredRules: RuleEffect[]
  causalTraces: Record<RegionalActorId, RuleEffect[]>
  changedActors: { direct: RegionalActorId[]; secondOrder: RegionalActorId[] }
  aiAssessments: AiAssessment[]
}
