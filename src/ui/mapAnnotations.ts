import { ACTOR_NAMES, type PostureLevel, type RegionalActorId, type ScenarioInput, type ScenarioResult } from '../model'

export type AnnotationKind = 'warhead' | 'warship' | 'conflict' | 'umbrella' | 'radar' | 'missile' | 'link' | 'warning' | 'ring' | 'document' | 'circuit'
export type AnnotationAnchor = RegionalActorId | 'us-inset' | 'western-pacific' | 'japan-rok' | 'asean'
export type AnnotationVariant = 'selected' | 'predicted' | 'positive' | 'negative' | 'warning' | 'ai'

export interface MapAnnotation {
  id: string
  anchor: AnnotationAnchor
  actor?: RegionalActorId
  kind: AnnotationKind
  count: 1 | 3
  variant: AnnotationVariant
  label: string
}

const intensity = (level: PostureLevel): 1 | 3 => level === 2 ? 3 : 1

const annotationPriority = (annotation: MapAnnotation): number => {
  if (annotation.id.startsWith('posture-')) return 0
  if (
    annotation.id.startsWith('rokMissileDefense-')
    || annotation.id.startsWith('japanCounterstrike-')
    || annotation.id.startsWith('chinaDoctrine-')
    || annotation.id.startsWith('ai-')
  ) return 1
  if (
    annotation.id.startsWith('assurance-')
    || annotation.id.startsWith('conventionalPresence-')
    || annotation.id.startsWith('japanRokCooperation-')
    || annotation.id.startsWith('aseanCohesion-')
  ) return 2
  if (annotation.id.startsWith('taiwanCrisis-') || annotation.id.startsWith('koreanCrisis-')) return 3
  return 4
}

export function buildMapAnnotations(scenario: ScenarioInput, result: ScenarioResult): MapAnnotation[] {
  const annotations: MapAnnotation[] = []
  const add = (annotation: MapAnnotation) => annotations.push(annotation)
  const regionalNuclearActors = ['china', 'north-korea', 'south-korea', 'japan'] as const

  for (const actor of regionalNuclearActors) {
    const selected = scenario.postures[actor]
    if (selected > 0) {
      add({
        id: `posture-${actor}-selected-${selected}`,
        anchor: actor,
        actor,
        kind: 'warhead',
        count: intensity(selected),
        variant: 'selected',
        label: `${ACTOR_NAMES[actor]}: selected nuclear posture Level ${selected}`,
      })
    }

    const predicted = result.predictedPostures[actor]
    if (predicted > selected) {
      add({
        id: `posture-${actor}-predicted-${predicted}`,
        anchor: actor,
        actor,
        kind: 'warhead',
        count: intensity(predicted),
        variant: 'predicted',
        label: `${ACTOR_NAMES[actor]}: predicted nuclear posture Level ${predicted}`,
      })
    }
  }

  const usPosture = scenario.postures['united-states']
  if (usPosture !== 'baseline') {
    const expanded = usPosture === 'expanded'
    add({
      id: `posture-united-states-${usPosture}`,
      anchor: 'us-inset',
      kind: 'warhead',
      count: expanded ? 3 : 1,
      variant: usPosture === 'reduced' ? 'negative' : 'selected',
      label: `United States: ${usPosture === 'reduced' ? 'reduced' : expanded ? 'expanded theater' : 'stronger forward'} nuclear posture`,
    })
  }

  const controls = scenario.controls

  if (controls.taiwanCrisis !== 'none') {
    const openConflict = controls.taiwanCrisis === 'open-conflict'
    const conflictOutcome = controls.taiwanConflictOutcome === 'off-ramp'
      ? 'face-saving off-ramp'
      : 'defeat or CCP-legitimacy threat'
    add({
      id: `taiwanCrisis-${controls.taiwanCrisis}`,
      anchor: 'taiwan',
      actor: 'taiwan',
      kind: openConflict ? 'conflict' : 'warship',
      count: openConflict ? 3 : 1,
      variant: 'warning',
      label: openConflict
        ? `Taiwan: open conflict — ${conflictOutcome}`
        : 'Taiwan: blockade scenario',
    })
  }

  if (controls.koreanCrisis !== 'none') {
    const major = controls.koreanCrisis === 'major'
    add({
      id: `koreanCrisis-${controls.koreanCrisis}`,
      anchor: 'south-korea',
      actor: 'south-korea',
      kind: 'conflict',
      count: major ? 3 : 1,
      variant: 'warning',
      label: `Korean Peninsula: ${major ? 'major conflict' : 'limited clash'} scenario`,
    })
  }

  if (controls.assurance !== 'baseline') {
    const stateLabel = controls.assurance === 'strengthened' ? 'strengthened' : controls.assurance === 'questioned' ? 'questioned' : 'withdrawn'
    const variant: AnnotationVariant = controls.assurance === 'strengthened' ? 'positive' : controls.assurance === 'withdrawn' ? 'negative' : 'warning'
    for (const actor of ['south-korea', 'japan'] as const) {
      add({
        id: `assurance-${controls.assurance}-${actor}`,
        anchor: actor,
        actor,
        kind: 'umbrella',
        count: controls.assurance === 'withdrawn' ? 3 : 1,
        variant,
        label: `${ACTOR_NAMES[actor]}: U.S. assurance ${stateLabel}`,
      })
    }
  }

  if (controls.conventionalPresence !== 'baseline') {
    const expanded = controls.conventionalPresence === 'expanded'
    add({
      id: `conventionalPresence-${controls.conventionalPresence}`,
      anchor: 'western-pacific',
      kind: 'warship',
      count: expanded ? 3 : 1,
      variant: expanded ? 'positive' : 'negative',
      label: `United States: ${expanded ? 'expanded' : 'reduced'} conventional force presence`,
    })
  }

  if (controls.rokMissileDefense > 0) {
    add({
      id: `rokMissileDefense-${controls.rokMissileDefense}`,
      anchor: 'south-korea',
      actor: 'south-korea',
      kind: 'radar',
      count: intensity(controls.rokMissileDefense),
      variant: 'selected',
      label: `South Korea: missile-defense posture Level ${controls.rokMissileDefense}`,
    })
  }

  if (controls.japanCounterstrike > 0) {
    add({
      id: `japanCounterstrike-${controls.japanCounterstrike}`,
      anchor: 'japan',
      actor: 'japan',
      kind: 'missile',
      count: intensity(controls.japanCounterstrike),
      variant: 'selected',
      label: `Japan: counterstrike capability Level ${controls.japanCounterstrike}`,
    })
  }

  if (controls.japanRokCooperation !== 'baseline') {
    const integrated = controls.japanRokCooperation === 'integrated'
    add({
      id: `japanRokCooperation-${controls.japanRokCooperation}`,
      anchor: 'japan-rok',
      actor: 'japan',
      kind: 'link',
      count: 1,
      variant: integrated ? 'positive' : 'negative',
      label: `Japan–South Korea cooperation: ${integrated ? 'integrated' : 'degraded'}`,
    })
  }

  if (controls.chinaDoctrine !== 'baseline') {
    const ambiguous = controls.chinaDoctrine === 'first-use-ambiguity'
    add({
      id: `chinaDoctrine-${controls.chinaDoctrine}`,
      anchor: 'china',
      actor: 'china',
      kind: 'warning',
      count: ambiguous ? 3 : 1,
      variant: 'warning',
      label: `China: ${ambiguous ? 'first-use ambiguity' : 'launch-on-warning'} doctrine`,
    })
  }

  if (controls.aseanCohesion !== 'intact') {
    const broken = controls.aseanCohesion === 'broken'
    add({
      id: `aseanCohesion-${controls.aseanCohesion}`,
      anchor: 'asean',
      kind: 'ring',
      count: broken ? 3 : 1,
      variant: 'negative',
      label: `ASEAN nuclear-free-zone cohesion: ${broken ? 'broken' : 'weakened'}`,
    })
  }

  for (const [key, actor] of [['rokDomestic', 'south-korea'], ['japanDomestic', 'japan']] as const) {
    const state = controls[key]
    if (state !== 'none') {
      add({
        id: `${key}-${state}`,
        anchor: actor,
        actor,
        kind: 'document',
        count: state === 'support' ? 3 : 1,
        variant: state === 'support' ? 'selected' : 'warning',
        label: `${ACTOR_NAMES[actor]}: governing-party nuclear ${state}`,
      })
    }
  }

  for (const assessment of result.aiAssessments) {
    for (const actor of assessment.affectedActors) {
      add({
        id: `ai-${assessment.id}-${actor}`,
        anchor: actor,
        actor,
        kind: 'circuit',
        count: 1,
        variant: 'ai',
        label: `${assessment.label}: selected evidence assessment; modeled exposure +0 and proliferation pressure +0`,
      })
    }
  }

  return annotations
    .map((annotation, index) => ({ annotation, index }))
    .sort((a, b) => annotationPriority(a.annotation) - annotationPriority(b.annotation) || a.index - b.index)
    .map(({ annotation }) => annotation)
}
