import { useStore } from '../state/store.jsx'
import { SLOTS, DAY_LABELS } from '../state/defaults.js'
import { sumDay, targetWithCalories } from '../lib/macros.js'
import SlotAssignments from './SlotAssignments.jsx'
import MacroBar from './MacroBar.jsx'

export default function DayColumn({ day, mealsById, onAddTo }) {
  const { state, dispatch } = useStore()
  const totals = sumDay(state.plan[day], mealsById)
  const target = targetWithCalories(state.targets[state.phase])
  const hasMeals = SLOTS.some((s) => state.plan[day][s].length > 0)

  return (
    <section className="day-column card">
      <header className="day-header">
        <h2>{DAY_LABELS[day]}</h2>
        {hasMeals && (
          <button
            className="btn btn-sm"
            onClick={() => {
              if (confirm(`Clear all meals from ${DAY_LABELS[day]}?`)) {
                dispatch({ type: 'clearDay', day })
              }
            }}
          >
            Clear
          </button>
        )}
      </header>

      <div className="slots">
        {SLOTS.map((slot) => (
          <SlotAssignments
            key={slot}
            day={day}
            slot={slot}
            mealsById={mealsById}
            onAdd={() => onAddTo(day, slot)}
          />
        ))}
      </div>

      <div className="day-totals">
        <div className="day-cals">
          <span className="day-cals-value">{Math.round(totals.calories)}</span>
          <span className="day-cals-target">/ {Math.round(target.calories)} kcal</span>
        </div>
        <MacroBar label="Protein" total={totals.protein} target={target.protein} />
        <MacroBar label="Carbs" total={totals.carbs} target={target.carbs} />
        <MacroBar label="Fat" total={totals.fat} target={target.fat} />
        <MacroBar label="Calories" unit="" total={totals.calories} target={target.calories} />
      </div>
    </section>
  )
}
