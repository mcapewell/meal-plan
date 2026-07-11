import { KCAL, TOLERANCE, SLOTS } from '../state/defaults.js'

// Calories derived from macros (never stored).
export function calcCalories({ protein = 0, carbs = 0, fat = 0 }) {
  return protein * KCAL.protein + carbs * KCAL.carbs + fat * KCAL.fat
}

const ZERO = { protein: 0, carbs: 0, fat: 0, calories: 0 }

// Sum a list of meal ids into totals. Repeated ids double-count (simple portioning).
export function sumMeals(mealIds, mealsById) {
  const total = { ...ZERO }
  for (const id of mealIds) {
    const meal = mealsById[id]
    if (!meal) continue
    total.protein += meal.protein
    total.carbs += meal.carbs
    total.fat += meal.fat
  }
  total.calories = calcCalories(total)
  return total
}

// Sum every slot of a day's plan.
export function sumDay(dayPlan, mealsById) {
  const total = { ...ZERO }
  for (const slot of SLOTS) {
    const s = sumMeals(dayPlan[slot] || [], mealsById)
    total.protein += s.protein
    total.carbs += s.carbs
    total.fat += s.fat
  }
  total.calories = calcCalories(total)
  return total
}

// Compare a total against a target -> 'under' | 'on-track' | 'over'.
export function statusFor(total, target) {
  if (!target) return 'under'
  const low = target * (1 - TOLERANCE)
  const high = target * (1 + TOLERANCE)
  if (total < low) return 'under'
  if (total > high) return 'over'
  return 'on-track'
}

// Build a { id: meal } lookup from the meals array.
export function indexMeals(meals) {
  const by = {}
  for (const m of meals) by[m.id] = m
  return by
}

// Target object augmented with derived calories.
export function targetWithCalories(target) {
  return { ...target, calories: calcCalories(target) }
}
