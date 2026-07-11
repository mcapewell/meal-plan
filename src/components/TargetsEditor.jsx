import { useStore } from '../state/store.jsx'
import { calcCalories } from '../lib/macros.js'

function PhaseCard({ phase, title, subtitle, target, active, onChange }) {
  const calories = calcCalories(target)
  return (
    <section className={`card target-card ${active ? 'is-active' : ''}`}>
      <h2>
        {title}
        {active && <span className="active-pill">Active</span>}
      </h2>
      <p className="target-sub">{subtitle}</p>
      <div className="target-fields">
        {['protein', 'carbs', 'fat'].map((k) => (
          <div className="field" key={k}>
            <label>{k[0].toUpperCase() + k.slice(1)} (g)</label>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="1"
              value={target[k]}
              onChange={(e) => onChange(phase, { [k]: Number(e.target.value) || 0 })}
            />
          </div>
        ))}
        <div className="field field-cals">
          <label>Calories</label>
          <output>{calories}</output>
        </div>
      </div>
    </section>
  )
}

export default function TargetsEditor() {
  const { state, dispatch } = useStore()
  const onChange = (phase, macros) => dispatch({ type: 'setTarget', phase, macros })

  return (
    <div className="targets-editor">
      <p className="hint">
        Calories are derived from your macros (protein &amp; carbs ×4, fat ×9). These are starting
        points — adjust from your real-world weight trend over a few weeks.
      </p>
      <PhaseCard
        phase="cut"
        title="Cutting"
        subtitle="Calorie deficit for fat loss."
        target={state.targets.cut}
        active={state.phase === 'cut'}
        onChange={onChange}
      />
      <PhaseCard
        phase="bulk"
        title="Bulking"
        subtitle="Calorie surplus for muscle gain."
        target={state.targets.bulk}
        active={state.phase === 'bulk'}
        onChange={onChange}
      />
    </div>
  )
}
