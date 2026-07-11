import { useStore } from '../state/store.jsx'

// Segmented Cut <-> Bulk switch. Lives in the header; drives which target is active everywhere.
export default function PhaseToggle() {
  const { state, dispatch } = useStore()
  return (
    <div className={`phase-toggle phase-${state.phase}`} role="group" aria-label="Training phase">
      <button
        className={state.phase === 'cut' ? 'active' : ''}
        onClick={() => dispatch({ type: 'setPhase', phase: 'cut' })}
        aria-pressed={state.phase === 'cut'}
      >
        Cutting
      </button>
      <button
        className={state.phase === 'bulk' ? 'active' : ''}
        onClick={() => dispatch({ type: 'setPhase', phase: 'bulk' })}
        aria-pressed={state.phase === 'bulk'}
      >
        Bulking
      </button>
    </div>
  )
}
