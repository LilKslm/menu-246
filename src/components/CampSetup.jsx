import { useState, useEffect } from 'react'

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
    if (numDays > 21) errs.endDate = 'Maximum 21 jours de camp'
    return errs
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    onComplete({
      ...form,
      numPeople: parseInt(form.numPeople, 10),
      numDays,
    })
  }

  const canProceed = !recipesLoading && !recipesError

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">🏕️</div>
          <h2 className="text-3xl font-bold text-apple-dark mb-2">Planificateur de menus scouts</h2>
          <p className="text-apple-secondary text-base">
            Organisez vos repas de camp, créez une liste d'épicerie et générez vos menus imprimables.
          </p>
        </div>

        {/* Recipe loading status */}
        {recipesLoading && (
          <div className="mb-6 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
            <svg className="animate-spin h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Chargement de la bibliothèque de recettes…
          </div>
        )}
        {recipesError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            <strong>Erreur de chargement:</strong> {recipesError}
          </div>
        )}
        {!recipesLoading && !recipesError && (
          <div className="mb-6 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
            <span>✓</span> Bibliothèque de recettes chargée avec succès
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date de début</label>
              <input
                type="date"
                className={`input-field ${errors.startDate ? 'border-red-400 ring-1 ring-red-400' : ''}`}
                value={form.startDate}
                onChange={e => set('startDate', e.target.value)}
              />
              {errors.startDate && (
                <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>
              )}
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
              {errors.endDate && (
                <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>
              )}
            </div>
          </div>

          {/* Duration indicator */}
          {numDays > 0 && (
            <div className="bg-apple-gray rounded-xl px-4 py-3 text-sm text-center">
              <span className="font-bold text-apple-blue text-lg">{numDays}</span>
              <span className="text-apple-secondary ml-1">
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
                className="w-10 h-10 rounded-xl bg-apple-gray hover:bg-apple-gray-2 text-apple-dark font-bold text-xl flex items-center justify-center transition-colors"
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
                className="w-10 h-10 rounded-xl bg-apple-gray hover:bg-apple-gray-2 text-apple-dark font-bold text-xl flex items-center justify-center transition-colors"
              >
                +
              </button>
            </div>
            {errors.numPeople && (
              <p className="text-xs text-red-500 mt-1">{errors.numPeople}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!canProceed}
            className="btn-primary w-full text-base py-3"
          >
            {recipesLoading ? 'Chargement…' : 'Commencer la planification →'}
          </button>
        </form>
      </div>
    </div>
  )
}
