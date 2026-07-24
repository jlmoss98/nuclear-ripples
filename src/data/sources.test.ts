import { describe, expect, it } from 'vitest'
import { EVIDENCE_BY_FAMILY, evidenceForRule } from './ruleEvidence'
import { SOURCES } from './sources'
import { validateEvidenceRegistry } from './evidenceValidation'

describe('audited evidence register', () => {
  it('passes the active evidence contract', () => {
    expect(validateEvidenceRegistry(SOURCES, EVIDENCE_BY_FAMILY)).toEqual([])
  })

  it('records an ISO review date and note for every source', () => {
    for (const source of SOURCES) {
      expect(source.review.reviewedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(source.review.note.length).toBeGreaterThan(10)
    }
  })

  it('corrects mismatched records', () => {
    expect(SOURCES.find(({ id }) => id === 'sipri-2026')?.title)
      .toBe('Increasing focus on nuclear weapons amid heightened escalation risks—new SIPRI Yearbook out now')
    expect(SOURCES.some(({ id }) => id === 'korean-conflict-study')).toBe(false)
    expect(SOURCES.some(({ id }) => id === 'japan-defense-2025-ja')).toBe(false)
    expect(SOURCES.some(({ id }) => id === 'alliance-proliferation-study')).toBe(false)
    expect(SOURCES.some(({ id }) => id === 'proliferation-opinion-study')).toBe(false)
    expect(SOURCES.find(({ id }) => id === 'japan-rok-cooperation-study')).toMatchObject({
      title: 'U.S.-South Korea Alliance: Issues for Congress',
      url: 'https://www.congress.gov/crs-product/IF11388',
    })
  })

  it('uses one reviewed Japan defense record for supported families', () => {
    const japan = SOURCES.find(({ id }) => id === 'japan-defense-2025')
    expect(japan?.review).toMatchObject({ status: 'targeted' })
    expect(japan?.review.supports).toEqual(['dprk', 'alliance', 'defense', 'cooperation'])
  })

  it('uses author-reviewed Foreign Affairs text as active evidence', () => {
    const activeIds = new Set(Object.values(EVIDENCE_BY_FAMILY).flatMap(({ sourceIds }) => sourceIds))
    expect(activeIds.has('japan-rok-wont-go-nuclear')).toBe(true)
    expect(SOURCES.find(({ id }) => id === 'japan-rok-wont-go-nuclear')?.review).toEqual({
      status: 'author-reviewed',
      reviewedOn: '2026-07-21',
      note: 'Full article text supplied by the atlas author and reviewed closely; supports elite-attitude responses to U.S. drawdown and reciprocal Japan–ROK proliferation scenarios.',
      supports: ['alliance', 'domestic'],
    })
    expect(evidenceForRule('assurance-strengthened').confidence).toBe('Medium-low')
  })

  it('activates the reviewed ASEAN Outlook without changing speculative confidence', () => {
    expect(SOURCES.find(({ id }) => id === 'asean-outlook')?.review).toMatchObject({
      status: 'full',
      supports: ['asean'],
    })
    expect(EVIDENCE_BY_FAMILY.asean).toMatchObject({
      confidence: 'Speculative',
      sourceIds: ['seanwfz-treaty', 'asean-outlook'],
    })
  })

  it('activates the three fully reviewed research-gap reports without upgrading confidence', () => {
    const reviewed = {
      'csis-taiwan-nuclear-wargame': ['china', 'crisis', 'alliance', 'doctrine'],
      'korea-nuclear-use-cases': ['dprk', 'crisis', 'doctrine'],
      'onn-us-china-escalation-2030': ['us', 'crisis', 'alliance', 'doctrine'],
    }
    const activeIds = new Set(Object.values(EVIDENCE_BY_FAMILY).flatMap(({ sourceIds }) => sourceIds))

    for (const [id, supports] of Object.entries(reviewed)) {
      expect(SOURCES.find((source) => source.id === id)?.review).toMatchObject({
        status: 'full',
        supports,
      })
      expect(activeIds.has(id)).toBe(true)
    }
    expect(EVIDENCE_BY_FAMILY.china.confidence).toBe('Medium-low')
    expect(EVIDENCE_BY_FAMILY.dprk.confidence).toBe('Medium-low')
    expect(EVIDENCE_BY_FAMILY.us.confidence).toBe('Medium')
    expect(EVIDENCE_BY_FAMILY.crisis.confidence).toBe('Medium-low')
    expect(EVIDENCE_BY_FAMILY.alliance.confidence).toBe('Medium-low')
    expect(EVIDENCE_BY_FAMILY.doctrine.confidence).toBe('Medium-low')
  })

  it('activates the targeted RAND and Carnegie findings without upgrading confidence', () => {
    const activeIds = new Set(Object.values(EVIDENCE_BY_FAMILY).flatMap(({ sourceIds }) => sourceIds))
    const reviewed = {
      'carnegie-escalation-forecasting': ['crisis'],
      'rand-rok-nuclear-assurance': ['alliance', 'domestic'],
      'carnegie-japan-nonnuclear-principles': ['alliance', 'domestic'],
      'carnegie-rok-alliance-elections': ['alliance', 'domestic'],
    }

    for (const [id, supports] of Object.entries(reviewed)) {
      expect(SOURCES.find((source) => source.id === id)?.review).toMatchObject({ status: 'targeted', supports })
      expect(activeIds.has(id)).toBe(true)
    }
    expect(EVIDENCE_BY_FAMILY.alliance.confidence).toBe('Medium-low')
    expect(EVIDENCE_BY_FAMILY.domestic.confidence).toBe('Speculative')
    expect(EVIDENCE_BY_FAMILY.crisis.confidence).toBe('Medium-low')
  })

  it('registers the eleven fully reviewed AI sources without treating them as score calibration', () => {
    const aiIds = EVIDENCE_BY_FAMILY.ai.sourceIds

    expect(aiIds).toHaveLength(11)
    for (const id of aiIds) {
      expect(SOURCES.find((source) => source.id === id)?.review).toMatchObject({
        status: 'full',
        supports: expect.arrayContaining(['ai']),
      })
    }
    expect(EVIDENCE_BY_FAMILY.ai).toMatchObject({
      confidence: 'Speculative',
      rationale: expect.stringMatching(/zero model contribution.*chain.*remain incomplete/i),
    })
  })

  it('preserves the approved evidence families and confidence labels', () => {
    expect(EVIDENCE_BY_FAMILY).toEqual({
      china: expect.objectContaining({ confidence: 'Medium-low', sourceIds: ['sipri-2026', 'cmpr-2025', 'china-nuclear-policy', 'china-arms-control-2025', 'csis-taiwan-nuclear-wargame'] }),
      dprk: expect.objectContaining({ confidence: 'Medium-low', sourceIds: ['sipri-2026', 'japan-defense-2025', 'camp-david-principles', 'korea-nuclear-use-cases'] }),
      us: expect.objectContaining({ confidence: 'Medium', sourceIds: ['us-rok-guidelines', 'rok-nuclear-guidelines-2024', 'camp-david-principles', 'china-arms-control-2025', 'onn-us-china-escalation-2030'] }),
      crisis: expect.objectContaining({ confidence: 'Medium-low', sourceIds: ['cmpr-2025', 'taiwan-crisis-study', 'sipri-2026', 'carnegie-escalation-forecasting', 'csis-taiwan-nuclear-wargame', 'korea-nuclear-use-cases', 'onn-us-china-escalation-2030'] }),
      alliance: expect.objectContaining({ confidence: 'Medium-low', sourceIds: ['us-rok-guidelines', 'rok-nuclear-guidelines-2024', 'japan-defense-2025', 'japan-rok-cooperation-study', 'china-arms-control-2025', 'japan-rok-wont-go-nuclear', 'rand-rok-nuclear-assurance', 'carnegie-japan-nonnuclear-principles', 'carnegie-rok-alliance-elections', 'csis-taiwan-nuclear-wargame', 'onn-us-china-escalation-2030'] }),
      defense: expect.objectContaining({ confidence: 'Medium-low', sourceIds: ['thaad-study', 'japan-defense-2025', 'china-arms-control-2025'] }),
      cooperation: expect.objectContaining({ confidence: 'Medium', sourceIds: ['camp-david-principles', 'japan-defense-2025', 'japan-rok-cooperation-study'] }),
      doctrine: expect.objectContaining({ confidence: 'Medium-low', sourceIds: ['cmpr-2025', 'china-nuclear-policy', 'china-arms-control-2025', 'sipri-2026', 'csis-taiwan-nuclear-wargame', 'korea-nuclear-use-cases', 'onn-us-china-escalation-2030'] }),
      asean: expect.objectContaining({ confidence: 'Speculative', sourceIds: ['seanwfz-treaty', 'asean-outlook'] }),
      domestic: expect.objectContaining({ confidence: 'Speculative', sourceIds: ['japan-three-nonnuclear-principles', 'japan-rok-cooperation-study', 'japan-rok-wont-go-nuclear', 'rand-rok-nuclear-assurance', 'carnegie-japan-nonnuclear-principles', 'carnegie-rok-alliance-elections'] }),
      ai: expect.objectContaining({
        confidence: 'Speculative',
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
      }),
    })
  })

  it('preserves every reviewed source disposition', () => {
    const dispositions = Object.fromEntries(SOURCES.map(({ id, review }) => [id, {
      status: review.status,
      supports: review.supports,
    }]))

    expect(dispositions).toEqual({
      'sipri-2026': { status: 'full', supports: ['china', 'dprk', 'crisis', 'doctrine'] },
      'cmpr-2025': { status: 'full', supports: ['china', 'crisis', 'doctrine', 'ai'] },
      'china-nuclear-policy': { status: 'full', supports: ['china', 'doctrine'] },
      'china-arms-control-2025': { status: 'full', supports: ['china', 'us', 'alliance', 'defense', 'doctrine'] },
      'japan-defense-2025': { status: 'targeted', supports: ['dprk', 'alliance', 'defense', 'cooperation'] },
      'japan-three-nonnuclear-principles': { status: 'full', supports: ['domestic'] },
      'rok-defense-white-paper-2022': { status: 'inaccessible', supports: [] },
      'rok-nuclear-guidelines-2024': { status: 'full', supports: ['us', 'alliance'] },
      'us-rok-guidelines': { status: 'full', supports: ['us', 'alliance'] },
      'camp-david-principles': { status: 'full', supports: ['dprk', 'us', 'cooperation'] },
      'seanwfz-treaty': { status: 'full', supports: ['asean'] },
      'asean-outlook': { status: 'full', supports: ['asean'] },
      'japan-rok-wont-go-nuclear': { status: 'author-reviewed', supports: ['alliance', 'domestic'] },
      'taiwan-crisis-study': { status: 'targeted', supports: ['crisis'] },
      'thaad-study': { status: 'full', supports: ['defense'] },
      'japan-rok-cooperation-study': { status: 'targeted', supports: ['alliance', 'cooperation', 'domestic'] },
      'csis-taiwan-nuclear-wargame': { status: 'full', supports: ['china', 'crisis', 'alliance', 'doctrine'] },
      'carnegie-escalation-forecasting': { status: 'targeted', supports: ['crisis'] },
      'korea-nuclear-use-cases': { status: 'full', supports: ['dprk', 'crisis', 'doctrine'] },
      'rand-rok-nuclear-assurance': { status: 'targeted', supports: ['alliance', 'domestic'] },
      'carnegie-japan-nonnuclear-principles': { status: 'targeted', supports: ['alliance', 'domestic'] },
      'carnegie-rok-alliance-elections': { status: 'targeted', supports: ['alliance', 'domestic'] },
      'onn-us-china-escalation-2030': { status: 'full', supports: ['us', 'crisis', 'alliance', 'doctrine'] },
      'stratcom-ai-nc3-2024': { status: 'full', supports: ['ai'] },
      'aca-ai-nc3-2025': { status: 'full', supports: ['ai'] },
      'nti-ai-nuclear-2021': { status: 'full', supports: ['ai'] },
      'sipri-ai-nuclear-risk-2020': { status: 'full', supports: ['ai'] },
      'hacking-nuclear-stability-2023': { status: 'full', supports: ['ai'] },
      'openai-malicious-use-2025': { status: 'full', supports: ['ai'] },
      'google-adversarial-ai-2025': { status: 'full', supports: ['ai'] },
      'gao-nuclear-cyber-2023': { status: 'full', supports: ['ai'] },
      'dod-autonomy-3000-09-2023': { status: 'full', supports: ['ai'] },
      'political-declaration-military-ai-2023': { status: 'full', supports: ['ai'] },
    })
  })
})
