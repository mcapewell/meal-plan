import { useRef, useState } from 'react'
import { useStore } from '../state/store.jsx'

// Export the whole state to a JSON file, and import it back.
export default function DataBackup() {
  const { state, dispatch } = useStore()
  const fileInput = useRef(null)
  const [msg, setMsg] = useState('')

  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `meal-planner-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMsg('Exported.')
  }

  function onFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result)
        if (!confirm('Import will replace your current meals, plan and targets. Continue?')) return
        dispatch({ type: 'importData', data })
        setMsg('Imported.')
      } catch {
        setMsg('Could not read that file — is it a valid export?')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <section className="card">
      <h2>Backup &amp; restore</h2>
      <p className="hint">
        Your data lives only on this device. Export a JSON backup, or import one to move devices.
      </p>
      <div className="form-actions">
        <button className="btn" onClick={exportData}>Export JSON</button>
        <button className="btn" onClick={() => fileInput.current?.click()}>Import JSON</button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          onChange={onFile}
          hidden
        />
      </div>
      {msg && <p className="backup-msg">{msg}</p>}
    </section>
  )
}
