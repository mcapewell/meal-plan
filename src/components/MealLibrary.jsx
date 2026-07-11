import { useState } from 'react'
import { useStore } from '../state/store.jsx'
import { calcCalories } from '../lib/macros.js'
import MealForm from './MealForm.jsx'

export default function MealLibrary() {
  const { state, dispatch } = useStore()
  const [editingId, setEditingId] = useState(null)

  const meals = [...state.meals].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="meal-library">
      <section className="card">
        <h2>Add a meal</h2>
        <MealForm onSave={(meal) => dispatch({ type: 'addMeal', meal })} />
      </section>

      <section className="card">
        <h2>Your meals <span className="count">{meals.length}</span></h2>
        {meals.length === 0 && <p className="empty">No meals yet. Add your first meal above.</p>}
        <ul className="meal-list">
          {meals.map((meal) =>
            editingId === meal.id ? (
              <li key={meal.id} className="meal-row editing">
                <MealForm
                  initial={meal}
                  onSave={(m) => {
                    dispatch({ type: 'editMeal', id: meal.id, meal: m })
                    setEditingId(null)
                  }}
                  onCancel={() => setEditingId(null)}
                />
              </li>
            ) : (
              <li key={meal.id} className="meal-row">
                <div className="meal-info">
                  <span className="meal-name">{meal.name}</span>
                  <span className="meal-macros">
                    {meal.protein}P · {meal.carbs}C · {meal.fat}F
                    <span className="meal-cals">{calcCalories(meal)} kcal</span>
                  </span>
                </div>
                <div className="meal-buttons">
                  <button className="btn btn-sm" onClick={() => setEditingId(meal.id)}>Edit</button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => {
                      if (confirm(`Delete "${meal.name}"? It will be removed from the planner too.`)) {
                        dispatch({ type: 'deleteMeal', id: meal.id })
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ),
          )}
        </ul>
      </section>
    </div>
  )
}
