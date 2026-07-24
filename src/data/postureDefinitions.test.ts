import { describe, expect, it } from 'vitest'
import { getPostureDefinition, POSTURE_DEFINITIONS } from './postureDefinitions'

describe('nuclear posture definitions', () => {
  it('defines level zero for existing nuclear powers as a retained July 2026 posture', () => {
    expect(getPostureDefinition('china', 0).description).toMatch(/retains.*July 2026/i)
    expect(getPostureDefinition('north-korea', 0).description).toMatch(/does not mean.*non-nuclear/i)
  })

  it('defines level one for potential new nuclear actors without implying an arsenal', () => {
    expect(getPostureDefinition('japan', 1).description).toMatch(/no operational nuclear arsenal/i)
    expect(getPostureDefinition('south-korea', 1).description).toMatch(/active weaponization/i)
    expect(getPostureDefinition('japan', 1).description).not.toMatch(/governing-party support/i)
  })

  it('defines level two for potential new nuclear actors as an operational arsenal', () => {
    expect(getPostureDefinition('south-korea', 2).title).toMatch(/operational nuclear arsenal/i)
  })

  it('defines all four named United States postures', () => {
    expect(POSTURE_DEFINITIONS['united-states']).toHaveLength(4)
    expect(getPostureDefinition('united-states', 'expanded').description).toMatch(/major expansion/i)
  })
})
