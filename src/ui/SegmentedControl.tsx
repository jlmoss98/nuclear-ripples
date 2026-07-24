import { useRef } from 'react'
import type { Option } from '../data/controls'

interface SegmentedControlProps<T extends string | number> {
  label: string
  value: T
  options: Option<T>[]
  onChange: (value: T, label: string) => void
}

export function SegmentedControl<T extends string | number>({ label, value, options, onChange }: SegmentedControlProps<T>) {
  const refs = useRef<Array<HTMLButtonElement | null>>([])
  const select = (next: Option<T>) => {
    if (next.value !== value) onChange(next.value, next.label)
  }
  const move = (index: number, direction: number) => {
    const nextIndex = (index + direction + options.length) % options.length
    const next = options[nextIndex]
    select(next)
    refs.current[nextIndex]?.focus()
  }

  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((option, index) => (
        <button
          key={String(option.value)}
          ref={(element) => { refs.current[index] = element }}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          tabIndex={option.value === value ? 0 : -1}
          className={option.value === value ? 'segment segment--selected' : 'segment'}
          onClick={() => select(option)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
              event.preventDefault()
              move(index, 1)
            } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
              event.preventDefault()
              move(index, -1)
            } else if (event.key === 'Home') {
              event.preventDefault()
              select(options[0])
              refs.current[0]?.focus()
            } else if (event.key === 'End') {
              event.preventDefault()
              const last = options.length - 1
              select(options[last])
              refs.current[last]?.focus()
            }
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
