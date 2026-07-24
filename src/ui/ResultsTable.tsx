import { ACTOR_NAMES, REGIONAL_ACTOR_IDS, type AtlasMode, type RegionalActorId, type ScenarioResult } from '../model'

interface ResultsTableProps {
  mode: AtlasMode
  result: ScenarioResult
  onSelect: (actor: RegionalActorId, trigger: HTMLElement) => void
  prominent?: boolean
}

export function ResultsTable({ mode, result, onSelect, prominent = false }: ResultsTableProps) {
  const isAiMode = mode === 'ai'

  return (
    <details className={`results-table-wrap${prominent ? ' results-table-wrap--prominent' : ''}`} open={prominent}>
      <summary>Country results table</summary>
      <div className="table-scroll">
        <table>
          <caption>Comparative escalation exposure by modeled actor</caption>
          <thead><tr>
            <th scope="col">Actor</th>
            <th scope="col">Score</th>
            <th scope="col">Band</th>
            {isAiMode && <th scope="col">AI exposure</th>}
            {isAiMode && <th scope="col">AI pressure</th>}
            <th scope="col">Trace</th>
          </tr></thead>
          <tbody>
            {REGIONAL_ACTOR_IDS.map((actor) => (
              <tr key={actor}>
                <th scope="row">{ACTOR_NAMES[actor]}</th>
                <td>{result.riskScores[actor]}</td>
                <td><span className={`band-label band-label--${result.riskBands[actor].toLowerCase()}`}>{result.riskBands[actor]}</span></td>
                {isAiMode && <td><button className="zero-link" type="button" onClick={(event) => onSelect(actor, event.currentTarget)} aria-label={`Why ${ACTOR_NAMES[actor]} has modeled AI exposure plus zero`}>+0</button></td>}
                {isAiMode && <td><button className="zero-link" type="button" onClick={(event) => onSelect(actor, event.currentTarget)} aria-label={`Why ${ACTOR_NAMES[actor]} has modeled AI proliferation pressure plus zero`}>+0</button></td>}
                <td><button className="text-button" type="button" onClick={(event) => onSelect(actor, event.currentTarget)}>Explain</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}
