import { geoAlbersUsa, geoCentroid, geoMercator, geoPath } from 'd3-geo'
import type { Feature, FeatureCollection, Geometry } from 'geojson'
import { ACTOR_NAMES, type ActorId, type RegionalActorId, type ScenarioInput, type ScenarioResult } from '../model'
import { MapGlyph } from './MapGlyph'
import { buildMapAnnotations, type AnnotationAnchor } from './mapAnnotations'

export interface MapProperties {
  actorId: ActorId
  name: string
}

export type MapGeography = FeatureCollection<Geometry, MapProperties>

interface PolicyMapProps {
  geography: MapGeography
  scenario: ScenarioInput
  result: ScenarioResult
  reducedMotion: boolean
  onSelectActor?: (actor: RegionalActorId, trigger: SVGElement) => void
}

const riskClass = {
  Low: 'risk-low',
  Guarded: 'risk-guarded',
  High: 'risk-high',
  Critical: 'risk-critical',
} as const

const actorOffsets: Partial<Record<RegionalActorId, readonly [number, number]>> = {
  china: [30, -25],
  'north-korea': [24, -22],
  'south-korea': [25, 19],
  japan: [30, 4],
  taiwan: [25, 2],
}

const ANNOTATION_ROW_GAP = 48
const ANNOTATION_HIT_TARGET_MIN_WIDTH = 52
const ANNOTATION_HIT_TARGET_HEIGHT = 44
const ANNOTATION_HIT_TARGET_Y = -12
const MAP_VIEWBOX_HEIGHT = 600

function AiBandPatterns() {
  return (
    <defs>
      <pattern id="ai-band-low" data-ai-band="low" data-pattern-geometry="dots" width="10" height="10" patternUnits="userSpaceOnUse">
        <rect data-pattern-base width="10" height="10" fill="#477f75" />
        <circle cx="2.5" cy="2.5" r="1.25" fill="#c5ded7" />
        <circle cx="7.5" cy="7.5" r="1.25" fill="#c5ded7" />
      </pattern>
      <pattern id="ai-band-guarded" data-ai-band="guarded" data-pattern-geometry="diagonal" width="9" height="9" patternUnits="userSpaceOnUse">
        <rect data-pattern-base width="9" height="9" fill="#8a7440" />
        <path d="M-2 2 2-2 M0 9 9 0 M7 11 11 7" fill="none" stroke="#f0e2b7" strokeWidth="1.5" />
      </pattern>
      <pattern id="ai-band-high" data-ai-band="high" data-pattern-geometry="crosshatch" width="10" height="10" patternUnits="userSpaceOnUse">
        <rect data-pattern-base width="10" height="10" fill="#a75d3f" />
        <path d="M0 0 10 10 M10 0 0 10" fill="none" stroke="#f5d1c3" strokeWidth="1.4" />
      </pattern>
      <pattern id="ai-band-critical" data-ai-band="critical" data-pattern-geometry="grid" width="8" height="8" patternUnits="userSpaceOnUse">
        <rect data-pattern-base width="8" height="8" fill="#b94f61" />
        <path d="M4 0 V8 M0 4 H8" fill="none" stroke="#f6d2d9" strokeWidth="1.5" />
      </pattern>
    </defs>
  )
}

export function PolicyMap({ geography, scenario, result, reducedMotion, onSelectActor }: PolicyMapProps) {
  const regionalProjection = geoMercator().center([117, 18]).scale(540).translate([470, 300])
  const regionalPath = geoPath(regionalProjection)
  const regionalFeatures = geography.features.filter((feature) => feature.properties.actorId !== 'united-states')
  const usa = geography.features.find((feature) => feature.properties.actorId === 'united-states')
  const usaProjection = geoAlbersUsa()
  if (usa) usaProjection.fitExtent([[30, 50], [170, 130]], usa)
  const usaPath = geoPath(usaProjection)
  const annotations = buildMapAnnotations(scenario, result)
  const isAiMode = scenario.mode === 'ai'

  const projectedCenter = (feature: Feature<Geometry, MapProperties>) => regionalProjection(geoCentroid(feature))
  const anchorPoint = (anchor: AnnotationAnchor): readonly [number, number] | null => {
    if (anchor === 'us-inset') return [96, 91]
    const fixed: [number, number] | null = anchor === 'western-pacific' ? [137, 24] : anchor === 'japan-rok' ? [132, 35] : anchor === 'asean' ? [107, 8] : null
    if (fixed) return regionalProjection(fixed) as [number, number] | null
    const feature = regionalFeatures.find((candidate) => candidate.properties.actorId === anchor)
    return feature ? projectedCenter(feature) as [number, number] | null : null
  }
  const anchorRowCounts = annotations.reduce((counts, annotation) => {
    counts.set(annotation.anchor, (counts.get(annotation.anchor) ?? 0) + 1)
    return counts
  }, new Map<AnnotationAnchor, number>())
  const anchorCounts = new Map<AnnotationAnchor, number>()

  return (
    <svg
      className="policy-map"
      viewBox="0 0 900 600"
      role="region"
      aria-labelledby="map-title"
      aria-describedby="map-description"
      preserveAspectRatio="xMidYMid meet"
    >
      <title id="map-title">Comparative escalation exposure map</title>
      <desc id="map-description">{isAiMode
        ? 'East Asia and Southeast Asia retain the underlying nuclear comparative exposure scores. Circuit symbols are selected zero-score evidence assessments; they do not change scores or nuclear ripple reactions. The United States appears in a strategic inset.'
        : 'East Asia and Southeast Asia are colored from low to critical comparative exposure. Scenario symbols show selected conditions and predicted reactions. The United States appears in a strategic inset.'}</desc>
      {isAiMode && <AiBandPatterns />}
      <rect className="map-water" width="900" height="600" rx="2" />
      <path className="map-graticule-line" d="M0 520 H900" />
      <text className="map-coordinate" x="14" y="542">EAST ASIA / WESTERN PACIFIC</text>

      {regionalFeatures.map((feature) => {
        const actor = feature.properties.actorId as RegionalActorId
        const path = regionalPath(feature)
        return (
          <path
            key={actor}
            data-actor={actor}
            d={path ?? undefined}
            className={`country ${riskClass[result.riskBands[actor]]}`}
            role="button"
            aria-label={`${ACTOR_NAMES[actor]}: ${result.riskScores[actor]}, ${result.riskBands[actor]} comparative exposure`}
            tabIndex={0}
            onClick={(event) => onSelectActor?.(actor, event.currentTarget)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onSelectActor?.(actor, event.currentTarget)
              }
            }}
          >
            <title>{`${ACTOR_NAMES[actor]} — ${result.riskScores[actor]} (${result.riskBands[actor]})`}</title>
          </path>
        )
      })}

      {!reducedMotion && regionalFeatures.flatMap((feature) => {
        const actor = feature.properties.actorId as RegionalActorId
        const orders = (['direct', 'second-order'] as const).filter((order) => (
          order === 'direct' ? result.changedActors.direct.includes(actor) : result.changedActors.secondOrder.includes(actor)
        ))
        const center = orders.length ? projectedCenter(feature) : null
        if (!center) return []
        return orders.map((order) => (
          <circle
            key={`ripple-${actor}-${order}`}
            data-ripple-actor={actor}
            className={`ripple ripple--${order}`}
            cx={center[0]}
            cy={center[1]}
            r="8"
            aria-hidden="true"
          />
        ))
      })}

      <g className="us-inset" aria-label="United States strategic inset">
        <rect x="18" y="18" width="165" height="150" />
        <text x="30" y="41">STRATEGIC INSET</text>
        {usa && (
          <path data-actor="united-states" d={usaPath(usa) ?? undefined} className="country country--inset" aria-label={`United States posture: ${result.effectivePostures['united-states']}`} />
        )}
        <text className="inset-posture" x="30" y="151">{result.effectivePostures['united-states'].toUpperCase()}</text>
      </g>

      <g className="annotation-layer" aria-label="Scenario change symbols">
        {annotations.map((annotation) => {
          const origin = anchorPoint(annotation.anchor)
          if (!origin) return null
          const previousAtAnchor = anchorCounts.get(annotation.anchor) ?? 0
          anchorCounts.set(annotation.anchor, previousAtAnchor + 1)
          const offset = annotation.actor ? actorOffsets[annotation.actor] ?? [22, -18] : [0, 0]
          const x = origin[0] + offset[0]
          const rowsAtAnchor = anchorRowCounts.get(annotation.anchor) ?? 1
          const firstRowMinimumY = -ANNOTATION_HIT_TARGET_Y
          const firstRowMaximumY = MAP_VIEWBOX_HEIGHT
            - ANNOTATION_HIT_TARGET_Y
            - ANNOTATION_HIT_TARGET_HEIGHT
            - (rowsAtAnchor - 1) * ANNOTATION_ROW_GAP
          // Shift the complete stack together so every target stays in view without reducing row spacing.
          const firstRowY = Math.min(
            Math.max(origin[1] + offset[1], firstRowMinimumY),
            firstRowMaximumY,
          )
          const y = firstRowY + previousAtAnchor * ANNOTATION_ROW_GAP
          const width = annotation.count * 22 + 10
          const hitTargetWidth = Math.max(ANNOTATION_HIT_TARGET_MIN_WIDTH, width)
          const openActor = (trigger: SVGElement) => annotation.actor && onSelectActor?.(annotation.actor, trigger)

          return (
            <g
              key={annotation.id}
              className={`annotation-stack annotation-stack--${annotation.variant}${reducedMotion ? ' annotation-stack--static' : ''}`}
              data-annotation={annotation.id}
              transform={`translate(${x} ${y})`}
              role={annotation.actor ? 'button' : undefined}
              tabIndex={annotation.actor ? 0 : undefined}
              aria-label={annotation.actor ? annotation.label : undefined}
              onClick={annotation.actor ? (event) => openActor(event.currentTarget) : undefined}
              onKeyDown={annotation.actor ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  openActor(event.currentTarget)
                }
              } : undefined}
            >
              {(offset[0] !== 0 || offset[1] !== 0) && <line className="annotation-leader" x1={-offset[0]} y1={origin[1] - y} x2="0" y2="0" />}
              {annotation.actor && (
                <rect
                  className="annotation-hit-target"
                  data-testid="annotation-hit-target"
                  x={-5 + (width - hitTargetWidth) / 2}
                  y={ANNOTATION_HIT_TARGET_Y}
                  width={hitTargetWidth}
                  height={ANNOTATION_HIT_TARGET_HEIGHT}
                  fill="transparent"
                />
              )}
              <rect className="annotation-plate" x="-5" y="-4" width={width} height="28" rx="3" />
              {Array.from({ length: annotation.count }, (_, index) => (
                <g key={index} transform={`translate(${index * 22} 0)`}>
                  <MapGlyph kind={annotation.kind} variant={annotation.variant} />
                </g>
              ))}
              <title>{annotation.label}</title>
            </g>
          )
        })}
      </g>

      <g className="symbol-legend" transform="translate(586 18)" aria-label="Scenario symbol legend">
        <rect width="296" height="64" rx="2" />
        <text x="12" y="17">SYMBOL KEY</text>
        {isAiMode ? (
          <>
            <text x="12" y="34">Circuit symbols = selected AI evidence assessments · no score change.</text>
            <text x="12" y="50">Underlying nuclear scores and scenario symbols remain visible.</text>
          </>
        ) : (
          <>
            <text x="12" y="34">1 icon = Level 1 · 3 icons = Level 2 · outlined = predicted</text>
            <text x="12" y="50">Counts show qualitative intensity, not literal equipment totals.</text>
          </>
        )}
      </g>

      <g className="map-legend" transform="translate(18 552)" aria-label="Risk legend">
        {(['Low', 'Guarded', 'High', 'Critical'] as const).map((band, index) => (
          <g key={band} transform={`translate(${index * 74} 0)`}>
            <rect className={riskClass[band]} width="12" height="12" />
            <text x="17" y="10">{band}</text>
          </g>
        ))}
      </g>
    </svg>
  )
}
