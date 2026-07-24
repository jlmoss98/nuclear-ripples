import { AI_CONTROL_GROUPS, buildAiAssessments } from '../data/aiConditions'
import { SOURCES } from '../data/sources'
import { ACTOR_NAMES, type AiConditionId, type AiControls as AiControlsState } from '../model'
import { SegmentedControl } from './SegmentedControl'

interface AiControlsProps {
  controls: AiControlsState
  onChange: <K extends keyof AiControlsState>(key: K, value: AiControlsState[K], label: string) => void
}

const binaryOptions = [
  { value: 'off' as const, label: 'Not selected' },
  { value: 'selected' as const, label: 'Selected' },
]

const targetOptions = [
  { value: 'none' as const, label: 'None' },
  { value: 'china' as const, label: 'China' },
  { value: 'north-korea' as const, label: 'North Korea' },
]

const proposedAffectedCountries: Record<AiConditionId, string> = {
  'allied-missile-defense': 'China and North Korea',
  'china-missile-defense': 'Japan, South Korea, and Taiwan',
  'us-early-warning': 'China and North Korea',
  'china-early-warning': 'Japan, South Korea, and Taiwan',
  'us-nc3-cyber': 'China or North Korea (one target at a time)',
  'china-nc3-cyber': 'Japan and South Korea',
  'dprk-nc3-cyber': 'Japan and South Korea',
  'us-autonomous-near-china': 'China',
  'china-autonomous-near-allies': 'Japan and South Korea',
  'dprk-synthetic-deception': 'North Korea, South Korea, and Japan',
}

export function AiControls({ controls, onChange }: AiControlsProps) {
  const assessments = buildAiAssessments(controls)

  return (
    <>
      <section className="ai-layer-note" aria-labelledby="ai-controls-title">
        <p className="eyebrow">Strict evidence standard</p>
        <h2 id="ai-controls-title">AI conditions</h2>
        <p>Experimental AI layer. These options model hypothetical escalation exposure. They contribute 0 proliferation-pressure points and cannot trigger a modeled nuclear-posture reaction.</p>
      </section>

      {AI_CONTROL_GROUPS.map((group) => (
        <section className="control-group" key={group.title}>
          <h2>{group.title}</h2>
          {group.controls.map((control) => {
            const assessment = assessments.find(({ id }) => id === control.id)

            return (
              <div className="control-field" key={control.key}>
                <h3>{control.label}</h3>
                <p>{control.question}</p>
                <p><strong>Proposed affected countries:</strong> {proposedAffectedCountries[control.id]}</p>
                <p><strong>Exact condition not established</strong></p>
                {control.kind === 'target' ? (
                  <SegmentedControl
                    label={control.label}
                    value={controls[control.key]}
                    options={targetOptions}
                    onChange={(next, label) => onChange(control.key, next, label)}
                  />
                ) : (
                  <SegmentedControl
                    label={control.label}
                    value={controls[control.key]}
                    options={binaryOptions}
                    onChange={(next, label) => onChange(control.key, next, label)}
                  />
                )}
                {assessment && (
                  <details className="ai-evidence" open>
                    <summary>Why +0?</summary>
                    <p><strong>Selected proposed affected countries:</strong> {assessment.affectedActors.map((actor) => ACTOR_NAMES[actor]).join(', ')}</p>
                    <p><strong>Modeled comparative exposure under the current evidence standard: +0.</strong></p>
                    <p><strong>Modeled proliferation pressure under the current evidence standard: +0.</strong></p>
                    <p>{assessment.supportedFinding}</p>
                    <p>{assessment.missingEvidence}</p>
                    <p>{assessment.stabilizingPathway}</p>
                    <ul>
                      {assessment.sourceIds.map((sourceId) => {
                        const source = SOURCES.find(({ id }) => id === sourceId)
                        return source ? <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li> : null
                      })}
                    </ul>
                  </details>
                )}
              </div>
            )
          })}
        </section>
      ))}
    </>
  )
}
