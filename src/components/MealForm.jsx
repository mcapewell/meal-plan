import { useState } from 'react'
import { calcCalories } from '../lib/macros.js'

const BLANK = { name: '', protein: '', carbs: '', fat: '' }

// Add or edit a meal. `initial` (with id) puts the form in edit mode.
export default function MealForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial ? { ...initial } : BLANK)

  const num = (v) => (v === '' || v == null ? 0 : Number(v))
  const macros = { protein: num(form.protein), carbs: num(form.carbs), fat: num(form.fat) }
  const calories = calcCalories(macros)
  const valid = form.name.trim() && [macros.protein, macros.carbs, macros.fat].every((n) => n >= 0)

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  function submit(e) {
    e.preventDefault()
    if (!valid) return
    onSave({ name: form.name.trim(), ...macros })
    if (!initial) setForm(BLANK)
  }

  return (
    <form className="meal-form" onSubmit={submit}>
      <div className="field field-name">
        <label>Meal name</label>
        <input
          type="text"
          value={form.name}
          onChange={set('name')}
          placeholder="e.g. Chicken & rice"
          autoFocus
        />
      </div>
      <div className="macro-fields">
        {['protein', 'carbs', 'fat'].map((k) => (
          <div className="field" key={k}>
            <label>{k[0].toUpperCase() + k.slice(1)} (g)</label>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="1"
              value={form[k]}
              onChange={set(k)}
              placeholder="0"
            />
          </div>
        ))}
        <div className="field field-cals">
          <label>Calories</label>
          <output>{calories}</output>
        </div>
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={!valid}>
          {initial ? 'Save changes' : 'Add meal'}
        </button>
        {onCancel && (
          <button type="button" className="btn" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
