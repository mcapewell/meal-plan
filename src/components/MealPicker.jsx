import { useEffect, useState } from 'react'
import { useStore } from '../state/store.jsx'
import { calcCalories } from '../lib/macros.js'

// Modal to pick a meal from the library to drop into a slot.
export default function MealPicker({ day, slot, onClose }) {
  const { state, dispatch } = useStore()
  const [q, setQ] = useState('')

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const meals = [...state.meals]
    .filter((m) => m.name.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name))

  function pick(mealId) {
    dispatch({ type: 'assign', day, slot, mealId })
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-head">
          <h3>Add to {slot}</h3>
          <button className="btn btn-sm" onClick={onClose} aria-label="Close">✕</button>
        </div>
        {state.meals.length === 0 ? (
          <p className="empty">No meals in your library yet. Add some on the Meals tab first.</p>
        ) : (
          <>
            <input
              className="picker-search"
              type="search"
              placeholder="Search meals…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoFocus
            />
            <ul className="picker-list">
              {meals.map((meal) => (
                <li key={meal.id}>
                  <button className="picker-item" onClick={() => pick(meal.id)}>
                    <span className="meal-name">{meal.name}</span>
                    <span className="meal-macros">
                      {meal.protein}P · {meal.carbs}C · {meal.fat}F
                      <span className="meal-cals">{calcCalories(meal)} kcal</span>
                    </span>
                  </button>
                </li>
              ))}
              {meals.length === 0 && <li className="empty">No matches.</li>}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}
