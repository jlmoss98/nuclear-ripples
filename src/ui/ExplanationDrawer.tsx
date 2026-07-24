import { useEffect, useRef } from 'react'
import { ACTOR_NAMES, type AiAssessment, type AtlasMode, type RegionalActorId, type RuleEffect, type ScenarioResult, type StrategicControls } from '../model'
import { SOURCES, type Source } from '../data/sources'
import { isEvidenceEligible, reviewStatusLabel } from '../data/evidenceTypes'

interface ExplanationDrawerProps {
  actor: RegionalActorId
  mode: AtlasMode
  controls: StrategicControls
  result: ScenarioResult
  onClose: () => void
}

interface RippleGroupProps {
  heading: string
  order: RuleEffect['order']
  effects: RuleEffect[]
}

function RippleGroup({ heading, order, effects }: RippleGroupProps) {
  if (effects.length === 0) return null

  return (
    <section className="ripple-group" aria-label={heading}>
      <h4 className={`order-tag order-tag--${order}`}>{heading}</h4>
      <ol className="trace-list">
        {effects.map((effect, index) => (
          <li key={`${effect.ruleId}-${index}`}>
            <p>{effect.explanation}</p>
            <strong>{effect.delta > 0 ? '+' : ''}{effect.delta} points</strong>
          </li>
        ))}
      </ol>
    </section>
  )
}

function resolvedSources(sourceIds: string[]) {
  return [...new Set(sourceIds)]
    .map((id) => SOURCES.find((source) => source.id === id))
    .filter((source): source is Source => source !== undefined && isEvidenceEligible(source.review.status))
}

function SourceLinks({ sources }: { sources: Source[] }) {
  if (sources.length === 0) return null

  return (
    <ul className="drawer-sources">
      {sources.map((source) => (
        <li key={source.id}>
          <a href={source.url} target="_blank" rel="noreferrer">{source.title}</a>
          <span className={`review-badge review-badge--${source.review.status}`}>{reviewStatusLabel(source.review.status)}</span>
        </li>
      ))}
    </ul>
  )
}

function EvidenceNote({ heading, children, sourceIds }: { heading: string; children: React.ReactNode; sourceIds: string[] }) {
  return (
    <section className="ripple-group" aria-label={heading}>
      <h4 className="order-tag">{heading}</h4>
      <p>{children}</p>
      <SourceLinks sources={resolvedSources(sourceIds)} />
    </section>
  )
}

function AiAssessmentDetail({ assessment }: { assessment: AiAssessment }) {
  return (
    <article className="ai-assessment">
      <h5>{assessment.label}</h5>
      <p>Modeled comparative exposure under the current evidence standard: +0.</p>
      <p>Modeled proliferation pressure under the current evidence standard: +0.</p>
      <p>Supported finding: {assessment.supportedFinding}</p>
      <p>Missing evidence: {assessment.missingEvidence}</p>
      <p>Stabilizing pathway: {assessment.stabilizingPathway}</p>
      <SourceLinks sources={resolvedSources(assessment.sourceIds)} />
    </article>
  )
}

export function ExplanationDrawer({ actor, mode, controls, result, onClose }: ExplanationDrawerProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const trace = result.causalTraces[actor]
  const directEffects = trace.filter((effect) => effect.order === 'direct')
  const reactionEffects = trace.filter((effect) => effect.order === 'second-order')
  const confidences = [...new Set(trace.map((effect) => effect.confidence))]
  const sources = resolvedSources(trace.flatMap((effect) => effect.sourceIds))
  const applicableAiAssessments = result.aiAssessments.filter(({ affectedActors }) => affectedActors.includes(actor))
  const isAiMode = mode === 'ai'
  const nuclearConfidence = confidences.length
    ? `${confidences.join(' / ')}. Confidence describes the evidence behind each relationship, not certainty about an outcome.`
    : 'No confidence rating applies because no relationship is triggered.'

  useEffect(() => {
    closeButtonRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <aside className="explanation-drawer" role="dialog" aria-modal="false" aria-labelledby="explanation-title">
      <button ref={closeButtonRef} className="drawer-close" type="button" onClick={onClose} aria-label="Close explanation">×</button>
      <p className="eyebrow">Causal trace</p>
      <h2 id="explanation-title">{ACTOR_NAMES[actor]}</h2>
      <div className="score-lockup"><strong>{result.riskScores[actor]}</strong><span>{result.riskBands[actor]} comparative exposure</span></div>
      <section>
        <h3>What changed?</h3>
        <p>{trace.length ? `${trace.length} modeled effect${trace.length === 1 ? '' : 's'} changed this actor’s score from its July 2026 baseline.` : 'No selected rule changes this actor from its July 2026 baseline.'}</p>
      </section>
      <section>
        <h3>Why?</h3>
        {isAiMode ? (
          <>
            <RippleGroup heading="Underlying nuclear conditions" order="direct" effects={directEffects} />
            <section className="ripple-group" aria-label="AI layer — hypothetical exposure">
              <h4 className="order-tag">AI layer — hypothetical exposure</h4>
              {applicableAiAssessments.length > 0
                ? applicableAiAssessments.map((assessment) => <AiAssessmentDetail key={assessment.id} assessment={assessment} />)
                : <p>No selected AI assessment identifies this country as a proposed affected actor. Modeled AI exposure: +0. Modeled AI proliferation pressure: +0.</p>}
            </section>
            <RippleGroup heading="Modeled nuclear reactions" order="second-order" effects={reactionEffects} />
          </>
        ) : (
          <>
            {trace.length ? (
              <>
                <RippleGroup heading="First ripple — direct effects" order="direct" effects={directEffects} />
                <RippleGroup heading="Second ripple — modeled reactions" order="second-order" effects={reactionEffects} />
              </>
            ) : <p>The current scenario does not trigger a modeled relationship for this actor.</p>}
            {controls.koreanCrisis === 'major' && (
              <EvidenceNote heading="How nuclear escalation could occur" sourceIds={['korea-nuclear-use-cases']}>
                Nautilus identifies false warning or mistake, delegated or unauthorized action, command-and-control loss, lower-level error, and deliberate escalation as distinct pathways. They are prevention-oriented cases, not separately scored outcomes.
              </EvidenceNote>
            )}
            {controls.taiwanCrisis === 'open-conflict' && controls.chinaLowYieldOptions === 'available' && (
              <EvidenceNote heading="Low-yield availability — informational only" sourceIds={['csis-taiwan-nuclear-wargame']}>
                The CSIS–MIT games indicate that lower-yield availability can shape weapon choice and concepts of limited use, but did not establish a reliable increase in first-use propensity. This selection changes no score or proliferation pressure.
              </EvidenceNote>
            )}
          </>
        )}
      </section>
      <section>
        <h3>How confident are we?</h3>
        {isAiMode ? (
          <>
            {applicableAiAssessments.length > 0 && (
              <section aria-label="AI assessment confidence">
                <p>Speculative describes the proposed escalation mechanism. No reviewed source establishes that this condition causes nuclear hedging or posture change.</p>
              </section>
            )}
            {trace.length > 0 && (
              <section aria-label="Underlying nuclear confidence and evidence">
                <p>{nuclearConfidence}</p>
                <SourceLinks sources={sources} />
              </section>
            )}
            {applicableAiAssessments.length === 0 && trace.length === 0 && <p>{nuclearConfidence}</p>}
          </>
        ) : (
          <>
            <p>{nuclearConfidence}</p>
            <SourceLinks sources={sources} />
          </>
        )}
      </section>
    </aside>
  )
}
