import { useEffect, useRef } from 'react'
import { SOURCES } from '../data/sources'
import { reviewStatusLabel } from '../data/evidenceTypes'
import { EVIDENCE_BY_FAMILY } from '../data/ruleEvidence'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

const ACTIVE_SOURCE_IDS = new Set(
  Object.entries(EVIDENCE_BY_FAMILY)
    .filter(([family]) => family !== 'ai')
    .flatMap(([, evidence]) => evidence.sourceIds),
)
const activeSources = SOURCES.filter(({ id }) => ACTIVE_SOURCE_IDS.has(id))
const aiSources = SOURCES.filter(({ review }) => review.supports.includes('ai'))
const availableSources = SOURCES.filter(({ review }) => review.status === 'available-full-text')
const backgroundSources = SOURCES.filter(({ id, review }) =>
  !ACTIVE_SOURCE_IDS.has(id)
  && !review.supports.includes('ai')
  && review.status !== 'available-full-text')

function SourceGroup({ heading, sources }: { heading: string; sources: typeof SOURCES }) {
  if (sources.length === 0) return null

  return (
    <section className="source-group">
      <h3>{heading}</h3>
      <ol className="source-list">
        {sources.map((source) => (
          <li key={source.id}>
            <span className="source-kind">{source.kind}</span>
            <div className="source-entry">
              <a href={source.url} target="_blank" rel="noreferrer">{source.title}</a>
              <div className="source-review-row">
                <span className={`review-badge review-badge--${source.review.status}`}>
                  {reviewStatusLabel(source.review.status)}
                </span>
                <span>{source.review.status === 'available-full-text' ? 'Access verified' : 'Reviewed'} {source.review.reviewedOn}</span>
              </div>
              <p>{source.publisher}, {source.year} · <span lang={source.language === '中文' ? 'zh' : source.language === '日本語' ? 'ja' : 'en'}>{source.language}</span></p>
              <p className="source-note">{source.review.note}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

interface InfoPanelProps {
  view: 'methodology' | 'sources'
  onClose: () => void
}

export function InfoPanel({ view, onClose }: InfoPanelProps) {
  const panelRef = useRef<HTMLElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab' || !panelRef.current) return

      const focusableElements = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((element) => element.tabIndex >= 0)
      const firstElement = focusableElements[0]
      const lastElement = focusableElements.at(-1)
      if (!firstElement || !lastElement) return

      const focusIsOutsidePanel = !panelRef.current.contains(document.activeElement)
      if (event.shiftKey && (document.activeElement === firstElement || focusIsOutsidePanel)) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && (document.activeElement === lastElement || focusIsOutsidePanel)) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    closeButtonRef.current?.focus()
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (opener?.isConnected) opener.focus()
    }
  }, [])

  return (
    <div className="info-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section ref={panelRef} className="info-panel" role="dialog" aria-modal="true" aria-labelledby="info-title">
        <button ref={closeButtonRef} className="drawer-close" type="button" onClick={onClose} aria-label="Close information panel">×</button>
        {view === 'methodology' ? (
          <>
            <p className="eyebrow">Model notes · July 2026 reference</p>
            <h2 id="info-title">Methodology</h2>
            <div className="prose">
              <p className="lead">This index compares scenarios. Scores are not probabilities, forecasts, or estimates of whether a country will acquire nuclear weapons.</p>
              <h3>What the score measures</h3>
              <p>The score represents comparative exposure to interstate escalation involving the modeled East Asian nuclear system. It begins with a July 2026 reference score and adds qualitative effects from the selected nuclear, crisis, alliance, capability, doctrine, and political conditions.</p>
              <h3>How effects are sized</h3>
              <p>Escalation effects use minor (5), moderate (10), major (20), and severe (30) increments. Proliferation pressure uses increments of 1, 2, or 3. Exposure is clamped from 0–100; pressure is clamped from 0–10.</p>
              <p>These increments are qualitative scenario-design choices, not empirically estimated effect sizes. Source confidence describes support for the direction of a relationship, not calibration of its numeric value.</p>
              <h3>How reactions work</h3>
              <p>Direct choices and pressures are calculated first. Pressure can predict a posture reaction using actor-specific thresholds. That predicted posture creates one second ripple of escalation effects. The second ripple cannot create another posture change, preventing circular cascades.</p>
              <h3>How AI conditions are scored</h3>
              <p>An AI condition can change exposure only when the literature establishes that the named actor is developing or deploying the exact application and supports the proposed strategic mechanism. Proliferation pressure additionally requires evidence of an affected-state nuclear hedging or posture response and credible counterevidence or a stabilizing pathway.</p>
              <p>No current condition completes those chains, so all current AI contributions are zero. Zero is a model decision under the evidence standard, not proof that AI can have no effect.</p>
              <h3>How to read omissions</h3>
              <p>An omitted relationship means <em>not modeled</em>, not “proven to have no effect.” Confidence labels describe the evidence behind a relationship; they do not convert scores into probabilities.</p>
              <h3>Geographic disclaimer</h3>
              <p>Names, boundaries, and map presentation are for scenario navigation only. They do not express a position on sovereignty, legal status, or disputed boundaries, including those concerning Taiwan.</p>
            </div>
          </>
        ) : (
          <>
            <p className="eyebrow">Evidence register</p>
            <h2 id="info-title">Sources</h2>
            <p className="panel-intro">Access and relevance are separate checks. Only reviewed sources that directly support a modeled relationship appear as active evidence and contribute to its confidence. If another accessible source awaits detailed review, it will appear in a separate review queue.</p>
            <SourceGroup heading="Active evidence" sources={activeSources} />
            <SourceGroup heading="AI layer evidence" sources={aiSources} />
            <p className="source-scope-note">
              These sources support application evidence, mechanisms, limitations, or counterevidence used in a zero-contribution assessment. This does not mean the source itself measured a zero effect.
            </p>
            <SourceGroup heading="Full text available for review" sources={availableSources} />
            <SourceGroup heading="Background or unavailable" sources={backgroundSources} />
          </>
        )}
      </section>
    </div>
  )
}
