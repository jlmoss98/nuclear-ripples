import type { RiskBand } from '../model/types'

export interface RiskBandDefinition {
  band: RiskBand
  colorLabel: 'Green' | 'Yellow' | 'Orange' | 'Red'
  minimum: number
  maximum: number
  definition: string
}

export const RISK_BAND_DEFINITIONS: readonly RiskBandDefinition[] = [
  {
    band: 'Low',
    colorLabel: 'Green',
    minimum: 0,
    maximum: 24,
    definition: 'Limited exposure to modeled escalation conditions; little additional proliferation pressure is implied.',
  },
  {
    band: 'Guarded',
    colorLabel: 'Yellow',
    minimum: 25,
    maximum: 49,
    definition: 'Meaningful but contained exposure. Some conditions could strengthen hedging incentives, but no posture change is implied.',
  },
  {
    band: 'High',
    colorLabel: 'Orange',
    minimum: 50,
    maximum: 74,
    definition: 'Substantial exposure from strong or compounding conditions; incentives may increase for nuclear hedging or steps toward acquiring, expanding, or operationalizing nuclear capabilities.',
  },
  {
    band: 'Critical',
    colorLabel: 'Red',
    minimum: 75,
    maximum: 100,
    definition: 'The atlas’s highest exposure range. Acute or compounding conditions may strongly intensify incentives to acquire, expand, or operationalize nuclear capabilities, but an outcome is not assumed.',
  },
]
