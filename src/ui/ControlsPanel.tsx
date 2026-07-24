import { CONTROL_GROUPS } from '../data/controls'
import { POSTURE_DEFINITIONS } from '../data/postureDefinitions'
import { NUCLEAR_ACTOR_IDS, type AiControls, type NuclearActorId, type NuclearPostures, type ScenarioInput, type StrategicControls } from '../model'
import { AiControls as AiControlsPanel } from './AiControls'
import { NuclearControls } from './NuclearControls'
import { SegmentedControl } from './SegmentedControl'

interface ControlsPanelProps {
  scenario: ScenarioInput
  onPostureChange: <K extends NuclearActorId>(actor: K, value: NuclearPostures[K], label: string) => void
  onChange: <K extends keyof StrategicControls>(key: K, value: StrategicControls[K], label: string, controlLabel: string) => void
  onAiChange: <K extends keyof AiControls>(key: K, value: AiControls[K], label: string) => void
}

export function ControlsPanel({ scenario, onPostureChange, onChange, onAiChange }: ControlsPanelProps) {
  const { controls, postures } = scenario
  const isAiMode = scenario.mode === 'ai'
  const visibleControlGroups = CONTROL_GROUPS.map((group) => ({
    ...group,
    controls: group.controls.filter((control) => !control.visibleWhen || control.visibleWhen(controls)),
  }))
  const nuclearChoiceCount = NUCLEAR_ACTOR_IDS.length
    + visibleControlGroups.reduce((count, group) => count + group.controls.length, 0)

  return (
    <details className="controls-drawer" open>
      <summary>
        <span><span className="eyebrow">Interactive policy atlas</span> Scenario controls</span>
        <span className="summary-hint">{isAiMode ? '10 AI choices' : `${nuclearChoiceCount} choices`}</span>
      </summary>
      <div className="controls-body">
        {isAiMode ? (
          <AiControlsPanel controls={scenario.ai} onChange={onAiChange} />
        ) : (
          <>
            <NuclearControls postures={postures} onChange={onPostureChange} />
            <details className="level-reference" open>
              <summary>United States posture reference</summary>
              <div>
                {POSTURE_DEFINITIONS['united-states'].map((definition) => (
                  <section key={definition.value}>
                    <h3>{definition.label}</h3>
                    <p><strong>{definition.title}</strong></p>
                    <p>{definition.description}</p>
                  </section>
                ))}
                <p>These are qualitative scenario categories, not arsenal counts or forecasts.</p>
              </div>
            </details>
            {visibleControlGroups.map((group) => (
              <section className="control-group" key={group.title}>
                <h2>{group.title}</h2>
                {group.controls.map((control) => {
                  const value = controls[control.key]
                  return (
                    <div className={`control-field${control.followUp ? ' control-field--follow-up' : ''}`} key={control.key}>
                      <h3>{control.label}</h3>
                      <p>{control.question}</p>
                      <SegmentedControl
                        label={control.label}
                        value={value}
                        options={control.options as Array<{ value: typeof value; label: string }>}
                        onChange={(next, label) => onChange(control.key, next, label, control.label)}
                      />
                      {control.note && <p className="control-field__note">{control.note}</p>}
                    </div>
                  )
                })}
              </section>
            ))}
          </>
        )}
      </div>
    </details>
  )
}
