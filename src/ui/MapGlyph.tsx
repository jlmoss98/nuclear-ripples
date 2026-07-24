import type { AnnotationKind, AnnotationVariant } from './mapAnnotations'

interface MapGlyphProps {
  kind: AnnotationKind
  variant: AnnotationVariant
  size?: number
}

function GlyphShape({ kind }: { kind: AnnotationKind }) {
  switch (kind) {
    case 'warhead':
      return <><path d="M10 2 C6.8 5.1 6.2 8.8 6.7 12.8 H13.3 C13.8 8.8 13.2 5.1 10 2Z" /><path d="M7 12.8 5 18 M13 12.8 15 18 M4.5 18 H15.5" /></>
    case 'warship':
      return <><path d="M2 12.2 H18 L15.3 16.5 H5Z" /><path d="M7 12.2 V8.2 H13.5 L15.5 12.2 M10 8.2 V5.2 H12.8" /></>
    case 'conflict':
      return <polygon points="10,1.5 12.2,6.5 17.5,4 15,9.2 19,11 13.8,13 16,18.5 10.8,15.5 7,19 7,14 1.5,15.5 5,10.8 1,7.8 6.5,7.2" />
    case 'umbrella':
      return <><path d="M2 10 A8 8 0 0 1 18 10 C15.8 8.3 13.7 8.3 11.5 10 C9.3 8.3 7.2 8.3 5 10 C4 9.2 3 9.2 2 10Z" /><path d="M10 3 V15.5 C10 18 14 18 14 15.5" /></>
    case 'radar':
      return <><path d="M4 4 A8.5 8.5 0 0 1 16 16 M6.5 6.5 A5 5 0 0 1 13.5 13.5" /><circle cx="10" cy="10" r="1.5" /><path d="M10 11.5 V17 M6.5 18 H13.5" /></>
    case 'missile':
      return <><path d="M12.5 2 C15.7 6 14.5 10.2 10.5 14.2 L7 10.7 C11 6.7 12.5 2 12.5 2Z" /><path d="M8 9.7 4.2 9 6 12.2 M11.5 13.2 11 17 8 15 M5.8 14.2 3 17" /></>
    case 'link':
      return <><path d="M8.2 7.2 6.5 5.5 A3.2 3.2 0 0 0 2 10 L4 12 A3.2 3.2 0 0 0 8.5 12.2 L10 10.7" /><path d="M11.8 12.8 13.5 14.5 A3.2 3.2 0 0 0 18 10 L16 8 A3.2 3.2 0 0 0 11.5 7.8 L10 9.3" /></>
    case 'warning':
      return <><path d="M12 1.5 4.8 10.8 H9 L7.8 18.5 15.2 8.3 H11Z" /></>
    case 'ring':
      return <><circle cx="10" cy="10" r="7" /><path d="M13 3.7 8.7 9.3 12 11.3 7 17" /></>
    case 'document':
      return <><path d="M4 2.5 H12.5 L16 6 V17.5 H4Z" /><path d="M12 2.5 V6.5 H16 M7 10 H13 M7 13 H12" /></>
    case 'circuit':
      return <><rect x="4" y="4" width="12" height="12" rx="1.5" /><circle cx="7" cy="7" r="1" /><circle cx="13" cy="7" r="1" /><circle cx="7" cy="13" r="1" /><circle cx="13" cy="13" r="1" /><path d="M8 7 H12 M7 8 V12 M13 8 V12 M8 13 H12" /></>
  }
}

export function MapGlyph({ kind, variant, size = 20 }: MapGlyphProps) {
  const marker = variant === 'positive' ? '+' : variant === 'negative' ? '−' : variant === 'warning' ? '!' : null

  return (
    <svg
      className={`map-glyph map-glyph--${kind} map-glyph--${variant}`}
      data-glyph={kind}
      viewBox="0 0 20 20"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      <g className="map-glyph__shape"><GlyphShape kind={kind} /></g>
      {marker && <text className="map-glyph__marker" x="16.2" y="6.2">{marker}</text>}
    </svg>
  )
}
