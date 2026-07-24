import { describe, expect, it } from 'vitest'
import { AI_CONTROL_GROUPS, DEFAULT_AI_CONTROLS, buildAiAssessments } from './aiConditions'
import type { AiControls } from '../model/types'
import { EVIDENCE_BY_FAMILY } from './ruleEvidence'
import { SOURCES } from './sources'
import { isEvidenceEligible } from './evidenceTypes'

const allSelected: AiControls = {
  alliedMissileDefense: 'selected',
  chinaMissileDefense: 'selected',
  usEarlyWarning: 'selected',
  chinaEarlyWarning: 'selected',
  usNc3CyberTarget: 'china',
  chinaNc3Cyber: 'selected',
  dprkNc3Cyber: 'selected',
  usAutonomousNearChina: 'selected',
  chinaAutonomousNearAllies: 'selected',
  dprkSyntheticDeception: 'selected',
}

describe('AI condition assessments', () => {
  it('starts with every AI condition unselected', () => {
    expect(buildAiAssessments(DEFAULT_AI_CONTROLS)).toEqual([])
  })

  it('keeps every selected current condition at zero with citations', () => {
    const assessments = buildAiAssessments(allSelected)

    expect(assessments).toHaveLength(10)
    expect(assessments.every(({ exposureDelta }) => exposureDelta === 0)).toBe(true)
    expect(assessments.every(({ pressureDelta }) => pressureDelta === 0)).toBe(true)
    expect(assessments.every(({ sourceIds }) => sourceIds.length > 0)).toBe(true)
    expect(assessments.every(({ missingEvidence }) => missingEvidence.length > 20)).toBe(true)
  })

  it('uses the selected U.S. cyber target as the proposed affected actor', () => {
    expect(buildAiAssessments(allSelected).find(({ id }) => id === 'us-nc3-cyber')?.affectedActors)
      .toEqual(['china'])
  })

  it('defines ten controls across five application groups', () => {
    expect(AI_CONTROL_GROUPS.flatMap(({ controls }) => controls)).toHaveLength(10)
  })

  it('discriminates binary controls from the U.S. NC3 target control', () => {
    const controls = AI_CONTROL_GROUPS.flatMap(({ controls }) => controls)
    const keys = controls.map(({ key }) => key)
    const ids = controls.map(({ id }) => id)

    expect(new Set(keys).size).toBe(keys.length)
    expect(new Set(ids).size).toBe(ids.length)
    expect(controls.find(({ key }) => key === 'usNc3CyberTarget')).toMatchObject({ kind: 'target' })
    expect(controls.filter(({ key }) => key !== 'usNc3CyberTarget')
      .every((control) => 'kind' in control && control.kind === 'binary')).toBe(true)
  })

  it('keeps every selected assessment citation unique, registered, eligible, and AI-supporting', () => {
    const aiFamilyIds = new Set(EVIDENCE_BY_FAMILY.ai.sourceIds)

    for (const selectedAssessment of buildAiAssessments(allSelected)) {
      expect(new Set(selectedAssessment.sourceIds).size).toBe(selectedAssessment.sourceIds.length)

      for (const sourceId of selectedAssessment.sourceIds) {
        expect(aiFamilyIds.has(sourceId)).toBe(true)
        const matches = SOURCES.filter(({ id }) => id === sourceId)
        expect(matches).toHaveLength(1)
        expect(matches[0].review.status).toBe('full')
        expect(isEvidenceEligible(matches[0].review.status)).toBe(true)
        expect(matches[0].review.supports).toContain('ai')
      }
    }
  })
})
