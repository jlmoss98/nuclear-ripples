import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

interface ShareMenuProps {
  url: string
}

type CopyStatus = 'idle' | 'copied' | 'error'

const PANEL_ID = 'scenario-share-panel'

export function ShareMenu({ url }: ShareMenuProps) {
  const [open, setOpen] = useState(false)
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle')
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const copyButtonRef = useRef<HTMLButtonElement>(null)

  const destinations = useMemo(() => {
    const invitation = `Explore this Nuclear Ripples scenario: ${url}`
    return {
      bluesky: `https://bsky.app/intent/compose?text=${encodeURIComponent(invitation)}`,
      linkedIn: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      email: `mailto:?subject=${encodeURIComponent('Nuclear Ripples scenario')}&body=${encodeURIComponent(`Explore this Nuclear Ripples scenario:\n\n${url}`)}`,
    }
  }, [url])

  const closeMenu = useCallback(() => {
    setOpen(false)
    setCopyStatus('idle')
    triggerRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!open) return
    copyButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu()
    }
    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) closeMenu()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('pointerdown', handlePointerDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [closeMenu, open])

  const toggleMenu = () => {
    if (open) {
      closeMenu()
      return
    }
    setCopyStatus('idle')
    setOpen(true)
  }

  const copyLink = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(url)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('error')
    }
  }

  const statusMessage = copyStatus === 'copied'
    ? 'Scenario link copied.'
    : copyStatus === 'error'
      ? 'Copy didn’t work automatically. Select and copy the link above.'
      : ''

  return (
    <div className="share-menu" ref={menuRef}>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={PANEL_ID}
        onClick={toggleMenu}
      >
        Share scenario
      </button>
      {open && (
        <div
          id={PANEL_ID}
          className="share-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby={`${PANEL_ID}-title`}
        >
          <button className="share-panel__close" type="button" onClick={closeMenu} aria-label="Close share panel">×</button>
          <p className="eyebrow">Scenario link</p>
          <h2 id={`${PANEL_ID}-title`}>Share this scenario</h2>
          <label className="share-link-field">
            <span>Shareable scenario link</span>
            <input value={url} readOnly onFocus={(event) => event.currentTarget.select()} onClick={(event) => event.currentTarget.select()} />
          </label>
          <div className="share-destinations">
            <button ref={copyButtonRef} className="share-copy" type="button" onClick={copyLink}>
              {copyStatus === 'copied' ? 'Copied!' : 'Copy link'}
            </button>
            <a href={destinations.bluesky} target="_blank" rel="noreferrer" aria-label="Share on Bluesky">Bluesky</a>
            <a href={destinations.linkedIn} target="_blank" rel="noreferrer" aria-label="Share on LinkedIn">LinkedIn</a>
            <a href={destinations.email} aria-label="Share by Email">Email</a>
          </div>
          <p className={`share-status share-status--${copyStatus}`} role="status">{statusMessage}</p>
        </div>
      )}
    </div>
  )
}
