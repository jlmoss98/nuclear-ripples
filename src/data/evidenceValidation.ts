import { EVIDENCE_FAMILIES, isEvidenceEligible, type EvidenceFamily } from './evidenceTypes'
import type { RuleEvidence } from './ruleEvidence'
import type { Source } from './sources'

export function validateEvidenceRegistry(
  sources: Source[],
  evidenceByFamily: Record<EvidenceFamily, RuleEvidence>,
): string[] {
  const byId = new Map(sources.map((source) => [source.id, source]))
  const errors: string[] = []

  for (const family of EVIDENCE_FAMILIES) {
    for (const sourceId of evidenceByFamily[family].sourceIds) {
      const source = byId.get(sourceId)
      if (!source) {
        errors.push(`${family}: source ${sourceId} is not registered`)
      } else if (!isEvidenceEligible(source.review.status)) {
        errors.push(`${family}: source ${sourceId} has ineligible review status ${source.review.status}`)
      } else if (!source.review.supports.includes(family)) {
        errors.push(`${family}: source ${sourceId} does not declare support for ${family}`)
      }
    }
  }

  return errors
}
