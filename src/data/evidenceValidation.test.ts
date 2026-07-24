import { describe, expect, it } from 'vitest'
import { validateEvidenceRegistry } from './evidenceValidation'
import type { Source } from './sources'
import type { RuleEvidence } from './ruleEvidence'
import { EVIDENCE_FAMILIES, isEvidenceEligible, reviewStatusLabel, type EvidenceFamily } from './evidenceTypes'

const source = (overrides: Partial<Source> = {}): Source => ({
  id: 'reviewed',
  title: 'Reviewed source',
  publisher: 'Publisher',
  year: 2026,
  url: 'https://example.com/reviewed',
  kind: 'research',
  language: 'English',
  review: {
    status: 'full',
    reviewedOn: '2026-07-21',
    note: 'Full text reviewed.',
    supports: ['china'],
  },
  ...overrides,
})

const evidence = (sourceIds: string[]): Record<EvidenceFamily, RuleEvidence> =>
  Object.fromEntries(
    EVIDENCE_FAMILIES.map((family) => [family, {
      confidence: 'Speculative',
      rationale: 'Illustrative relationship.',
      sourceIds: family === 'china' ? sourceIds : [],
    }]),
  ) as Record<EvidenceFamily, RuleEvidence>

describe('validateEvidenceRegistry', () => {
  it('treats author-reviewed text as eligible and labels it transparently', () => {
    expect(isEvidenceEligible('author-reviewed')).toBe(true)
    expect(reviewStatusLabel('author-reviewed')).toBe('Author reviewed')
  })

  it('keeps accessible but unreviewed full text out of active evidence', () => {
    expect(isEvidenceEligible('available-full-text')).toBe(false)
    expect(reviewStatusLabel('available-full-text')).toBe('Full text available — review queued')
  })

  it('accepts reviewed sources that declare support for their family', () => {
    expect(validateEvidenceRegistry([source()], evidence(['reviewed']))).toEqual([])
  })

  it('rejects missing, inaccessible, and family-mismatched sources with actionable errors', () => {
    const inaccessible = source({
      id: 'blocked',
      review: { status: 'inaccessible', reviewedOn: '2026-07-21', note: '403.', supports: [] },
    })
    const wrongFamily = source({
      id: 'wrong-family',
      review: { status: 'targeted', reviewedOn: '2026-07-21', note: 'Sections reviewed.', supports: ['defense'] },
    })

    expect(validateEvidenceRegistry(
      [inaccessible, wrongFamily],
      evidence(['missing', 'blocked', 'wrong-family']),
    )).toEqual([
      'china: source missing is not registered',
      'china: source blocked has ineligible review status inaccessible',
      'china: source wrong-family does not declare support for china',
    ])
  })
})
