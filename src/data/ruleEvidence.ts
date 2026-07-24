import type { Confidence } from '../model/types'
import type { EvidenceFamily } from './evidenceTypes'

export interface RuleEvidence {
  confidence: Confidence
  rationale: string
  sourceIds: string[]
}

export const EVIDENCE_BY_FAMILY: Record<EvidenceFamily, RuleEvidence> = {
  china: {
    confidence: 'Medium-low',
    rationale: 'Reviewed force-posture, policy, and wargame sources support the direction of Chinese threat-perception and crisis-decision changes, but not the model’s numeric increments or real-world use probabilities.',
    sourceIds: ['sipri-2026', 'cmpr-2025', 'china-nuclear-policy', 'china-arms-control-2025', 'csis-taiwan-nuclear-wargame'],
  },
  dprk: {
    confidence: 'Medium-low',
    rationale: 'Reviewed official and research sources support greater allied exposure from DPRK advances and map multiple first-use pathways, while the use cases remain illustrative rather than probabilistic.',
    sourceIds: ['sipri-2026', 'japan-defense-2025', 'camp-david-principles', 'korea-nuclear-use-cases'],
  },
  us: {
    confidence: 'Medium',
    rationale: 'Extended-deterrence posture changes assurance and adversary threat perceptions in opposite directions; expert forecasting also treats U.S. regional nuclear deployment as an important risk mediator.',
    sourceIds: ['us-rok-guidelines', 'rok-nuclear-guidelines-2024', 'camp-david-principles', 'china-arms-control-2025', 'onn-us-china-escalation-2030'],
  },
  crisis: {
    confidence: 'Medium-low',
    rationale: 'Reviewed wargames, use cases, and forecasting studies support heightened danger and distinct escalation pathways during active crises, while their limitations prevent direct numeric calibration.',
    sourceIds: ['cmpr-2025', 'taiwan-crisis-study', 'sipri-2026', 'carnegie-escalation-forecasting', 'csis-taiwan-nuclear-wargame', 'korea-nuclear-use-cases', 'onn-us-china-escalation-2030'],
  },
  alliance: {
    confidence: 'Medium-low',
    rationale: 'Reviewed official, survey, policy, wargame, and forecasting research supports assurance, extended-deterrence, and coordination effects; numeric calibration remains qualitative.',
    sourceIds: ['us-rok-guidelines', 'rok-nuclear-guidelines-2024', 'japan-defense-2025', 'japan-rok-cooperation-study', 'china-arms-control-2025', 'japan-rok-wont-go-nuclear', 'rand-rok-nuclear-assurance', 'carnegie-japan-nonnuclear-principles', 'carnegie-rok-alliance-elections', 'csis-taiwan-nuclear-wargame', 'onn-us-china-escalation-2030'],
  },
  defense: {
    confidence: 'Medium-low',
    rationale: 'Defensive and counterstrike capabilities can improve denial while also intensifying security-dilemma pressures.',
    sourceIds: ['thaad-study', 'japan-defense-2025', 'china-arms-control-2025'],
  },
  cooperation: {
    confidence: 'Medium',
    rationale: 'Japan–ROK coordination changes allied resilience and adversary perceptions of combined capability.',
    sourceIds: ['camp-david-principles', 'japan-defense-2025', 'japan-rok-cooperation-study'],
  },
  doctrine: {
    confidence: 'Medium-low',
    rationale: 'Reviewed policy, wargame, scenario, and forecasting evidence supports the direction of risk from permissive, ambiguous, or time-sensitive doctrine, without validating a common effect size.',
    sourceIds: ['cmpr-2025', 'china-nuclear-policy', 'china-arms-control-2025', 'sipri-2026', 'csis-taiwan-nuclear-wargame', 'korea-nuclear-use-cases', 'onn-us-china-escalation-2030'],
  },
  asean: {
    confidence: 'Speculative',
    rationale: 'SEANWFZ documents establish cooperation goals; the modeled exposure effect is an illustrative extrapolation without direct causal evidence.',
    sourceIds: ['seanwfz-treaty', 'asean-outlook'],
  },
  domestic: {
    confidence: 'Speculative',
    rationale: 'Reviewed survey and process-tracing research supports political pressure and reciprocal concern, but party advocacy does not itself establish a government weaponization decision.',
    sourceIds: ['japan-three-nonnuclear-principles', 'japan-rok-cooperation-study', 'japan-rok-wont-go-nuclear', 'rand-rok-nuclear-assurance', 'carnegie-japan-nonnuclear-principles', 'carnegie-rok-alliance-elections'],
  },
  ai: {
    confidence: 'Speculative',
    rationale: 'The reviewed corpus supports selected actor activity, possible mechanisms, limitations, and stabilizing pathways. Every current condition receives a zero model contribution because the exact actor–application–mechanism chain and affected-state nuclear response remain incomplete.',
    sourceIds: [
      'stratcom-ai-nc3-2024',
      'aca-ai-nc3-2025',
      'nti-ai-nuclear-2021',
      'sipri-ai-nuclear-risk-2020',
      'hacking-nuclear-stability-2023',
      'cmpr-2025',
      'openai-malicious-use-2025',
      'google-adversarial-ai-2025',
      'gao-nuclear-cyber-2023',
      'dod-autonomy-3000-09-2023',
      'political-declaration-military-ai-2023',
    ],
  },
}

export function evidenceForRule(ruleId: string): RuleEvidence {
  if (ruleId.startsWith('china-posture')) return EVIDENCE_BY_FAMILY.china
  if (ruleId.startsWith('dprk-posture')) return EVIDENCE_BY_FAMILY.dprk
  if (ruleId.startsWith('us-posture')) return EVIDENCE_BY_FAMILY.us
  if (ruleId.startsWith('rok-posture') || ruleId.startsWith('japan-posture')) return EVIDENCE_BY_FAMILY.domestic
  if (ruleId.startsWith('taiwan-') || ruleId.startsWith('korean-')) return EVIDENCE_BY_FAMILY.crisis
  if (ruleId.startsWith('assurance-') || ruleId.startsWith('conventional-')) return EVIDENCE_BY_FAMILY.alliance
  if (ruleId.startsWith('rok-missile') || ruleId.startsWith('japan-counterstrike')) return EVIDENCE_BY_FAMILY.defense
  if (ruleId.startsWith('cooperation-')) return EVIDENCE_BY_FAMILY.cooperation
  if (ruleId.startsWith('china-doctrine')) return EVIDENCE_BY_FAMILY.doctrine
  if (ruleId.startsWith('asean-')) return EVIDENCE_BY_FAMILY.asean
  return EVIDENCE_BY_FAMILY.domestic
}
