import { buildAiAssessments } from '../data/aiConditions'
import { evidenceForRule } from '../data/ruleEvidence'
import { ASEAN_IDS, BASELINE_SCORES, PREDICTION_THRESHOLDS, REGIONAL_ACTOR_IDS } from './constants'
import type {
  EffectOrder,
  NuclearPostures,
  PostureLevel,
  ReactiveActorId,
  RegionalActorId,
  RiskBand,
  RuleEffect,
  ScenarioInput,
  ScenarioResult,
} from './types'

const REACTIVE_ACTORS: ReactiveActorId[] = ['china', 'north-korea', 'south-korea', 'japan']

const clamp = (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, value))

export function riskBand(score: number): RiskBand {
  if (score < 25) return 'Low'
  if (score < 50) return 'Guarded'
  if (score < 75) return 'High'
  return 'Critical'
}

export function evaluateScenario(input: ScenarioInput): ScenarioResult {
  const scores = { ...BASELINE_SCORES }
  const pressure: Record<ReactiveActorId, number> = { china: 0, 'north-korea': 0, 'south-korea': 0, japan: 0 }
  const effects: RuleEffect[] = []

  const addRule = (
    ruleId: string,
    explanation: string,
    riskEffects: Array<[RegionalActorId, number]>,
    pressureEffects: Array<[ReactiveActorId, number]> = [],
    order: EffectOrder = 'direct',
  ) => {
    const evidence = evidenceForRule(ruleId)
    for (const [target, delta] of riskEffects) {
      scores[target] += delta
      effects.push({ ruleId, target, metric: 'escalation', delta, explanation, order, ...evidence })
    }
    if (order === 'direct') {
      for (const [target, delta] of pressureEffects) {
        pressure[target] += delta
        effects.push({ ruleId, target, metric: 'proliferation', delta, explanation, order, ...evidence })
      }
    }
  }

  const aseanRisk = (delta: number): Array<[RegionalActorId, number]> => ASEAN_IDS.map((actor) => [actor, delta])
  const applyRegionalPosture = (actor: 'south-korea' | 'japan', level: 1 | 2, order: EffectOrder) => {
    const counterpart = actor === 'japan' ? 'south-korea' : 'japan'
    const prefix = actor === 'japan' ? 'japan' : 'rok'
    const delta = level === 1 ? 5 : 10
    const counterpartPressure = actor === 'japan' ? 3 : 2
    addRule(
      `${prefix}-posture-${level}`,
      `${actor === 'japan' ? 'Japanese' : 'South Korean'} nuclear posture level ${level} changes regional deterrence perceptions.`,
      [
        ['china', delta * 2], ['north-korea', delta * 2], [actor, delta], [counterpart, delta], ['taiwan', delta], ...aseanRisk(delta),
      ],
      level === 1
        ? [[counterpart, 1], ['china', 1], ['north-korea', 1]]
        : [[counterpart, counterpartPressure], ['china', 2], ['north-korea', 2]],
      order,
    )
  }

  const applyPosture = (actor: ReactiveActorId, level: 1 | 2, order: EffectOrder) => {
    if (actor === 'south-korea' || actor === 'japan') return applyRegionalPosture(actor, level, order)
    if (actor === 'china') {
      const major = level === 2
      addRule(
        `china-posture-${level}`,
        `China nuclear posture level ${level} raises exposure and allied proliferation pressure.`,
        [
          ['china', major ? 10 : 5], ['taiwan', major ? 20 : 10], ['japan', major ? 20 : 10],
          ['south-korea', major ? 20 : 10], ...aseanRisk(major ? 10 : 5),
        ],
        major ? [['japan', 2], ['south-korea', 2], ['north-korea', 1]] : [['japan', 1], ['south-korea', 1]],
        order,
      )
      return
    }
    const major = level === 2
    addRule(
      `dprk-posture-${level}`,
      `North Korean nuclear posture level ${level} raises peninsula and regional exposure.`,
      [
        ['north-korea', major ? 20 : 10], ['south-korea', major ? 20 : 10], ['japan', major ? 20 : 10],
        ['china', major ? 10 : 5], ...aseanRisk(5),
      ],
      major ? [['south-korea', 3], ['japan', 2], ['china', 1]] : [['south-korea', 2], ['japan', 1]],
      order,
    )
  }

  for (const actor of REACTIVE_ACTORS) {
    const level = input.postures[actor]
    if (level > 0) applyPosture(actor, level as 1 | 2, 'direct')
  }

  const usPosture = input.postures['united-states']
  if (usPosture === 'reduced') {
    addRule('us-posture-reduced', 'Reduced U.S. nuclear posture weakens perceived allied assurance.', [
      ['south-korea', 10], ['japan', 10], ['taiwan', 10], ...aseanRisk(5),
    ], [['south-korea', 2], ['japan', 2]])
  } else if (usPosture === 'forward' || usPosture === 'expanded') {
    const delta = usPosture === 'expanded' ? 20 : 10
    const regionalDelta = usPosture === 'expanded' ? 10 : 5
    const pressureDelta = usPosture === 'expanded' ? 2 : 1
    addRule(`us-posture-${usPosture}`, `${usPosture === 'expanded' ? 'Expanded theater' : 'Stronger forward'} U.S. nuclear posture raises adversary threat perception.`, [
      ['china', delta], ['north-korea', delta], ['south-korea', regionalDelta], ['japan', regionalDelta], ['taiwan', regionalDelta], ...aseanRisk(regionalDelta),
    ], [['china', pressureDelta], ['north-korea', pressureDelta], ['south-korea', -pressureDelta], ['japan', -pressureDelta]])
  }

  const controls = input.controls
  if (controls.taiwanCrisis !== 'none') {
    const conflict = controls.taiwanCrisis === 'open-conflict'
    const elevatedPressure = conflict && controls.taiwanConflictOutcome === 'decisive-setback'
    const explanation = !conflict
      ? 'A blockade across the Taiwan Strait raises regional escalation exposure.'
      : elevatedPressure
        ? 'An open conflict across the Taiwan Strait ending in a decisive setback raises regional escalation exposure and proliferation pressure.'
        : 'An open conflict across the Taiwan Strait ending through an off-ramp raises regional escalation exposure without the additional proliferation pressure of a decisive setback.'
    addRule(`taiwan-${controls.taiwanCrisis}`, explanation, [
      ['taiwan', conflict ? 50 : 30], ['china', conflict ? 40 : 20], ['japan', conflict ? 20 : 10],
      ['hong-kong', conflict ? 20 : 10], ['south-korea', conflict ? 10 : 5], ...aseanRisk(conflict ? 10 : 5),
    ], elevatedPressure ? [['china', 3], ['japan', 3], ['south-korea', 2], ['north-korea', 1]] : [['china', 2], ['japan', 2], ['south-korea', 1], ['north-korea', 1]])
  }
  if (controls.koreanCrisis !== 'none') {
    const major = controls.koreanCrisis === 'major'
    addRule(`korean-${controls.koreanCrisis}`, `${major ? 'Major conflict' : 'A limited clash'} on the Korean Peninsula raises regional escalation exposure.`, [
      ['north-korea', major ? 40 : 20], ['south-korea', major ? 40 : 20], ['japan', major ? 20 : 10],
      ['china', major ? 10 : 5], ['taiwan', major ? 10 : 5], ...aseanRisk(major ? 10 : 5),
    ], major ? [['north-korea', 3], ['south-korea', 3], ['japan', 3], ['china', 2]] : [['north-korea', 2], ['japan', 2], ['south-korea', 3], ['china', 1]])
  }
  if (controls.assurance === 'strengthened') {
    addRule('assurance-strengthened', 'Strengthened U.S. assurance reduces allied hedging pressure while raising adversary concern.', [
      ['south-korea', -5], ['japan', -5], ['china', 5], ['north-korea', 5],
    ], [['south-korea', -2], ['japan', -2]])
  } else if (controls.assurance === 'questioned' || controls.assurance === 'withdrawn') {
    const withdrawn = controls.assurance === 'withdrawn'
    addRule(`assurance-${controls.assurance}`, `${withdrawn ? 'Withdrawal of' : 'Doubt about'} the U.S. guarantee increases allied hedging pressure.`, [
      ['south-korea', withdrawn ? 20 : 10], ['japan', withdrawn ? 20 : 10], ['taiwan', withdrawn ? 20 : 10], ...aseanRisk(withdrawn ? 10 : 5),
    ], [['south-korea', withdrawn ? 3 : 2], ['japan', withdrawn ? 3 : 2]])
  }
  if (controls.conventionalPresence === 'reduced') {
    addRule('conventional-reduced', 'Reduced U.S. conventional presence increases allied exposure and hedging pressure.', [
      ['south-korea', 10], ['japan', 10], ['taiwan', 10], ...aseanRisk(5),
    ], [['south-korea', 2], ['japan', 1]])
  } else if (controls.conventionalPresence === 'expanded') {
    addRule('conventional-expanded', 'Expanded U.S. conventional presence raises adversary concern while reducing allied hedging pressure.', [
      ['china', 10], ['north-korea', 10], ['south-korea', 5], ['japan', 5], ['taiwan', 5], ...aseanRisk(5),
    ], [['china', 1], ['north-korea', 1], ['south-korea', -1], ['japan', -1]])
  }

  if (controls.rokMissileDefense > 0) {
    const level = controls.rokMissileDefense
    addRule(`rok-missile-defense-${level}`, `South Korean missile-defense level ${level} intensifies the regional security dilemma.`, [
      ['china', level === 2 ? 20 : 10], ['north-korea', level === 2 ? 20 : 10], ['south-korea', level === 2 ? 10 : 5],
    ], [['china', level], ['north-korea', level]])
  }
  if (controls.japanCounterstrike > 0) {
    const level = controls.japanCounterstrike
    const risk: Array<[RegionalActorId, number]> = [
      ['china', level === 2 ? 20 : 10], ['north-korea', level === 2 ? 20 : 10], ['japan', level === 2 ? 10 : 5],
    ]
    if (level === 2) risk.push(['south-korea', 5])
    addRule(`japan-counterstrike-${level}`, `Japanese counterstrike level ${level} raises adversary threat perception.`, risk, [['china', level], ['north-korea', level]])
  }
  if (controls.japanRokCooperation === 'degraded') {
    addRule('cooperation-degraded', 'Degraded Japan–ROK cooperation raises allied exposure and hedging pressure.', [['japan', 5], ['south-korea', 5]], [['japan', 1], ['south-korea', 1]])
  } else if (controls.japanRokCooperation === 'integrated') {
    addRule('cooperation-integrated', 'Integrated Japan–ROK cooperation lowers allied exposure while raising adversary concern.', [
      ['china', 10], ['north-korea', 10], ['japan', -5], ['south-korea', -5],
    ], [['china', 1], ['north-korea', 1], ['japan', -1], ['south-korea', -1]])
  }
  if (controls.chinaDoctrine !== 'baseline') {
    const ambiguity = controls.chinaDoctrine === 'first-use-ambiguity'
    addRule(`china-doctrine-${controls.chinaDoctrine}`, `${ambiguity ? 'First-use ambiguity' : 'Launch-on-warning'} compresses nuclear decision time.`, [
      ['china', ambiguity ? 20 : 10], ['taiwan', ambiguity ? 20 : 10], ['japan', ambiguity ? 20 : 10],
      ['south-korea', ambiguity ? 20 : 10], ['north-korea', ambiguity ? 10 : 5], ...aseanRisk(ambiguity ? 10 : 5),
    ], [['japan', ambiguity ? 3 : 2], ['south-korea', ambiguity ? 3 : 2], ['north-korea', 1]])
  }
  if (controls.aseanCohesion !== 'intact') {
    const broken = controls.aseanCohesion === 'broken'
    addRule(`asean-${controls.aseanCohesion}`, `${broken ? 'Broken' : 'Weakened'} Southeast Asian nuclear-free-zone cohesion raises member exposure.`, aseanRisk(broken ? 20 : 10))
  }

  const applyDomestic = (actor: 'south-korea' | 'japan', state: 'review' | 'support') => {
    const counterpart = actor === 'japan' ? 'south-korea' : 'japan'
    const prefix = actor === 'japan' ? 'japan' : 'rok'
    if (state === 'review') {
      addRule(`${prefix}-domestic-review`, `A governing-party nuclear review in ${actor === 'japan' ? 'Japan' : 'South Korea'} raises regional concern.`, [[actor, 5], [counterpart, 5]], [[actor, 2], [counterpart, 1]])
    } else {
      addRule(`${prefix}-domestic-support`, `Governing-party support in ${actor === 'japan' ? 'Japan' : 'South Korea'} adds pressure toward proliferation but does not itself authorize a weaponization program.`, [
        [actor, 10], ['china', 5], ['north-korea', 5], [counterpart, 5],
      ], [[actor, 3], [counterpart, 1]])
    }
  }
  if (controls.rokDomestic !== 'none') applyDomestic('south-korea', controls.rokDomestic)
  if (controls.japanDomestic !== 'none') applyDomestic('japan', controls.japanDomestic)

  for (const actor of REACTIVE_ACTORS) pressure[actor] = clamp(pressure[actor], 0, 10)

  const predicted: Record<ReactiveActorId, PostureLevel> = { china: 0, 'north-korea': 0, 'south-korea': 0, japan: 0 }
  for (const actor of REACTIVE_ACTORS) {
    const [levelOne, levelTwo] = PREDICTION_THRESHOLDS[actor]
    predicted[actor] = pressure[actor] >= levelTwo ? 2 : pressure[actor] >= levelOne ? 1 : 0
  }
  for (const actor of REACTIVE_ACTORS) {
    if (predicted[actor] > input.postures[actor]) applyPosture(actor, predicted[actor] as 1 | 2, 'second-order')
  }

  for (const actor of REGIONAL_ACTOR_IDS) scores[actor] = clamp(scores[actor], 0, 100)
  scores['hong-kong'] = scores.china

  const predictedPostures: NuclearPostures = { ...predicted, 'united-states': input.postures['united-states'] }
  const effectivePostures: NuclearPostures = {
    china: Math.max(input.postures.china, predicted.china) as PostureLevel,
    'north-korea': Math.max(input.postures['north-korea'], predicted['north-korea']) as PostureLevel,
    'south-korea': Math.max(input.postures['south-korea'], predicted['south-korea']) as PostureLevel,
    japan: Math.max(input.postures.japan, predicted.japan) as PostureLevel,
    'united-states': input.postures['united-states'],
  }
  const causalTraces = Object.fromEntries(REGIONAL_ACTOR_IDS.map((actor) => {
    const traceSource = actor === 'hong-kong' ? 'china' : actor
    const trace = effects
      .filter((effect) => effect.metric === 'escalation' && effect.target === traceSource)
      .map((effect) => actor === 'hong-kong' ? { ...effect, target: actor } : effect)
    return [actor, trace]
  })) as Record<RegionalActorId, RuleEffect[]>
  const changedActors = (order: EffectOrder) => REGIONAL_ACTOR_IDS.filter((actor) => effects.some((effect) => effect.order === order && effect.metric === 'escalation' && effect.target === actor))
  const aiAssessments = input.mode === 'ai' ? buildAiAssessments(input.ai) : []

  return {
    postures: { ...input.postures },
    riskScores: scores,
    riskBands: Object.fromEntries(REGIONAL_ACTOR_IDS.map((actor) => [actor, riskBand(scores[actor])])) as Record<RegionalActorId, RiskBand>,
    directPressure: pressure,
    predictedPostures,
    effectivePostures,
    triggeredRules: effects,
    causalTraces,
    changedActors: { direct: changedActors('direct'), secondOrder: changedActors('second-order') },
    aiAssessments,
  }
}
