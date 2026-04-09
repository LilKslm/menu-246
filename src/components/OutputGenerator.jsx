import { useState, useMemo, useEffect } from 'react'
import heroImgImport from '../assets/menu-frontpage.jpg'
import {
  buildGroceryList,
  generateCSV,
  buildMenuSummary,
  getOrderedSections,
  formatAmount,
  formatGroceryQty,
  formatGroceryUnit,
  parseLocalDate,
} from '../utils/calculations'

const MEAL_LABELS = {
  breakfast: 'Déjeuner',
  lunch: 'Dîner',
  dinner: 'Souper',
  snack: 'Collation',
}
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']
const MEAL_ICONS = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' }
const SECTION_ICON = {
  'Fruits et légumes': '🥦',
  'Produits céréaliers': '🌾',
  'Produits laitiers': '🥛',
  'Viandes': '🥩',
  'Varia': '🧂',
  'Varia - Congelés': '🧊',
}

// ── Persistence helpers ───────────────────────────────────────
function checkedKey(campSetup) {
  return `scoutChecked_${campSetup.campName || 'camp'}_${campSetup.startDate}`
}
function loadChecked(campSetup) {
  try {
    const raw = localStorage.getItem(checkedKey(campSetup))
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}
function saveChecked(campSetup, checked) {
  try {
    localStorage.setItem(checkedKey(campSetup), JSON.stringify(checked))
  } catch {}
}

// ── HTML escape helper (prevents XSS in generated pages) ─────
function escHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ── Download / open helpers ───────────────────────────────────
function downloadBlob(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click()
  document.body.removeChild(a); URL.revokeObjectURL(url)
}

function openHTMLInNewTab(html, autoPrint = false) {
  const finalHtml = autoPrint
    ? html.replace('</body>', `<script>window.addEventListener('load',()=>setTimeout(window.print,600));</script></body>`)
    : html
  const blob = new Blob([finalHtml], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 15000)
}

// ── Shared page shell ─────────────────────────────────────────
function buildSharedStyles() {
  return `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Arial, sans-serif;
    background: #F2F2F7; color: #1C1C1E; padding: 24px 20px;
  }
  .container { max-width: 680px; margin: 0 auto; }

  /* Hero header with image */
  .hero {
    position: relative; border-radius: 20px; overflow: hidden;
    margin-bottom: 24px; box-shadow: 0 4px 24px rgba(0,0,0,0.15);
  }
  .hero img { width: 100%; height: 200px; object-fit: cover; display: block; }
  .hero-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(160deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.65) 100%);
    display: flex; flex-direction: column; justify-content: flex-end;
    padding: 22px 26px;
  }
  .hero-title { font-size: 26px; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
  .hero-subtitle { font-size: 15px; color: rgba(255,255,255,0.85); margin-top: 3px; }
  .hero-chips {
    display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap;
  }
  .hero-chip {
    background: rgba(255,255,255,0.2); backdrop-filter: blur(4px);
    border: 1px solid rgba(255,255,255,0.3); border-radius: 20px;
    padding: 3px 11px; font-size: 12px; font-weight: 600; color: #fff;
  }

  /* Print button */
  .print-btn {
    position: fixed; bottom: 24px; right: 24px; z-index: 100;
    background: #007AFF; color: #fff; border: none; border-radius: 16px;
    padding: 12px 22px; font-size: 14px; font-weight: 700;
    box-shadow: 0 4px 16px rgba(0,122,255,0.4); cursor: pointer;
    font-family: inherit;
  }
  .print-btn:hover { background: #0062cc; }

  @media print {
    body { background: #fff; padding: 10px; }
    .print-btn { display: none !important; }
    .hero { box-shadow: none; border: 1px solid #ddd; }
    .hero img { height: 150px; }
  }`
}

function buildHeroHTML(campSetup, heroImg, subtitle) {
  const campName = campSetup.campName || 'Menu du camp'
  const n = campSetup.numPeople
  const imgTag = heroImg
    ? `<img src="${heroImg}" alt="Menu 246" />`
    : `<div style="width:100%;height:200px;background:linear-gradient(135deg,#1a472a,#2d6a4f);"></div>`

  const fmtDate = d => {
    try { return parseLocalDate(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' }) }
    catch { return d }
  }
  const dateChip = campSetup.startDate && campSetup.endDate
    ? `<span class="hero-chip">📅 ${fmtDate(campSetup.startDate)} – ${fmtDate(campSetup.endDate)}</span>`
    : `<span class="hero-chip">📅 ${campSetup.numDays} jour${campSetup.numDays > 1 ? 's' : ''}</span>`

  return `
  <div class="hero">
    ${imgTag}
    <div class="hero-overlay">
      <div class="hero-title">Menu 246</div>
      <div class="hero-subtitle">${escHtml(campName)} — ${escHtml(subtitle)}</div>
      <div class="hero-chips">
        ${dateChip}
        <span class="hero-chip">👥 ${n} participant${n > 1 ? 's' : ''}</span>
      </div>
    </div>
  </div>`
}

// ── Visual menu HTML ──────────────────────────────────────────
function buildVisualMenuHTML(campSetup, mealPlan, heroImg) {
  const summary = buildMenuSummary(campSetup, mealPlan)
  const campName = campSetup.campName || 'Menu du camp'
  const n = campSetup.numPeople

  const dayCards = summary.map(({ dayLabel, meals }) => {
    const mealRows = MEAL_TYPES.map(mt => {
      const recipes = meals[mt] || []
      return `
        <div style="display:flex;align-items:flex-start;gap:14px;padding:9px 0;border-bottom:1px solid #F2F2F7;">
          <div style="display:flex;align-items:center;gap:8px;width:110px;flex-shrink:0;">
            <span style="font-size:15px;">${MEAL_ICONS[mt]}</span>
            <span style="font-size:10px;font-weight:700;color:#8E8E93;text-transform:uppercase;letter-spacing:0.06em;">${MEAL_LABELS[mt]}</span>
          </div>
          <div style="flex:1;min-width:0;">
            ${recipes.length > 0
              ? recipes.map(r => `<div style="font-size:13px;font-weight:600;color:#1C1C1E;line-height:1.4;">${escHtml(r.name)}</div>`).join('')
              : `<span style="font-size:12px;color:#C7C7CC;font-style:italic;">Non planifié</span>`
            }
          </div>
        </div>`
    }).join('')

    return `
      <div style="background:#fff;border-radius:16px;padding:18px 22px;margin-bottom:14px;box-shadow:0 2px 10px rgba(0,0,0,0.06);page-break-inside:avoid;">
        <h2 style="font-size:15px;font-weight:700;color:#007AFF;margin-bottom:10px;text-transform:capitalize;padding-bottom:8px;border-bottom:2px solid #F2F2F7;">
          ${escHtml(dayLabel)}
        </h2>
        ${mealRows}
      </div>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escHtml(campName)} — Menu visuel</title>
<style>${buildSharedStyles()}</style>
</head>
<body>
<div class="container">
  ${buildHeroHTML(campSetup, heroImg, 'Menu visuel')}
  ${dayCards}
</div>
<button class="print-btn" onclick="window.print()">🖨 Imprimer / PDF</button>
</body>
</html>`
}

// ── Detailed menu HTML ────────────────────────────────────────
function buildDetailedMenuHTML(campSetup, mealPlan, heroImg) {
  const summary = buildMenuSummary(campSetup, mealPlan)
  const campName = campSetup.campName || 'Menu du camp'
  const n = campSetup.numPeople

  const dayBlocks = summary.map(({ dayLabel, meals }) => {
    const mealBlocks = MEAL_TYPES.map(mt => {
      const recipes = meals[mt] || []
      if (recipes.length === 0) return `
        <div style="padding:8px 0;border-bottom:1px solid #F2F2F7;display:flex;align-items:center;gap:12px;">
          <span style="font-size:14px;">${MEAL_ICONS[mt]}</span>
          <div>
            <div style="font-size:10px;font-weight:700;color:#8E8E93;text-transform:uppercase;">${MEAL_LABELS[mt]}</div>
            <div style="font-size:12px;color:#C7C7CC;font-style:italic;margin-top:2px;">Non planifié</div>
          </div>
        </div>`

      const recipeBlocks = recipes.map(recipe => {
        const ingrRows = recipe.ingredients.map(ingr => `
          <tr>
            <td style="padding:4px 8px 4px 0;font-size:11px;color:#1C1C1E;">${escHtml(ingr.ingredient)}</td>
            <td style="padding:4px 8px;font-size:11px;color:#8E8E93;text-align:right;white-space:nowrap;">${formatAmount(ingr.portion)} ${ingr.unit}</td>
            <td style="padding:4px 0 4px 8px;font-size:11px;font-weight:700;color:#007AFF;text-align:right;white-space:nowrap;">${formatAmount(ingr.portion * n)} ${ingr.unit}</td>
          </tr>`).join('')

        return `
          <div style="margin-bottom:10px;padding-left:26px;">
            <div style="font-size:13px;font-weight:700;color:#007AFF;margin-bottom:5px;">${escHtml(recipe.name)}</div>
            <table style="border-collapse:collapse;width:100%;">
              <thead>
                <tr style="border-bottom:1px solid #E5E5EA;">
                  <th style="text-align:left;padding:3px 8px 3px 0;font-size:9px;color:#8E8E93;font-weight:700;text-transform:uppercase;">Ingrédient</th>
                  <th style="text-align:right;padding:3px 8px;font-size:9px;color:#8E8E93;font-weight:700;text-transform:uppercase;">×1</th>
                  <th style="text-align:right;padding:3px 0 3px 8px;font-size:9px;color:#8E8E93;font-weight:700;text-transform:uppercase;">×${n}</th>
                </tr>
              </thead>
              <tbody>${ingrRows}</tbody>
            </table>
          </div>`
      }).join('')

      return `
        <div style="margin-bottom:14px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <span style="font-size:16px;">${MEAL_ICONS[mt]}</span>
            <span style="font-size:10px;font-weight:700;color:#8E8E93;text-transform:uppercase;letter-spacing:0.06em;">${MEAL_LABELS[mt]}</span>
          </div>
          ${recipeBlocks}
        </div>`
    }).join('')

    return `
      <div style="background:#fff;border-radius:16px;padding:18px 22px;margin-bottom:14px;box-shadow:0 2px 10px rgba(0,0,0,0.06);page-break-inside:avoid;">
        <h2 style="font-size:15px;font-weight:700;color:#1C1C1E;margin-bottom:14px;padding-bottom:10px;border-bottom:2px solid #007AFF;text-transform:capitalize;">${escHtml(dayLabel)}</h2>
        ${mealBlocks}
      </div>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escHtml(campName)} — Menu détaillé</title>
<style>${buildSharedStyles()}</style>
</head>
<body>
<div class="container" style="max-width:720px;">
  ${buildHeroHTML(campSetup, heroImg, 'Menu détaillé')}
  ${dayBlocks}
</div>
<button class="print-btn" onclick="window.print()">🖨 Imprimer / PDF</button>
</body>
</html>`
}

// ── Grocery list HTML ─────────────────────────────────────────
function buildGroceryHTML(campSetup, mealPlan, heroImg) {
  const { bySection } = buildGroceryList(mealPlan, campSetup.numPeople)
  const sections = getOrderedSections(bySection)
  const campName = campSetup.campName || 'Camp'

  const sectionBlocks = sections.map(section => {
    const rows = bySection[section].map((item, i) => `
      <tr style="${i % 2 === 1 ? 'background:#FAFAFA;' : ''}">
        <td style="padding:10px 12px;font-size:13px;border-bottom:1px solid #F2F2F7;">
          <label style="display:flex;align-items:center;gap:10px;cursor:pointer;">
            <input type="checkbox" style="width:16px;height:16px;accent-color:#007AFF;flex-shrink:0;">
            <span class="item-name">${escHtml(item.ingredient)}</span>
          </label>
        </td>
        <td style="padding:10px 12px;font-size:13px;font-weight:700;text-align:right;border-bottom:1px solid #F2F2F7;color:#007AFF;white-space:nowrap;">${formatGroceryQty(item.totalAmount, item.unit)}</td>
        <td style="padding:10px 12px;font-size:13px;color:#636366;border-bottom:1px solid #F2F2F7;white-space:nowrap;">${formatGroceryUnit(item.totalAmount, item.unit)}</td>
      </tr>`).join('')

    return `
      <div style="margin-bottom:20px;border-radius:14px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.06);">
        <div style="background:linear-gradient(135deg,#007AFF,#0062cc);color:white;padding:10px 16px;font-weight:700;font-size:13px;display:flex;align-items:center;gap:8px;">
          <span style="font-size:16px;">${SECTION_ICON[section] || '📦'}</span>
          <span>${section}</span>
          <span style="margin-left:auto;background:rgba(255,255,255,0.2);border-radius:10px;padding:2px 9px;font-size:11px;">${bySection[section].length} article${bySection[section].length > 1 ? 's' : ''}</span>
        </div>
        <table style="border-collapse:collapse;width:100%;background:white;">
          <thead>
            <tr style="background:#F9F9FB;">
              <th style="text-align:left;padding:8px 12px;font-size:10px;color:#8E8E93;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid #E5E5EA;">Ingrédient</th>
              <th style="text-align:right;padding:8px 12px;font-size:10px;color:#8E8E93;font-weight:700;text-transform:uppercase;border-bottom:1px solid #E5E5EA;width:15%;">Quantité</th>
              <th style="padding:8px 12px;font-size:10px;color:#8E8E93;font-weight:700;text-transform:uppercase;border-bottom:1px solid #E5E5EA;width:20%;">Unité</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escHtml(campName)} — Liste d'épicerie</title>
<style>
${buildSharedStyles()}
.item-name.checked { text-decoration:line-through; color:#8E8E93; }
</style>
<script>
  document.addEventListener('change', function(e) {
    if (e.target.type === 'checkbox') {
      var name = e.target.closest('label')?.querySelector('.item-name');
      if (name) name.classList.toggle('checked', e.target.checked);
    }
  });
</script>
</head>
<body>
<div class="container">
  ${buildHeroHTML(campSetup, heroImg, "Liste d'épicerie")}
  ${sectionBlocks}
</div>
<button class="print-btn" onclick="window.print()">🖨 Imprimer / PDF</button>
</body>
</html>`
}

// ── OutputGenerator component ─────────────────────────────────
export default function OutputGenerator({ campSetup, mealPlan, onBack }) {
  const [generated, setGenerated] = useState({})
  const [heroImg, setHeroImg] = useState(null)

  // Convert imported image URL to base64 so it works inside blob: HTML pages
  useEffect(() => {
    fetch(heroImgImport)
      .then(r => r.blob())
      .then(blob => {
        const reader = new FileReader()
        reader.onload = e => setHeroImg(e.target.result)
        reader.readAsDataURL(blob)
      })
      .catch(() => {})
  }, [])

  // ── In-app grocery list checkboxes ───────────────────────────
  const [checked, setChecked] = useState(() => loadChecked(campSetup))

  function toggleChecked(key) {
    setChecked(prev => {
      const next = { ...prev, [key]: !prev[key] }
      saveChecked(campSetup, next)
      return next
    })
  }
  function resetChecked() {
    setChecked({})
    saveChecked(campSetup, {})
  }

  const filledMeals = Object.values(mealPlan).reduce(
    (total, day) => total + Object.values(day).filter(slot => Array.isArray(slot) ? slot.length > 0 : Boolean(slot)).length, 0
  )
  const totalSlots = campSetup.numDays * 4
  const hasAnyMeal = filledMeals > 0

  const { bySection } = useMemo(
    () => hasAnyMeal ? buildGroceryList(mealPlan, campSetup.numPeople) : { bySection: {} },
    [mealPlan, campSetup.numPeople, hasAnyMeal]
  )
  const orderedSections = getOrderedSections(bySection)
  const totalItems = orderedSections.reduce((s, sec) => s + (bySection[sec]?.length || 0), 0)
  const checkedCount = Object.values(checked).filter(Boolean).length

  const slug = (campSetup.campName || 'camp').replace(/\s+/g, '-')

  function handleDownloadCSV() {
    const csv = generateCSV(campSetup, mealPlan)
    downloadBlob(csv, `${slug}-epicerie.csv`, 'text/csv;charset=utf-8')
    setGenerated(p => ({ ...p, csv: true }))
  }

  async function handleShareGrocery() {
    const { bySection } = buildGroceryList(mealPlan, campSetup.numPeople)
    const sections = getOrderedSections(bySection)
    const lines = []
    const campLabel = campSetup.campName || 'Camp scout'
    lines.push(`🏕 Liste d'épicerie — ${campLabel}`)
    lines.push(`📅 ${campSetup.numDays} jours · 👥 ${campSetup.numPeople} personnes`)
    lines.push('')
    for (const section of sections) {
      lines.push(`── ${section} ──`)
      for (const item of bySection[section]) {
        lines.push(`☐ ${item.ingredient}  ${formatGroceryQty(item.totalAmount, item.unit)} ${formatGroceryUnit(item.totalAmount, item.unit)}`.trim())
      }
      lines.push('')
    }
    const text = lines.join('\n')
    if (navigator.share) {
      try {
        await navigator.share({ title: `Épicerie — ${campLabel}`, text })
        setGenerated(p => ({ ...p, share: true }))
        return
      } catch {}
    }
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(text)
      setGenerated(p => ({ ...p, share: true }))
      alert('Liste copiée! Collez-la dans vos Notes.')
    } catch {
      alert('Partagez via le bouton CSV.')
    }
  }
  function handleGroceryHTML() {
    openHTMLInNewTab(buildGroceryHTML(campSetup, mealPlan, heroImg))
    setGenerated(p => ({ ...p, groceryPrint: true }))
  }
  function handleGroceryPDF() {
    openHTMLInNewTab(buildGroceryHTML(campSetup, mealPlan, heroImg), true)
    setGenerated(p => ({ ...p, groceryPrint: true }))
  }
  function handleVisualMenu() {
    openHTMLInNewTab(buildVisualMenuHTML(campSetup, mealPlan, heroImg))
    setGenerated(p => ({ ...p, visual: true }))
  }
  function handleVisualMenuPDF() {
    openHTMLInNewTab(buildVisualMenuHTML(campSetup, mealPlan, heroImg), true)
    setGenerated(p => ({ ...p, visual: true }))
  }
  function handleDetailedMenu() {
    openHTMLInNewTab(buildDetailedMenuHTML(campSetup, mealPlan, heroImg))
    setGenerated(p => ({ ...p, detailed: true }))
  }
  function handleDetailedMenuPDF() {
    openHTMLInNewTab(buildDetailedMenuHTML(campSetup, mealPlan, heroImg), true)
    setGenerated(p => ({ ...p, detailed: true }))
  }

  const exportCards = [
    {
      key: 'csv',
      icon: '📊', color: 'bg-green-50 border border-green-200',
      title: "Liste d'épicerie",
      sub: 'CSV pour Excel ou Google Sheets',
      desc: `Quantités totales pour ${campSetup.numPeople} personnes, groupées par section avec sous-totaux.`,
      actions: [
        { label: '⬇ CSV', fn: handleDownloadCSV, primary: true },
        { label: '📱 Partager', fn: handleShareGrocery, primary: false },
      ],
    },
    {
      key: 'groceryPrint',
      icon: '🛒', color: 'bg-teal-50 border border-teal-200',
      title: "Liste d'épicerie imprimable",
      sub: 'Cases à cocher interactives',
      desc: 'Cochez les articles au fur et à mesure de vos achats. Fonctionne hors-ligne.',
      actions: [
        { label: '🖥 Ouvrir', fn: handleGroceryHTML, primary: false },
        { label: '⬇ PDF', fn: handleGroceryPDF, primary: true },
      ],
    },
    {
      key: 'visual',
      icon: '📅', color: 'bg-blue-50 border border-blue-200',
      title: 'Menu visuel',
      sub: 'Vue par journée, design épuré',
      desc: 'Carte élégante pour chaque journée. Idéal pour afficher au camp.',
      actions: [
        { label: '🖥 Ouvrir', fn: handleVisualMenu, primary: false },
        { label: '⬇ PDF', fn: handleVisualMenuPDF, primary: true },
      ],
    },
    {
      key: 'detailed',
      icon: '📋', color: 'bg-orange-50 border border-orange-200',
      title: 'Menu détaillé',
      sub: 'Avec ingrédients par repas',
      desc: `Ingrédients complets pour chaque repas, pour ${campSetup.numPeople} personnes.`,
      actions: [
        { label: '🖥 Ouvrir', fn: handleDetailedMenu, primary: false },
        { label: '⬇ PDF', fn: handleDetailedMenuPDF, primary: true },
      ],
    },
  ]

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-apple-gray">
      <button onClick={onBack} className="btn-ghost text-apple-secondary mb-4 no-print text-sm">
        ← Retour à la planification
      </button>

      <div className="max-w-4xl mx-auto space-y-5">
        {/* ── Summary card with hero image ──────── */}
        <div className="card overflow-hidden p-0">
          {heroImg && (
            <div className="relative h-40 overflow-hidden">
              <img src={heroImg} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end px-5 pb-4">
                <h2 className="text-xl font-extrabold text-white leading-tight">
                  {campSetup.campName || 'Menu de camp'}
                </h2>
                <p className="text-white/80 text-sm mt-0.5">Menu 246</p>
              </div>
            </div>
          )}
          <div className="p-4 flex items-center justify-between gap-4">
            <div className="flex flex-wrap gap-3 text-sm text-apple-secondary">
              <span>📅 {campSetup.numDays} jour{campSetup.numDays > 1 ? 's' : ''}</span>
              <span>👥 {campSetup.numPeople} participant{campSetup.numPeople > 1 ? 's' : ''}</span>
              <span>🍽️ {filledMeals}/{totalSlots} repas planifiés</span>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-2xl font-bold text-apple-blue">{totalItems}</div>
              <div className="text-xs text-apple-secondary">ingrédients</div>
            </div>
          </div>

          {!hasAnyMeal && (
            <div className="mx-4 mb-4 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-700">
              Aucun repas planifié. Retournez à la planification pour ajouter des recettes.
            </div>
          )}

          <div className="px-4 pb-4">
            <div className="flex items-center justify-between text-xs text-apple-secondary mb-1">
              <span>Complétion du menu</span>
              <span className="font-semibold">{Math.round((filledMeals / totalSlots) * 100)}%</span>
            </div>
            <div className="h-2 bg-apple-gray-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-apple-blue rounded-full transition-all duration-500"
                style={{ width: `${(filledMeals / totalSlots) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* ── Export cards ──────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {exportCards.map(item => (
            <div key={item.key} className={`card space-y-3 ${item.color}`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/70 flex items-center justify-center text-xl shadow-sm">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-apple-dark text-sm">{item.title}</h3>
                  <p className="text-xs text-apple-secondary">{item.sub}</p>
                </div>
                {generated[item.key] && <span className="text-green-500 text-sm flex-shrink-0">✓</span>}
              </div>
              <p className="text-xs text-apple-secondary leading-relaxed">{item.desc}</p>
              <div className="flex gap-2">
                {item.actions.map(action => (
                  <button
                    key={action.label}
                    onClick={action.fn}
                    disabled={!hasAnyMeal}
                    className={`flex-1 text-sm py-2 rounded-xl font-semibold transition-colors disabled:opacity-40 ${
                      action.primary
                        ? 'bg-apple-blue text-white hover:bg-blue-600'
                        : 'bg-white/70 text-apple-dark border border-apple-gray-2 hover:bg-white'
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── In-app grocery list with checkboxes ─ */}
        {hasAnyMeal && orderedSections.length > 0 && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-apple-dark">Liste d'épicerie</h3>
                <p className="text-xs text-apple-secondary mt-0.5">
                  {checkedCount}/{totalItems} article{totalItems > 1 ? 's' : ''} cochés
                </p>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
                  <circle cx="16" cy="16" r="12" fill="none" stroke="#E5E5EA" strokeWidth="3" />
                  <circle
                    cx="16" cy="16" r="12" fill="none" stroke="#007AFF" strokeWidth="3"
                    strokeDasharray={`${(checkedCount / Math.max(totalItems, 1)) * 75.4} 75.4`}
                    strokeLinecap="round"
                  />
                </svg>
                {checkedCount > 0 && (
                  <button onClick={resetChecked} className="btn-ghost text-xs text-apple-secondary">
                    Réinitialiser
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {orderedSections.map(section => (
                <div key={section}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-base">{SECTION_ICON[section] || '📦'}</span>
                    <h4 className="text-xs font-bold text-apple-dark uppercase tracking-wide">{section}</h4>
                    <span className="text-xs text-apple-secondary">({bySection[section].length})</span>
                  </div>
                  <div className="space-y-0.5 pl-1">
                    {bySection[section].map((item, i) => {
                      const key = `${item.ingredient}|||${item.unit}`
                      const isChecked = !!checked[key]
                      return (
                        <label
                          key={i}
                          className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all ${
                            isChecked ? 'bg-apple-gray-2/50 opacity-60' : 'hover:bg-apple-gray/60'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleChecked(key)}
                            className="w-4 h-4 rounded accent-apple-blue flex-shrink-0"
                          />
                          <span className={`flex-1 text-sm ${isChecked ? 'line-through text-apple-secondary' : 'text-apple-dark'}`}>
                            {item.ingredient}
                          </span>
                          <span className={`text-xs font-semibold whitespace-nowrap ${isChecked ? 'text-apple-secondary' : 'text-apple-dark'}`}>
                            {formatGroceryQty(item.totalAmount, item.unit)} <span className="font-normal text-apple-secondary">{formatGroceryUnit(item.totalAmount, item.unit)}</span>
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
