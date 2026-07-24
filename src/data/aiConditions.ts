import type {
  AiAssessment,
  AiConditionId,
  AiControls,
  RegionalActorId,
} from '../model/types'

export const DEFAULT_AI_CONTROLS: AiControls = {
  alliedMissileDefense: 'off',
  chinaMissileDefense: 'off',
  usEarlyWarning: 'off',
  chinaEarlyWarning: 'off',
  usNc3CyberTarget: 'none',
  chinaNc3Cyber: 'off',
  dprkNc3Cyber: 'off',
  usAutonomousNearChina: 'off',
  chinaAutonomousNearAllies: 'off',
  dprkSyntheticDeception: 'off',
}

interface AiControlDefinitionBase {
  id: AiConditionId
  label: string
  question: string
}

type BinaryAiControlKey = Exclude<keyof AiControls, 'usNc3CyberTarget'>

export type AiControlDefinition =
  | (AiControlDefinitionBase & { kind: 'binary'; key: BinaryAiControlKey })
  | (AiControlDefinitionBase & { kind: 'target'; key: 'usNc3CyberTarget' })

export const AI_CONTROL_GROUPS: Array<{ title: string; controls: AiControlDefinition[] }> = [
  {
    title: 'AI-integrated missile defense',
    controls: [
      { kind: 'binary', key: 'alliedMissileDefense', id: 'allied-missile-defense', label: 'U.S.–Japan–South Korea AI-integrated missile defense', question: 'Include the proposed allied AI-integrated system?' },
      { kind: 'binary', key: 'chinaMissileDefense', id: 'china-missile-defense', label: 'Chinese AI-integrated missile defense', question: 'Include the proposed Chinese AI-integrated system?' },
    ],
  },
  {
    title: 'Nuclear early warning and decision support',
    controls: [
      { kind: 'binary', key: 'usEarlyWarning', id: 'us-early-warning', label: 'U.S. AI use in nuclear early warning and decision support', question: 'Include the proposed U.S. application?' },
      { kind: 'binary', key: 'chinaEarlyWarning', id: 'china-early-warning', label: 'Chinese AI use in nuclear early warning and decision support', question: 'Include the proposed Chinese application?' },
    ],
  },
  {
    title: 'AI-assisted cyberattacks',
    controls: [
      { kind: 'target', key: 'usNc3CyberTarget', id: 'us-nc3-cyber', label: 'U.S. AI-assisted cyberattack against nuclear command, control, and communications', question: 'Which proposed NC3 target is modeled?' },
      { kind: 'binary', key: 'chinaNc3Cyber', id: 'china-nc3-cyber', label: 'Chinese AI-assisted cyberattack against U.S. or allied nuclear command, control, and communications', question: 'Include the proposed Chinese operation?' },
      { kind: 'binary', key: 'dprkNc3Cyber', id: 'dprk-nc3-cyber', label: 'North Korean AI-assisted cyberattack against U.S. or allied nuclear command, control, and communications', question: 'Include the proposed North Korean operation?' },
    ],
  },
  {
    title: 'Autonomous conventional operations',
    controls: [
      { kind: 'binary', key: 'usAutonomousNearChina', id: 'us-autonomous-near-china', label: 'U.S. autonomous conventional systems operating near Chinese strategic forces', question: 'Include the proposed U.S. operation?' },
      { kind: 'binary', key: 'chinaAutonomousNearAllies', id: 'china-autonomous-near-allies', label: 'Chinese autonomous conventional systems operating near U.S. or allied strategic forces', question: 'Include the proposed Chinese operation?' },
    ],
  },
  {
    title: 'Synthetic military deception',
    controls: [
      { kind: 'binary', key: 'dprkSyntheticDeception', id: 'dprk-synthetic-deception', label: 'North Korean AI-generated military deception during a Korean Peninsula crisis', question: 'Include the proposed North Korean deception operation?' },
    ],
  },
]

type AssessmentInput = Omit<AiAssessment, 'exposureDelta' | 'pressureDelta' | 'evidenceStatus'>

const zeroAssessment = (input: AssessmentInput): AiAssessment => ({
  ...input,
  exposureDelta: 0,
  pressureDelta: 0,
  evidenceStatus: 'exact-condition-not-established',
})

const assessment = (
  id: AiConditionId,
  label: string,
  affectedActors: RegionalActorId[],
  supportedFinding: string,
  missingEvidence: string,
  stabilizingPathway: string,
  sourceIds: string[],
) => zeroAssessment({ id, label, affectedActors, supportedFinding, missingEvidence, stabilizingPathway, sourceIds })

export function buildAiAssessments(controls: AiControls): AiAssessment[] {
  const results: AiAssessment[] = []
  const add = (value: AiAssessment) => results.push(value)

  if (controls.alliedMissileDefense === 'selected') add(assessment(
    'allied-missile-defense',
    'U.S.–Japan–South Korea AI-integrated missile defense',
    ['china', 'north-korea'],
    'The literature develops prospective AI and missile-defense mechanisms.',
    'No reviewed source establishes the named trilateral AI-integrated capability or a resulting Chinese or North Korean nuclear response.',
    'Better warning, discrimination, human supervision, and testing can also be stabilizing.',
    ['nti-ai-nuclear-2021', 'sipri-ai-nuclear-risk-2020'],
  ))

  if (controls.chinaMissileDefense === 'selected') add(assessment(
    'china-missile-defense',
    'Chinese AI-integrated missile defense',
    ['japan', 'south-korea', 'taiwan'],
    'The literature discusses Chinese missile defense and military AI.',
    'The reviewed sources discuss those capabilities separately and do not establish the named integration or an affected-state nuclear response.',
    'Technical uncertainty and defensive warning benefits remain credible counterpaths.',
    ['sipri-ai-nuclear-risk-2020', 'cmpr-2025'],
  ))

  if (controls.usEarlyWarning === 'selected') add(assessment(
    'us-early-warning',
    'U.S. AI use in nuclear early warning and decision support',
    ['china', 'north-korea'],
    'U.S. Strategic Command has stated an intent to integrate AI into NC3 modernization while retaining human control.',
    'Intent does not establish operational use of the exact condition, and no reviewed source traces an affected-state nuclear response.',
    'Human authorization, independent sensors, redundancy, and verification can reduce risk.',
    ['stratcom-ai-nc3-2024', 'aca-ai-nc3-2025', 'sipri-ai-nuclear-risk-2020'],
  ))

  if (controls.chinaEarlyWarning === 'selected') add(assessment(
    'china-early-warning',
    'Chinese AI use in nuclear early warning and decision support',
    ['japan', 'south-korea', 'taiwan'],
    'The literature documents general PLA decision-assistance ambitions and Chinese nuclear early-warning development.',
    'No reviewed source establishes AI integration into the nuclear system or an affected-state nuclear response.',
    'Human control, redundancy, and technical immaturity provide counterevidence.',
    ['sipri-ai-nuclear-risk-2020', 'cmpr-2025', 'aca-ai-nc3-2025'],
  ))

  if (controls.usNc3CyberTarget !== 'none') add(assessment(
    'us-nc3-cyber',
    `U.S. AI-assisted cyberattack against ${controls.usNc3CyberTarget === 'china' ? 'Chinese' : 'North Korean'} nuclear command, control, and communications`,
    [controls.usNc3CyberTarget],
    'The literature supports a generic cyber–NC3 escalation mechanism.',
    'No reviewed source documents the named U.S. AI-assisted operation, AI’s incremental effect, or a target-state nuclear response.',
    'Uncertain exploit effectiveness, NC3 resilience, and vulnerability-induced restraint are credible counterpaths.',
    ['sipri-ai-nuclear-risk-2020', 'hacking-nuclear-stability-2023'],
  ))

  if (controls.chinaNc3Cyber === 'selected') add(assessment(
    'china-nc3-cyber',
    'Chinese AI-assisted cyberattack against U.S. or allied nuclear command, control, and communications',
    ['japan', 'south-korea'],
    'Chinese actors use generative AI for some reconnaissance, coding, and social-engineering tasks.',
    'No reviewed source connects Chinese AI use, an NC3 target, operational effect, and an affected-state nuclear response.',
    'Provider safeguards, defensive AI, network resilience, and the absence of novel capability weaken the chain.',
    ['openai-malicious-use-2025', 'google-adversarial-ai-2025', 'cmpr-2025', 'hacking-nuclear-stability-2023'],
  ))

  if (controls.dprkNc3Cyber === 'selected') add(assessment(
    'dprk-nc3-cyber',
    'North Korean AI-assisted cyberattack against U.S. or allied nuclear command, control, and communications',
    ['japan', 'south-korea'],
    'Likely North Korean actors use generative AI for broad cyber and deceptive-employment tasks.',
    'No reviewed source establishes NC3 targeting, AI’s incremental operational effect, or an allied nuclear response.',
    'Model refusals, provider disruption, hardened NC3, and the absence of novel capability weaken the chain.',
    ['openai-malicious-use-2025', 'google-adversarial-ai-2025', 'sipri-ai-nuclear-risk-2020', 'hacking-nuclear-stability-2023'],
  ))

  if (controls.usAutonomousNearChina === 'selected') add(assessment(
    'us-autonomous-near-china',
    'U.S. autonomous conventional systems operating near Chinese strategic forces',
    ['china'],
    'U.S. autonomous-system development and generic entanglement mechanisms are documented.',
    'No reviewed source establishes the named operation near Chinese strategic forces or a Chinese nuclear response.',
    'Human judgment, testing, notification, and documented non-escalatory encounters provide counterpaths.',
    ['sipri-ai-nuclear-risk-2020', 'dod-autonomy-3000-09-2023', 'political-declaration-military-ai-2023'],
  ))

  if (controls.chinaAutonomousNearAllies === 'selected') add(assessment(
    'china-autonomous-near-allies',
    'Chinese autonomous conventional systems operating near U.S. or allied strategic forces',
    ['japan', 'south-korea'],
    'Chinese autonomous-system development and generic ambiguity mechanisms are documented.',
    'No reviewed source establishes the exact operational context or an affected-state nuclear response.',
    'Human control, communication, and governance commitments provide counterpaths.',
    ['sipri-ai-nuclear-risk-2020', 'cmpr-2025', 'political-declaration-military-ai-2023'],
  ))

  if (controls.dprkSyntheticDeception === 'selected') add(assessment(
    'dprk-synthetic-deception',
    'North Korean AI-generated military deception during a Korean Peninsula crisis',
    ['north-korea', 'south-korea', 'japan'],
    'The literature describes synthetic-deception mechanisms and some North Korean deceptive activity.',
    'No reviewed source documents the named military-crisis operation or an allied nuclear response.',
    'Intelligence cross-checking, detection, platform disruption, and limited demonstrated influence provide counterpaths.',
    ['sipri-ai-nuclear-risk-2020', 'openai-malicious-use-2025', 'google-adversarial-ai-2025'],
  ))

  return results
}
