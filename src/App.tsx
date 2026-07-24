import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ACTOR_NAMES, DEFAULT_SCENARIO, evaluateScenario, parseScenarioUrl, serializeScenarioUrl, type AiControls, type NuclearActorId, type NuclearPostures, type RegionalActorId, type ScenarioInput, type StrategicControls } from './model'
import { ControlsPanel } from './ui/ControlsPanel'
import { ExplanationDrawer } from './ui/ExplanationDrawer'
import { InfoPanel } from './ui/InfoPanel'
import { PolicyMap, type MapGeography } from './ui/PolicyMap'
import { ResultsTable } from './ui/ResultsTable'
import { RiskLegend } from './ui/RiskLegend'
import { SegmentedControl } from './ui/SegmentedControl'
import { ShareMenu } from './ui/ShareMenu'

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)
  useEffect(() => {
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!query) return
    const update = () => setReduced(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return reduced
}

export function App() {
  const initial = useMemo(() => parseScenarioUrl(window.location.search), [])
  const [scenario, setScenario] = useState<ScenarioInput>(initial.scenario)
  const [history, setHistory] = useState<ScenarioInput[]>([])
  const [announcement, setAnnouncement] = useState(initial.notices.join(' '))
  const [geography, setGeography] = useState<MapGeography | null>(null)
  const [mapFailed, setMapFailed] = useState(false)
  const [selectedActor, setSelectedActor] = useState<RegionalActorId | null>(null)
  const explanationTriggerRef = useRef<{
    actor: RegionalActorId
    node: HTMLElement | SVGElement
  } | null>(null)
  const [infoView, setInfoView] = useState<'methodology' | 'sources' | null>(null)
  const reducedMotion = useReducedMotion()
  const result = useMemo(() => evaluateScenario(scenario), [scenario])
  const scenarioQuery = useMemo(() => serializeScenarioUrl(scenario), [scenario])
  const aiMode = scenario.mode === 'ai'

  useEffect(() => {
    let active = true
    fetch(`${import.meta.env.BASE_URL}data/east-asia-map-units.geojson`)
      .then((response) => {
        if (!response.ok) throw new Error(`Map request failed with ${response.status}`)
        return response.json() as Promise<MapGeography>
      })
      .then((data) => { if (active) setGeography(data) })
      .catch(() => { if (active) setMapFailed(true) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    window.history.replaceState({}, '', `${window.location.pathname}${scenarioQuery}`)
  }, [scenarioQuery])

  useEffect(() => {
    const trigger = explanationTriggerRef.current
    if (selectedActor !== null || !trigger) return
    const target = trigger.node.isConnected
      ? trigger.node
      : document.querySelector<HTMLElement | SVGElement>(`[data-actor="${trigger.actor}"]`)
    target?.focus()
    explanationTriggerRef.current = null
  }, [selectedActor])

  const openExplanation = useCallback((actor: RegionalActorId, trigger: HTMLElement | SVGElement) => {
    explanationTriggerRef.current = { actor, node: trigger }
    setSelectedActor(actor)
  }, [])

  const closeExplanation = useCallback(() => setSelectedActor(null), [])

  const commitScenario = (next: ScenarioInput, message: string) => {
    setHistory((items) => [...items.slice(-49), scenario])
    setScenario(next)
    setAnnouncement(message)
  }

  const changePosture = <K extends NuclearActorId>(actor: K, value: NuclearPostures[K], label: string) => {
    commitScenario({ ...scenario, postures: { ...scenario.postures, [actor]: value } }, `${ACTOR_NAMES[actor]} changed to ${label}.`)
  }

  const changeControl = <K extends keyof StrategicControls>(key: K, value: StrategicControls[K], label: string, controlLabel: string) => {
    commitScenario({ ...scenario, controls: { ...scenario.controls, [key]: value } }, `${controlLabel} changed to ${label}.`)
  }

  const changeAiControl = <K extends keyof AiControls>(key: K, value: AiControls[K], label: string) => {
    commitScenario({ ...scenario, ai: { ...scenario.ai, [key]: value } }, `AI condition changed to ${label}.`)
  }

  const undo = () => {
    const previous = history.at(-1)
    if (!previous) return
    setScenario((current) => ({ ...previous, mode: current.mode }))
    setHistory((items) => items.slice(0, -1))
    setAnnouncement('Undid the last scenario change.')
  }

  const reset = () => {
    commitScenario(DEFAULT_SCENARIO, 'Restored every choice and score to the July 2026 reference scenario.')
    setSelectedActor(null)
  }

  return (
    <div className={`app-shell${aiMode ? ' app-shell--ai' : ''}`}>
      <a className="skip-link" href="#main-content">Skip to scenario</a>
      <header className="site-header">
        <div className="wordmark">
          <span className="wordmark-mark" aria-hidden="true"><i /><i /><i /></span>
          <span><strong>Nuclear Ripples</strong><small>Can you avoid a tsunami?</small></span>
        </div>
        <nav aria-label="Project information">
          <button type="button" onClick={() => setInfoView('methodology')}>Methodology</button>
          <button type="button" onClick={() => setInfoView('sources')}>Sources</button>
        </nav>
      </header>

      <div className="announcement" role="status" aria-live="polite">{announcement}</div>

      <main className="atlas-shell" id="main-content">
          <section className="atlas-heading">
            <div>
              <p className="eyebrow">
                {aiMode ? 'Interactive AI evidence layer · July 2026 reference' : 'Interactive policy atlas · July 2026 reference'}
              </p>
              <h1>Scenario atlas</h1>
            </div>
            <div className="atlas-mode-control">
              <SegmentedControl
                label="Atlas layer"
                value={scenario.mode}
                options={[
                  { value: 'nuclear', label: 'Nuclear' },
                  { value: 'ai', label: 'AI' },
                ]}
                onChange={(mode, label) => {
                  setScenario((current) => ({ ...current, mode }))
                  setAnnouncement(`${label} atlas layer selected.`)
                }}
              />
            </div>
            <p className="score-disclaimer">
              <strong>{aiMode ? 'Current modeled AI contributions are zero.' : 'Comparative exposure, not probability.'}</strong>
              {aiMode ? 'Selected AI conditions are evidence assessments, not forecasts.' : 'Scores compare selected scenarios; they are not forecasts.'}
            </p>
          </section>

          <div className="atlas-actions" aria-label="Scenario actions">
            <button type="button" onClick={undo} disabled={history.length === 0}>Undo</button>
            <button type="button" onClick={reset}>Reset</button>
            <ShareMenu url={`${window.location.origin}${window.location.pathname}${scenarioQuery}`} />
          </div>

          <div className="atlas-grid">
            <ControlsPanel
              scenario={scenario}
              onPostureChange={changePosture}
              onChange={changeControl}
              onAiChange={changeAiControl}
            />
            <section className="map-column" aria-label="Scenario results">
              {geography && !mapFailed ? (
                <PolicyMap key={scenarioQuery} geography={geography} scenario={scenario} result={result} reducedMotion={reducedMotion} onSelectActor={openExplanation} />
              ) : mapFailed ? (
                <div className="map-failure" role="alert"><strong>The geographic layer could not load.</strong><p>The scenario engine is still working. Use the complete country table below.</p></div>
              ) : (
                <div className="map-loading" aria-label="Loading geographic layer"><span />Loading regional outlines…</div>
              )}

              <div className="map-caption">
                <p>{aiMode
                  ? 'The current AI conditions remain interactive, but none changes exposure or proliferation pressure because the reviewed literature does not establish the exact actor–application–mechanism chain.'
                  : 'First ripples show direct effects. Second ripples follow predicted posture reactions after 650 ms.'}</p>
                <p>Hong Kong is visually distinct and inherits China’s final score.</p>
              </div>
              <RiskLegend />
              <ResultsTable mode={scenario.mode} result={result} onSelect={openExplanation} prominent={mapFailed} />
            </section>
          </div>
      </main>

      {selectedActor && <ExplanationDrawer actor={selectedActor} mode={scenario.mode} controls={scenario.controls} result={result} onClose={closeExplanation} />}
      {infoView && <InfoPanel view={infoView} onClose={() => setInfoView(null)} />}
      <footer>
        <p>{aiMode ? 'AI options remain interactive; current evidence-supported contribution: +0.' : 'Nuclear Ripples · Conventional proliferation layer'}</p>
        <p>Omitted relationships are not modeled; they are not evidence of no effect.</p>
      </footer>
    </div>
  )
}
