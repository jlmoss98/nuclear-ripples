export const EVIDENCE_FAMILIES = [
  'china', 'dprk', 'us', 'crisis', 'alliance',
  'defense', 'cooperation', 'doctrine', 'asean', 'domestic', 'ai',
] as const

export type EvidenceFamily = (typeof EVIDENCE_FAMILIES)[number]
export type ReviewStatus = 'full' | 'targeted' | 'author-reviewed' | 'available-full-text' | 'abstract-only' | 'inaccessible'

export interface SourceReview {
  status: ReviewStatus
  reviewedOn: string
  note: string
  supports: EvidenceFamily[]
}

export function isEvidenceEligible(status: ReviewStatus): boolean {
  return status === 'full' || status === 'targeted' || status === 'author-reviewed'
}

export function reviewStatusLabel(status: ReviewStatus): string {
  return {
    full: 'Full text reviewed',
    targeted: 'Relevant sections reviewed',
    'author-reviewed': 'Author reviewed',
    'available-full-text': 'Full text available — review queued',
    'abstract-only': 'Abstract only',
    inaccessible: 'Could not access',
  }[status]
}
