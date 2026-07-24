import { getPostureDefinition } from '../data/postureDefinitions'
import {
  ACTOR_NAMES,
  NUCLEAR_ACTOR_IDS,
  type NuclearActorId,
  type NuclearPostures,
  type PostureLevel,
  type UsPosture,
} from '../model'
import { SegmentedControl } from './SegmentedControl'

interface NuclearControlsProps {
  postures: NuclearPostures
  onChange: <K extends NuclearActorId>(actor: K, value: NuclearPostures[K], label: string) => void
}

const levelOptions = [
  { value: 0 as PostureLevel, label: 'July 2026' },
  { value: 1 as PostureLevel, label: 'Level 1' },
  { value: 2 as PostureLevel, label: 'Level 2' },
]

const usOptions = [
  { value: 'reduced' as UsPosture, label: 'Reduced' },
  { value: 'baseline' as UsPosture, label: 'July 2026' },
  { value: 'forward' as UsPosture, label: 'Forward' },
  { value: 'expanded' as UsPosture, label: 'Expanded theater' },
]

export function NuclearControls({ postures, onChange }: NuclearControlsProps) {
  return (
    <section className="control-group control-group--nuclear" aria-labelledby="nuclear-controls-title">
      <h2 id="nuclear-controls-title">Nuclear choices</h2>
      {NUCLEAR_ACTOR_IDS.map((actor) => {
        const definition = getPostureDefinition(actor, postures[actor])

        return (
          <div className="control-field nuclear-control-field" key={actor}>
            <h3>{ACTOR_NAMES[actor]}</h3>
            <p>{actor === 'united-states' ? 'Choose the regional nuclear assurance posture.' : 'Choose the modeled nuclear posture level.'}</p>
            {actor === 'united-states' ? (
              <SegmentedControl label={`${ACTOR_NAMES[actor]} nuclear posture`} value={postures[actor]} options={usOptions} onChange={(value, label) => onChange(actor, value, label)} />
            ) : (
              <SegmentedControl label={`${ACTOR_NAMES[actor]} nuclear posture`} value={postures[actor]} options={levelOptions} onChange={(value, label) => onChange(actor, value, label)} />
            )}
            <div className="posture-definition posture-definition--compact" aria-live="polite">
              <strong>{definition.title}</strong>
              <p>{definition.description}</p>
            </div>
          </div>
        )
      })}
      <details className="level-reference">
        <summary>What the levels mean</summary>
        <div>
          <h3>China &amp; North Korea</h3>
          <p><strong>Level 0:</strong> July 2026 reference posture. Level 0 does not mean China or North Korea is non-nuclear.</p>
          <p><strong>Level 1:</strong> Limited increase in nuclear capability or readiness.</p>
          <p><strong>Level 2:</strong> Major increase in nuclear capability or readiness.</p>
          <h3>Japan &amp; South Korea</h3>
          <p><strong>Level 0:</strong> No operational national nuclear arsenal.</p>
          <p><strong>Level 1:</strong> Political decision and active weaponization, but no operational arsenal.</p>
          <p><strong>Level 2:</strong> Operational national nuclear arsenal.</p>
        </div>
      </details>
    </section>
  )
}
