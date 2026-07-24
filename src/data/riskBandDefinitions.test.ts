import { describe, expect, it } from 'vitest'
import { riskBand } from '../model/engine'
import { RISK_BAND_DEFINITIONS } from './riskBandDefinitions'

describe('proliferation-risk band definitions', () => {
  it('defines the complete contiguous 0–100 scale, including green', () => {
    expect(RISK_BAND_DEFINITIONS).toEqual([
      expect.objectContaining({ band: 'Low', colorLabel: 'Green', minimum: 0, maximum: 24 }),
      expect.objectContaining({ band: 'Guarded', colorLabel: 'Yellow', minimum: 25, maximum: 49 }),
      expect.objectContaining({ band: 'High', colorLabel: 'Orange', minimum: 50, maximum: 74 }),
      expect.objectContaining({ band: 'Critical', colorLabel: 'Red', minimum: 75, maximum: 100 }),
    ])

    expect(RISK_BAND_DEFINITIONS.every(({ definition }) => definition.length > 40)).toBe(true)
    expect(RISK_BAND_DEFINITIONS[0].minimum).toBe(0)
    expect(RISK_BAND_DEFINITIONS.at(-1)?.maximum).toBe(100)

    for (let index = 1; index < RISK_BAND_DEFINITIONS.length; index += 1) {
      expect(RISK_BAND_DEFINITIONS[index].minimum)
        .toBe(RISK_BAND_DEFINITIONS[index - 1].maximum + 1)
    }
  })

  it('matches the engine band at both ends of every displayed range', () => {
    for (const definition of RISK_BAND_DEFINITIONS) {
      expect(riskBand(definition.minimum)).toBe(definition.band)
      expect(riskBand(definition.maximum)).toBe(definition.band)
    }
  })
})
