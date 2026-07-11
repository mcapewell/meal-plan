import { useState } from 'react'
import PhaseToggle from './components/PhaseToggle.jsx'
import WeekPlanner from './components/WeekPlanner.jsx'
import MealLibrary from './components/MealLibrary.jsx'
import TargetsEditor from './components/TargetsEditor.jsx'
import DataBackup from './components/DataBackup.jsx'

const TABS = [
  { id: 'planner', label: 'Planner' },
  { id: 'meals', label: 'Meals' },
  { id: 'targets', label: 'Targets' },
]

export default function App() {
  const [tab, setTab] = useState('planner')

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title">
          <h1>Meal Planner</h1>
        </div>
        <PhaseToggle />
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="app-main">
        {tab === 'planner' && <WeekPlanner />}
        {tab === 'meals' && <MealLibrary />}
        {tab === 'targets' && (
          <>
            <TargetsEditor />
            <DataBackup />
          </>
        )}
      </main>
    </div>
  )
}
