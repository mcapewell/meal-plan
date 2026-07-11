import { statusFor } from '../lib/macros.js'

// A single macro/calorie progress row: label, value/target, and a colored fill bar.
export default function MacroBar({ label, unit = 'g', total, target }) {
  const status = statusFor(total, target)
  const pct = target > 0 ? Math.min((total / target) * 100, 100) : 0
  const remaining = Math.round(target - total)
  return (
    <div className="macrobar">
      <div className="macrobar-head">
        <span className="macrobar-label">{label}</span>
        <span className="macrobar-values">
          <strong>{Math.round(total)}</strong> / {Math.round(target)}{unit}
        </span>
      </div>
      <div className="macrobar-track" role="progressbar" aria-valuenow={Math.round(total)} aria-valuemax={Math.round(target)}>
        <div className={`macrobar-fill status-${status}`} style={{ width: `${pct}%` }} />
      </div>
      <div className={`macrobar-note status-${status}`}>
        {status === 'over'
          ? `${Math.abs(remaining)}${unit} over`
          : status === 'on-track'
            ? 'on track'
            : `${remaining}${unit} to go`}
      </div>
    </div>
  )
}
