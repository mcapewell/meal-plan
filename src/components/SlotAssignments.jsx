import { useStore } from '../state/store.jsx'
import { calcCalories } from '../lib/macros.js'

// The meals assigned to one slot, with remove buttons and an "add" trigger.
export default function SlotAssignments({ day, slot, mealsById, onAdd }) {
  const { state, dispatch } = useStore()
  const ids = state.plan[day][slot]

  return (
    <div className="slot">
      <div className="slot-head">
        <span className="slot-name">{slot}</span>
        <button className="btn btn-sm btn-add" onClick={onAdd} aria-label={`Add meal to ${slot}`}>
          + Add
        </button>
      </div>
      {ids.length === 0 ? (
        <p className="slot-empty">—</p>
      ) : (
        <ul className="slot-list">
          {ids.map((mealId, index) => {
            const meal = mealsById[mealId]
            if (!meal) return null
            return (
              <li key={index} className="slot-item">
                <span className="slot-item-name">{meal.name}</span>
                <span className="slot-item-cals">{calcCalories(meal)}</span>
                <button
                  className="slot-remove"
                  onClick={() => dispatch({ type: 'unassign', day, slot, index })}
                  aria-label={`Remove ${meal.name}`}
                >
                  ✕
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
