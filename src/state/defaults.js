// App-wide constants and the seed state used on first run.

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const DAY_LABELS = {
  Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday',
  Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday',
}
export const SLOTS = ['Breakfast', 'Lunch', 'Dinner', 'Snacks']

export const STORAGE_KEY = 'mealPlanner:v1'

// kcal per gram
export const KCAL = { protein: 4, carbs: 4, fat: 9 }

// Tolerance band (fraction) for a macro/calorie total to count as "on track".
export const TOLERANCE = 0.05

// Empty 7-day x 4-slot plan, each slot an array of meal ids.
export function emptyPlan() {
  const plan = {}
  for (const day of DAYS) {
    plan[day] = {}
    for (const slot of SLOTS) plan[day][slot] = []
  }
  return plan
}

// Default targets, personalized (see plan): Mifflin-St Jeor BMR 1814 x 1.55 = TDEE ~2812.
// Cut = TDEE - 500, Bulk = TDEE + 375. Protein held constant ~185g (lean-mass based),
// fat as a floor, carbs fill the rest. Calories are derived, not stored.
export const DEFAULT_TARGETS = {
  cut: { protein: 185, carbs: 225, fat: 75 },   // ~2315 kcal
  bulk: { protein: 185, carbs: 420, fat: 85 },  // ~3185 kcal
}

export function initialState() {
  return {
    meals: [],
    plan: emptyPlan(),
    phase: 'cut',
    targets: DEFAULT_TARGETS,
  }
}
