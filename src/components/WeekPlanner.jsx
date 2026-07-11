import { useMemo, useState } from 'react'
import { useStore } from '../state/store.jsx'
import { DAYS } from '../state/defaults.js'
import { indexMeals } from '../lib/macros.js'
import DayColumn from './DayColumn.jsx'
import MealPicker from './MealPicker.jsx'

export default function WeekPlanner() {
  const { state } = useStore()
  const mealsById = useMemo(() => indexMeals(state.meals), [state.meals])
  const [picker, setPicker] = useState(null) // { day, slot } | null

  return (
    <div className="week-planner">
      {state.meals.length === 0 && (
        <p className="hint">
          Tip: add meals on the <strong>Meals</strong> tab first, then assign them to days here.
        </p>
      )}
      <div className="week-grid">
        {DAYS.map((day) => (
          <DayColumn
            key={day}
            day={day}
            mealsById={mealsById}
            onAddTo={(d, slot) => setPicker({ day: d, slot })}
          />
        ))}
      </div>
      {picker && (
        <MealPicker day={picker.day} slot={picker.slot} onClose={() => setPicker(null)} />
      )}
    </div>
  )
}
