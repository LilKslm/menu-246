import { useState } from 'react'

function calculateDays(startDate, endDate) {
  if (!startDate || !endDate) return 0
  const start = new Date(startDate)
  const end = new Date(endDate)
  if (end < start) return 0
  return Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1
}

export default function CampSetup({ initial, onComplete, recipesLoading, recipesError }) {
  const [form, setForm] = useState({
    campName: initial.campName || '',
    startDate: initial.startDate || '',
    endDate: initial.endDate || '',
    numPeople: initial.numPeople || 10,
  })
  const [errors, setErrors] = useState({})

  const numDays = calculateDays(form.startDate, form.endDate)

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  function validate() {
    const errs = {}
    if (!form.startDate) errs.startDate = 'Requis'
    if (!form.endDate) errs.endDate = 'Requis'
    if (form.startDate && form.endDate && new Date(form.endDate) < new Date(form.startDate)) {
      errs.endDate = 'La date de fin doit être après la date de début'
    }
    if (!form.numPeople || form.numPeople < 1) errs.numPeople = 'Minimum 1 personne'
    if (numDays > 21) errs.endDate = 'Maximum 21 jours'
    return errs
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    onComplete({ ...form, numPeople: parseInt(form.numPeople, 10), numDays })
  }

  const canProceed = !recipesLoading && !recipesError

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="min-h-full flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm">

          {/* Hero */}
          <div className="text-center mb-8">
            <img
              src="/app-logo.jpg"
              alt="Menu 246"
              className="w-24 h-24 rounded-2xl mx-auto mb-5 shadow-lg object-cover"
            />
            <h2 className="text-2xl font-extrabold text-apple-dark mb-2">Menu 246</h2>
            <p className="text-apple-secondary text-sm leading-relaxed">
              Planifiez les repas de votre camp et générez votre liste d'épicerie.
            </p>
          </div>

          {/* Recipe loading status */}
          {recipesLoading && (
            <div className="mb-5 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
              <svg className="animate-spin h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Chargement des recettes…
            </div>
          )}
          {recipesError && (
            <div className="mb-5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              <strong>Erreur:</strong> {recipesError}
            </div>
          )}
          {!recipesLoading && !recipesError && (
            <div className="mb-5 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
              <span>✓</span> Recettes chargées
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="card space-y-5">

            <div>
              <label className="label">Nom du camp <span className="text-apple-secondary font-normal">(optionnel)</span></label>
              <input
                type="text"
                className="input-field"
                placeholder="ex: Camp Été 2025"
                value={form.campName}
                onChange={e => set('campName', e.target.value)}
              />
            </div>

            {/* Dates — stacked vertically on mobile, side-by-side on larger screens */}
            <div className="space-y-4">
              <div>
                <label className="label">Date de début</label>
                <input
                  type="date"
                  className={`input-field ${errors.startDate ? 'border-red-400 ring-1 ring-red-400' : ''}`}
                  value={form.startDate}
                  onChange={e => set('startDate', e.target.value)}
                />
                {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>}
              </div>

              {/* Arrow indicator between dates */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-apple-gray-2" />
                <span className="text-apple-secondary text-xs font-medium">jusqu'au</span>
                <div className="flex-1 h-px bg-apple-gray-2" />
              </div>

              <div>
                <label className="label">Date de fin</label>
                <input
                  type="date"
                  className={`input-field ${errors.endDate ? 'border-red-400 ring-1 ring-red-400' : ''}`}
                  value={form.endDate}
                  min={form.startDate}
                  onChange={e => set('endDate', e.target.value)}
                />
                {errors.endDate && <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>}
              </div>
            </div>

            {/* Duration badge */}
            {numDays > 0 && (
              <div className="bg-apple-blue/10 rounded-xl px-4 py-3 text-center">
                <span className="font-extrabold text-apple-blue text-2xl">{numDays}</span>
                <span className="text-apple-blue text-sm ml-1.5">
                  jour{numDays > 1 ? 's' : ''} de camp
                </span>
              </div>
            )}

            <div>
              <label className="label">Nombre de participants</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => set('numPeople', Math.max(1, (parseInt(form.numPeople, 10) || 1) - 1))}
                  className="w-11 h-11 rounded-xl bg-apple-gray hover:bg-apple-gray-2 text-apple-dark font-bold text-xl flex items-center justify-center transition-colors flex-shrink-0"
                >
                  −
                </button>
                <input
                  type="number"
                  className={`input-field text-center text-lg font-semibold ${errors.numPeople ? 'border-red-400' : ''}`}
                  value={form.numPeople}
                  min="1"
                  max="500"
                  onChange={e => set('numPeople', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => set('numPeople', (parseInt(form.numPeople, 10) || 0) + 1)}
                  className="w-11 h-11 rounded-xl bg-apple-gray hover:bg-apple-gray-2 text-apple-dark font-bold text-xl flex items-center justify-center transition-colors flex-shrink-0"
                >
                  +
                </button>
              </div>
              {errors.numPeople && <p className="text-xs text-red-500 mt-1">{errors.numPeople}</p>}
            </div>

            <button
              type="submit"
              disabled={!canProceed}
              className="btn-primary w-full text-base py-3.5"
            >
              {recipesLoading ? 'Chargement…' : 'Commencer →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
