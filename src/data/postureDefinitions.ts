import type { NuclearActorId, PostureLevel, UsPosture } from '../model'

export type PostureDefinitionValue = PostureLevel | UsPosture

export interface PostureDefinition {
  value: PostureDefinitionValue
  label: string
  title: string
  description: string
}

const existingNuclearPowerDefinitions: readonly PostureDefinition[] = [
  {
    value: 0,
    label: 'Level 0',
    title: 'July 2026 reference posture',
    description: 'The actor retains its modeled July 2026 nuclear posture. Level 0 does not mean the actor is non-nuclear.',
  },
  {
    value: 1,
    label: 'Level 1',
    title: 'Limited posture increase',
    description: 'A meaningful but bounded increase in nuclear readiness, deployment, survivability, or capacity relative to July 2026.',
  },
  {
    value: 2,
    label: 'Level 2',
    title: 'Major posture increase',
    description: 'A major expansion or operational shift in nuclear force size, readiness, deployment, or employment posture relative to July 2026.',
  },
]

const potentialNuclearActorDefinitions: readonly PostureDefinition[] = [
  {
    value: 0,
    label: 'Level 0',
    title: 'Non-nuclear reference posture',
    description: 'No operational national nuclear arsenal and no modeled weaponization decision beyond the July 2026 reference.',
  },
  {
    value: 1,
    label: 'Level 1',
    title: 'Weaponization decision or active program',
    description: 'A political decision and active weaponization effort, but no operational nuclear arsenal. Political support contributes pressure but is not itself a weaponization decision.',
  },
  {
    value: 2,
    label: 'Level 2',
    title: 'Operational nuclear arsenal',
    description: 'The actor has fielded a usable national nuclear arsenal and an associated operational posture.',
  },
]

const unitedStatesDefinitions: readonly PostureDefinition[] = [
  {
    value: 'reduced',
    label: 'Reduced',
    title: 'Reduced regional posture',
    description: 'A regional nuclear posture below the July 2026 reference, with reduced visible assurance or theater presence.',
  },
  {
    value: 'baseline',
    label: 'July 2026',
    title: 'July 2026 reference posture',
    description: 'The modeled July 2026 regional nuclear posture and assurance baseline.',
  },
  {
    value: 'forward',
    label: 'Forward',
    title: 'Stronger forward presence',
    description: 'A stronger and more visible forward nuclear presence than the July 2026 reference.',
  },
  {
    value: 'expanded',
    label: 'Expanded theater',
    title: 'Expanded theater posture',
    description: 'A major expansion of theater nuclear deployment or readiness relative to July 2026.',
  },
]

export const POSTURE_DEFINITIONS: Record<NuclearActorId, readonly PostureDefinition[]> = {
  china: existingNuclearPowerDefinitions,
  'north-korea': existingNuclearPowerDefinitions,
  'south-korea': potentialNuclearActorDefinitions,
  japan: potentialNuclearActorDefinitions,
  'united-states': unitedStatesDefinitions,
}

export function getPostureDefinition(actor: NuclearActorId, value: PostureDefinitionValue): PostureDefinition {
  const definition = POSTURE_DEFINITIONS[actor].find((candidate) => candidate.value === value)
  if (!definition) throw new Error(`No posture definition for ${actor}: ${String(value)}`)
  return definition
}
