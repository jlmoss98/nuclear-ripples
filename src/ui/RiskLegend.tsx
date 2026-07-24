import { RISK_BAND_DEFINITIONS } from '../data/riskBandDefinitions'

const PROLIFERATION_RISK_DEFINITION =
  'Proliferation risk means comparative exposure to conditions that may increase incentives for nuclear hedging or posture change. It is not a probability or forecast.'

export function RiskLegend() {
  return (
    <section className="risk-definition" aria-labelledby="risk-definition-title">
      <div className="risk-definition__heading">
        <p className="eyebrow">How to read the colors</p>
        <h2 id="risk-definition-title">Proliferation risk</h2>
        <p>{PROLIFERATION_RISK_DEFINITION}</p>
      </div>
      <ul className="risk-definition__scale">
        {RISK_BAND_DEFINITIONS.map(({ band, colorLabel, minimum, maximum, definition }) => {
          const label = `${colorLabel} · ${band}`
          const range = `${minimum}–${maximum}`

          return (
            <li key={band} aria-label={`${label} ${range}`}>
              <span
                className={`risk-definition__swatch risk-definition__swatch--${band.toLowerCase()}`}
                aria-hidden="true"
              />
              <div>
                <p className="risk-definition__label">
                  <strong>{label}</strong>
                  <span>{range}</span>
                </p>
                <p>{definition}</p>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
