import type { CSSProperties, ReactNode } from 'react'

type PreferenceSliderProps = {
  label: string
  icon: ReactNode
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step: number
  valueText: string
  scaleLabels: [string, string, string]
  hideHeader?: boolean
}

export function PreferenceSlider({
  label,
  icon,
  value,
  onChange,
  min,
  max,
  step,
  valueText,
  scaleLabels,
  hideHeader = false,
}: PreferenceSliderProps) {
  const percent = ((value - min) / (max - min)) * 100
  return (
    <div className="preference-slider">
      {!hideHeader && (
        <div className="preference-slider__header">
          <div className="preference-slider__label">
            <span className="preference-slider__icon" aria-hidden="true">
              {icon}
            </span>
            <span className="text-sm font-medium text-foreground">{label}</span>
          </div>
          <span className="text-sm font-semibold text-primary">{valueText}</span>
        </div>
      )}

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="preference-range"
        aria-label={label}
        style={{ ['--percent' as never]: `${percent}%` } as CSSProperties}
      />

      <div className="preference-slider__scale" aria-hidden="true">
        <span>{scaleLabels[0]}</span>
        <span>{scaleLabels[1]}</span>
        <span>{scaleLabels[2]}</span>
      </div>
    </div>
  )
}

