import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import { STORAGE_KEY, SLOTS, DAYS, emptyPlan, initialState } from './defaults.js'

// ---- persistence ----

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState()
    const parsed = JSON.parse(raw)
    return migrate(parsed)
  } catch {
    return initialState()
  }
}

// Fill in any missing pieces so an older/partial payload can't crash the UI.
function migrate(state) {
  const base = initialState()
  const plan = emptyPlan()
  if (state.plan) {
    for (const day of DAYS) {
      for (const slot of SLOTS) {
        const cell = state.plan[day]?.[slot]
        if (Array.isArray(cell)) plan[day][slot] = cell.filter((id) => typeof id === 'string')
      }
    }
  }
  return {
    meals: Array.isArray(state.meals) ? state.meals : base.meals,
    plan,
    phase: state.phase === 'bulk' ? 'bulk' : 'cut',
    targets: {
      cut: { ...base.targets.cut, ...(state.targets?.cut || {}) },
      bulk: { ...base.targets.bulk, ...(state.targets?.bulk || {}) },
    },
  }
}

// ---- reducer ----

function id() {
  return (crypto.randomUUID?.() || 'm' + Date.now() + Math.random().toString(36).slice(2))
}

function reducer(state, action) {
  switch (action.type) {
    case 'addMeal': {
      const meal = { id: id(), ...action.meal }
      return { ...state, meals: [...state.meals, meal] }
    }
    case 'editMeal':
      return {
        ...state,
        meals: state.meals.map((m) => (m.id === action.id ? { ...m, ...action.meal } : m)),
      }
    case 'deleteMeal': {
      // Remove the meal and strip it from every planner slot.
      const plan = {}
      for (const day of DAYS) {
        plan[day] = {}
        for (const slot of SLOTS) {
          plan[day][slot] = state.plan[day][slot].filter((mid) => mid !== action.id)
        }
      }
      return { ...state, meals: state.meals.filter((m) => m.id !== action.id), plan }
    }
    case 'assign': {
      const { day, slot, mealId } = action
      const plan = { ...state.plan, [day]: { ...state.plan[day], [slot]: [...state.plan[day][slot], mealId] } }
      return { ...state, plan }
    }
    case 'unassign': {
      // Remove a single occurrence at the given index.
      const { day, slot, index } = action
      const arr = state.plan[day][slot].filter((_, i) => i !== index)
      const plan = { ...state.plan, [day]: { ...state.plan[day], [slot]: arr } }
      return { ...state, plan }
    }
    case 'clearDay': {
      const cleared = {}
      for (const slot of SLOTS) cleared[slot] = []
      return { ...state, plan: { ...state.plan, [action.day]: cleared } }
    }
    case 'setPhase':
      return { ...state, phase: action.phase }
    case 'setTarget':
      return {
        ...state,
        targets: { ...state.targets, [action.phase]: { ...state.targets[action.phase], ...action.macros } },
      }
    case 'importData':
      return migrate(action.data)
    default:
      return state
  }
}

// ---- context ----

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* storage full or unavailable — ignore */
    }
  }, [state])

  const value = useMemo(() => ({ state, dispatch }), [state])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
