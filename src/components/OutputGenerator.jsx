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
  getPeopleForDay,
  hasPerDayOverrides,
} from '../utils/calculations'
import { MEAL_TYPES, MEALS, MEAL_LABELS } from '../shared/meals'
import { I } from '../shared/icons.jsx'

const MEAL_EMOJI = Object.fromEntries(MEAL_TYPES.map(k => [k, MEALS[k].emoji]))
const SECTION_ICON = {
  'Fruits et légumes': '🥦',
  'Produits céréaliers': '🌾',
  'Produits laitiers': '🥛',
  'Viandes': '🥩',
  'Varia': '🧂',
  'Varia - Congelés': '🧊',
}

// Ember palette for exported standalone HTML/PDF pages
const PDF = {
  ember: '#C2410C', emberDark: '#9A3412', bg: '#FAF6EF', surface: '#ffffff',
  text: '#2B2017', muted: '#8A7E70', hairline: '#EDE6DB', border: '#E2D8C9',
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
  try { localStorage.setItem(checkedKey(campSetup), JSON.stringify(checked)) } catch {}
}

// ── HTML escape helper (prevents XSS in generated pages) ─────
function escHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
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
    background: ${PDF.bg}; color: ${PDF.text}; padding: 24px 20px;
  }
  .container { max-width: 680px; margin: 0 auto; }
  .hero {
    position: relative; border-radius: 20px; overflow: hidden;
    margin-bottom: 24px; box-shadow: 0 4px 24px rgba(60,38,18,0.15);
  }
  .hero img { width: 100%; height: 200px; object-fit: cover; display: block; }
  .hero-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(160deg, rgba(40,20,8,0.05) 0%, rgba(40,20,8,0.7) 100%);
    display: flex; flex-direction: column; justify-content: flex-end; padding: 22px 26px;
  }
  .hero-title { font-size: 26px; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
  .hero-subtitle { font-size: 15px; color: rgba(255,255,255,0.85); margin-top: 3px; }
  .hero-chips { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
  .hero-chip {
    background: rgba(255,255,255,0.2); backdrop-filter: blur(4px);
    border: 1px solid rgba(255,255,255,0.3); border-radius: 20px;
    padding: 3px 11px; font-size: 12px; font-weight: 600; color: #fff;
  }
  .print-btn {
    position: fixed; bottom: 24px; right: 24px; z-index: 100;
    background: ${PDF.ember}; color: #fff; border: none; border-radius: 16px;
    padding: 12px 22px; font-size: 14px; font-weight: 700;
    box-shadow: 0 4px 16px rgba(194,65,12,0.4); cursor: pointer; font-family: inherit;
  }
  .print-btn:hover { background: ${PDF.emberDark}; }
  @media print {
    body { background: #fff; padding: 10px; }
    .print-btn { display: none !important; }
    .hero { box-shadow: none; border: 1px solid ${PDF.border}; }
    .hero img { height: 150px; }
  }`
}

function buildHeroHTML(campSetup, heroImg, subtitle) {
  const campName = campSetup.campName || 'Menu du camp'
  const n = campSetup.numPeople
  const variable = hasPerDayOverrides(campSetup.numPeople, campSetup.numPeopleByDay)
  const imgTag = heroImg
    ? `<img src="${heroImg}" alt="Menu 246" />`
    : `<div style="width:100%;height:200px;background:linear-gradient(135deg,${PDF.emberDark},${PDF.ember});"></div>`

  const fmtDate = d => {
    try { return parseLocalDate(d).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' }) }
    catch { return d }
  }
  const dateChip = campSetup.startDate && campSetup.endDate
    ? `<span class="hero-chip">📅 ${escHtml(fmtDate(campSetup.startDate))} – ${escHtml(fmtDate(campSetup.endDate))}</span>`
    : `<span class="hero-chip">📅 ${campSetup.numDays} jour${campSetup.numDays > 1 ? 's' : ''}</span>`

  return `
  <div class="hero">
    ${imgTag}
    <div class="hero-overlay">
      <div class="hero-title">Menu 246</div>
      <div class="hero-subtitle">${escHtml(campName)} — ${escHtml(subtitle)}</div>
      <div class="hero-chips">
        ${dateChip}
        <span class="hero-chip">👥 ${n} participant${n > 1 ? 's' : ''}${variable ? ' (variable)' : ''}</span>
      </div>
    </div>
  </div>`
}

// ── Visual menu HTML ──────────────────────────────────────────
function buildVisualMenuHTML(campSetup, mealPlan, heroImg) {
  const summary = buildMenuSummary(campSetup, mealPlan)
  const campName = campSetup.campName || 'Menu du camp'

  const dayCards = summary.map(({ dayLabel, meals }) => {
    const mealRows = MEAL_TYPES.map(mt => {
      const recipes = meals[mt] || []
      return `
        <div style="display:flex;align-items:flex-start;gap:14px;padding:9px 0;border-bottom:1px solid ${PDF.hairline};">
          <div style="display:flex;align-items:center;gap:8px;width:110px;flex-shrink:0;">
            <span style="font-size:15px;">${MEAL_EMOJI[mt]}</span>
            <span style="font-size:10px;font-weight:700;color:${PDF.muted};text-transform:uppercase;letter-spacing:0.06em;">${MEAL_LABELS[mt]}</span>
          </div>
          <div style="flex:1;min-width:0;">
            ${recipes.length > 0
              ? recipes.map(r => `<div style="font-size:13px;font-weight:600;color:${PDF.text};line-height:1.4;">${escHtml(r.name)}</div>`).join('')
              : `<span style="font-size:12px;color:${PDF.muted};font-style:italic;">Non planifié</span>`
            }
          </div>
        </div>`
    }).join('')

    return `
      <div style="background:${PDF.surface};border-radius:16px;padding:18px 22px;margin-bottom:14px;box-shadow:0 2px 10px rgba(60,38,18,0.06);page-break-inside:avoid;">
        <h2 style="font-size:15px;font-weight:700;color:${PDF.ember};margin-bottom:10px;text-transform:capitalize;padding-bottom:8px;border-bottom:2px solid ${PDF.hairline};">
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

  const dayBlocks = summary.map(({ dayIndex, dayLabel, meals }) => {
    const n = getPeopleForDay(campSetup.numPeople, campSetup.numPeopleByDay, dayIndex)
    const mealBlocks = MEAL_TYPES.map(mt => {
      const recipes = meals[mt] || []
      if (recipes.length === 0) return `
        <div style="padding:8px 0;border-bottom:1px solid ${PDF.hairline};display:flex;align-items:center;gap:12px;">
          <span style="font-size:14px;">${MEAL_EMOJI[mt]}</span>
          <div>
            <div style="font-size:10px;font-weight:700;color:${PDF.muted};text-transform:uppercase;">${MEAL_LABELS[mt]}</div>
            <div style="font-size:12px;color:${PDF.muted};font-style:italic;margin-top:2px;">Non planifié</div>
          </div>
        </div>`

      const recipeBlocks = recipes.map(recipe => {
        const ingrRows = recipe.ingredients.map(ingr => `
          <tr>
            <td style="padding:4px 8px 4px 0;font-size:11px;color:${PDF.text};">${escHtml(ingr.ingredient)}</td>
            <td style="padding:4px 8px;font-size:11px;color:${PDF.muted};text-align:right;white-space:nowrap;">${formatAmount(ingr.portion)} ${escHtml(ingr.unit)}</td>
            <td style="padding:4px 0 4px 8px;font-size:11px;font-weight:700;color:${PDF.ember};text-align:right;white-space:nowrap;">${formatAmount(ingr.portion * n)} ${escHtml(ingr.unit)}</td>
          </tr>`).join('')

        return `
          <div style="margin-bottom:10px;padding-left:26px;">
            <div style="font-size:13px;font-weight:700;color:${PDF.ember};margin-bottom:5px;">${escHtml(recipe.name)}</div>
            <table style="border-collapse:collapse;width:100%;">
              <thead>
                <tr style="border-bottom:1px solid ${PDF.border};">
                  <th style="text-align:left;padding:3px 8px 3px 0;font-size:9px;color:${PDF.muted};font-weight:700;text-transform:uppercase;">Ingrédient</th>
                  <th style="text-align:right;padding:3px 8px;font-size:9px;color:${PDF.muted};font-weight:700;text-transform:uppercase;">×1</th>
                  <th style="text-align:right;padding:3px 0 3px 8px;font-size:9px;color:${PDF.muted};font-weight:700;text-transform:uppercase;">×${n}</th>
                </tr>
              </thead>
              <tbody>${ingrRows}</tbody>
            </table>
          </div>`
      }).join('')

      return `
        <div style="margin-bottom:14px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <span style="font-size:16px;">${MEAL_EMOJI[mt]}</span>
            <span style="font-size:10px;font-weight:700;color:${PDF.muted};text-transform:uppercase;letter-spacing:0.06em;">${MEAL_LABELS[mt]}</span>
          </div>
          ${recipeBlocks}
        </div>`
    }).join('')

    return `
      <div style="background:${PDF.surface};border-radius:16px;padding:18px 22px;margin-bottom:14px;box-shadow:0 2px 10px rgba(60,38,18,0.06);page-break-inside:avoid;">
        <h2 style="font-size:15px;font-weight:700;color:${PDF.text};margin-bottom:14px;padding-bottom:10px;border-bottom:2px solid ${PDF.ember};text-transform:capitalize;">${escHtml(dayLabel)} <span style="font-size:11px;font-weight:600;color:${PDF.muted};">· ${n} pers.</span></h2>
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
  const { bySection } = buildGroceryList(mealPlan, campSetup.numPeople, campSetup.numPeopleByDay)
  const sections = getOrderedSections(bySection)
  const campName = campSetup.campName || 'Camp'

  const sectionBlocks = sections.map(section => {
    const rows = bySection[section].map((item, i) => `
      <tr style="${i % 2 === 1 ? `background:${PDF.bg};` : ''}">
        <td style="padding:10px 12px;font-size:13px;border-bottom:1px solid ${PDF.hairline};">
          <label style="display:flex;align-items:center;gap:10px;cursor:pointer;">
            <input type="checkbox" style="width:16px;height:16px;accent-color:${PDF.ember};flex-shrink:0;">
            <span class="item-name">${escHtml(item.ingredient)}</span>
          </label>
        </td>
        <td style="padding:10px 12px;font-size:13px;font-weight:700;text-align:right;border-bottom:1px solid ${PDF.hairline};color:${PDF.ember};white-space:nowrap;">${formatGroceryQty(item.totalAmount, item.unit)}</td>
        <td style="padding:10px 12px;font-size:13px;color:${PDF.muted};border-bottom:1px solid ${PDF.hairline};white-space:nowrap;">${formatGroceryUnit(item.totalAmount, item.unit)}</td>
      </tr>`).join('')

    return `
      <div style="margin-bottom:20px;border-radius:14px;overflow:hidden;box-shadow:0 2px 10px rgba(60,38,18,0.06);">
        <div style="background:linear-gradient(135deg,${PDF.ember},${PDF.emberDark});color:white;padding:10px 16px;font-weight:700;font-size:13px;display:flex;align-items:center;gap:8px;">
          <span style="font-size:16px;">${SECTION_ICON[section] || '📦'}</span>
          <span>${section}</span>
          <span style="margin-left:auto;background:rgba(255,255,255,0.2);border-radius:10px;padding:2px 9px;font-size:11px;">${bySection[section].length} article${bySection[section].length > 1 ? 's' : ''}</span>
        </div>
        <table style="border-collapse:collapse;width:100%;background:white;">
          <thead>
            <tr style="background:${PDF.bg};">
              <th style="text-align:left;padding:8px 12px;font-size:10px;color:${PDF.muted};font-weight:700;text-transform:uppercase;letter-spacing:0.05em;border-bottom:1px solid ${PDF.border};">Ingrédient</th>
              <th style="text-align:right;padding:8px 12px;font-size:10px;color:${PDF.muted};font-weight:700;text-transform:uppercase;border-bottom:1px solid ${PDF.border};width:15%;">Quantité</th>
              <th style="padding:8px 12px;font-size:10px;color:${PDF.muted};font-weight:700;text-transform:uppercase;border-bottom:1px solid ${PDF.border};width:20%;">Unité</th>
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
.item-name.checked { text-decoration:line-through; color:${PDF.muted}; }
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

  const [checked, setChecked] = useState(() => loadChecked(campSetup))
  function toggleChecked(key) {
    setChecked(prev => {
      const next = { ...prev, [key]: !prev[key] }
      saveChecked(campSetup, next)
      return next
    })
  }
  function resetChecked() { setChecked({}); saveChecked(campSetup, {}) }

  const filledMeals = Object.values(mealPlan).reduce(
    (total, day) => total + Object.values(day).filter(slot => Array.isArray(slot) ? slot.length > 0 : Boolean(slot)).length, 0)
  const totalSlots = campSetup.numDays * MEAL_TYPES.length
  const hasAnyMeal = filledMeals > 0
  const variablePeople = hasPerDayOverrides(campSetup.numPeople, campSetup.numPeopleByDay)

  const { bySection } = useMemo(
    () => filledMeals > 0 ? buildGroceryList(mealPlan, campSetup.numPeople, campSetup.numPeopleByDay) : { bySection: {} },
    [mealPlan, campSetup.numPeople, campSetup.numPeopleByDay, filledMeals]
  )
  const orderedSections = getOrderedSections(bySection)
  const totalItems = orderedSections.reduce((s, sec) => s + (bySection[sec]?.length || 0), 0)
  const checkedCount = Math.min(Object.values(checked).filter(Boolean).length, totalItems)

  const slug = (campSetup.campName || 'camp').replace(/\s+/g, '-')

  function handleDownloadCSV() {
    downloadBlob(generateCSV(campSetup, mealPlan), `${slug}-epicerie.csv`, 'text/csv;charset=utf-8')
    setGenerated(p => ({ ...p, csv: true }))
  }

  async function handleShareGrocery() {
    const { bySection } = buildGroceryList(mealPlan, campSetup.numPeople, campSetup.numPeopleByDay)
    const sections = getOrderedSections(bySection)
    const lines = []
    const campLabel = campSetup.campName || 'Camp scout'
    lines.push(`🏕 Liste d'épicerie — ${campLabel}`)
    lines.push(`📅 ${campSetup.numDays} jours · 👥 ${campSetup.numPeople} personnes${variablePeople ? ' (variable)' : ''}`)
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
      try { await navigator.share({ title: `Épicerie — ${campLabel}`, text }); setGenerated(p => ({ ...p, share: true })); return } catch {}
    }
    try {
      await navigator.clipboard.writeText(text)
      setGenerated(p => ({ ...p, share: true }))
      alert('Liste copiée! Collez-la dans vos Notes.')
    } catch { alert('Partagez via le bouton CSV.') }
  }
  function handleGroceryHTML() { openHTMLInNewTab(buildGroceryHTML(campSetup, mealPlan, heroImg)); setGenerated(p => ({ ...p, groceryPrint: true })) }
  function handleGroceryPDF() { openHTMLInNewTab(buildGroceryHTML(campSetup, mealPlan, heroImg), true); setGenerated(p => ({ ...p, groceryPrint: true })) }
  function handleVisualMenu() { openHTMLInNewTab(buildVisualMenuHTML(campSetup, mealPlan, heroImg)); setGenerated(p => ({ ...p, visual: true })) }
  function handleVisualMenuPDF() { openHTMLInNewTab(buildVisualMenuHTML(campSetup, mealPlan, heroImg), true); setGenerated(p => ({ ...p, visual: true })) }
  function handleDetailedMenu() { openHTMLInNewTab(buildDetailedMenuHTML(campSetup, mealPlan, heroImg)); setGenerated(p => ({ ...p, detailed: true })) }
  function handleDetailedMenuPDF() { openHTMLInNewTab(buildDetailedMenuHTML(campSetup, mealPlan, heroImg), true); setGenerated(p => ({ ...p, detailed: true })) }

  const exportCards = [
    { key: 'csv', emoji: '📊', title: "Liste d'épicerie", sub: 'CSV pour Excel ou Google Sheets',
      desc: `Quantités totales pour ${campSetup.numPeople} personnes${variablePeople ? ' (variable par jour)' : ''}, groupées par section avec sous-totaux.`,
      actions: [{ label: 'CSV', icon: I.Download, fn: handleDownloadCSV, primary: true }, { label: 'Partager', icon: I.Message, fn: handleShareGrocery, primary: false }] },
    { key: 'groceryPrint', emoji: '🛒', title: "Liste d'épicerie imprimable", sub: 'Cases à cocher interactives',
      desc: 'Cochez les articles au fur et à mesure de vos achats. Fonctionne hors-ligne.',
      actions: [{ label: 'Ouvrir', icon: I.Doc, fn: handleGroceryHTML, primary: false }, { label: 'PDF', icon: I.Download, fn: handleGroceryPDF, primary: true }] },
    { key: 'visual', emoji: '📅', title: 'Menu visuel', sub: 'Vue par journée, design épuré',
      desc: 'Carte élégante pour chaque journée. Idéal pour afficher au camp.',
      actions: [{ label: 'Ouvrir', icon: I.Doc, fn: handleVisualMenu, primary: false }, { label: 'PDF', icon: I.Download, fn: handleVisualMenuPDF, primary: true }] },
    { key: 'detailed', emoji: '📋', title: 'Menu détaillé', sub: 'Avec ingrédients par repas',
      desc: `Ingrédients complets pour chaque repas${variablePeople ? ', ajustés par jour' : `, pour ${campSetup.numPeople} personnes`}.`,
      actions: [{ label: 'Ouvrir', icon: I.Doc, fn: handleDetailedMenu, primary: false }, { label: 'PDF', icon: I.Download, fn: handleDetailedMenuPDF, primary: true }] },
  ]

  const pct = totalSlots > 0 ? Math.round((filledMeals / totalSlots) * 100) : 0

  return (
    <div className="app scroll" style={{ flex: 1, overflowY: 'auto', background: 'var(--bg)', padding: '20px 16px 40px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <button onClick={onBack} className="btn-ghost no-print" style={{ alignSelf: 'flex-start', gap: 6, padding: '6px 10px', borderRadius: 'var(--r-sm)' }}>
          <I.ChevL size={16} /> Retour à la planification
        </button>

        {/* Summary card */}
        <div className="card" style={{ overflow: 'hidden' }}>
          {heroImg && (
            <div style={{ position: 'relative', height: 160, overflow: 'hidden' }}>
              <img src={heroImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(40,20,8,0.65), transparent)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 20px 16px' }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', lineHeight: 1.15, letterSpacing: '-0.01em' }}>{campSetup.campName || 'Menu de camp'}</h2>
                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 2 }}>Menu 246</p>
              </div>
            </div>
          )}
          <div style={{ padding: 'var(--space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }} className="t-sub tx-2">
              <span>📅 {campSetup.numDays} jour{campSetup.numDays > 1 ? 's' : ''}</span>
              <span>👥 {campSetup.numPeople} participant{campSetup.numPeople > 1 ? 's' : ''}{variablePeople ? '*' : ''}</span>
              <span>🍽️ {filledMeals}/{totalSlots} repas planifiés</span>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--primary)', fontVariantNumeric: 'tabular-nums' }}>{totalItems}</div>
              <div className="t-caption tx-3">ingrédients</div>
            </div>
          </div>

          {variablePeople && (
            <div className="t-caption tx-3" style={{ padding: '0 var(--space-4) var(--space-2)' }}>* Participants variables selon le jour</div>
          )}

          {!hasAnyMeal && (
            <div className="chip chip-error" style={{ margin: '0 var(--space-4) var(--space-4)', height: 'auto', padding: '10px 14px', borderRadius: 'var(--r-md)', display: 'flex' }}>
              Aucun repas planifié. Retournez à la planification pour ajouter des recettes.
            </div>
          )}

          <div style={{ padding: '0 var(--space-4) var(--space-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }} className="t-caption tx-3">
              <span>Complétion du menu</span>
              <span style={{ fontWeight: 600 }}>{pct}%</span>
            </div>
            <div style={{ height: 8, background: 'var(--surface-2)', borderRadius: 'var(--r-pill)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: 'var(--primary)', borderRadius: 'var(--r-pill)', transition: 'width 0.5s' }} />
            </div>
          </div>
        </div>

        {/* Export cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 'var(--space-4)' }}>
          {exportCards.map(item => (
            <div key={item.key} className="card" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div style={{ width: 40, height: 40, borderRadius: 'var(--r-md)', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{item.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontWeight: 600, color: 'var(--text)', fontSize: 15 }}>{item.title}</h3>
                  <p className="t-caption tx-3">{item.sub}</p>
                </div>
                {generated[item.key] && <I.Check size={18} sw={2.4} stroke="var(--success)" />}
              </div>
              <p className="t-sub tx-2" style={{ lineHeight: 1.5 }}>{item.desc}</p>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                {item.actions.map(action => {
                  const A = action.icon
                  return (
                    <button key={action.label} onClick={action.fn} disabled={!hasAnyMeal}
                      className={`btn ${action.primary ? 'btn-primary' : 'btn-secondary'}`} style={{ flex: 1, height: 40 }}>
                      <A size={16} /> {action.label}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* In-app grocery checklist */}
        {hasAnyMeal && orderedSections.length > 0 && (
          <div className="card" style={{ padding: 'var(--space-5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
              <div>
                <h3 style={{ fontWeight: 600, color: 'var(--text)', fontSize: 17 }}>Liste d'épicerie</h3>
                <p className="t-caption tx-3" style={{ marginTop: 2 }}>{checkedCount}/{totalItems} article{totalItems > 1 ? 's' : ''} cochés</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <svg style={{ width: 32, height: 32, transform: 'rotate(-90deg)' }} viewBox="0 0 32 32">
                  <circle cx="16" cy="16" r="12" fill="none" stroke="var(--surface-2)" strokeWidth="3" />
                  <circle cx="16" cy="16" r="12" fill="none" stroke="var(--primary)" strokeWidth="3"
                    strokeDasharray={`${(checkedCount / Math.max(totalItems, 1)) * 75.4} 75.4`} strokeLinecap="round" />
                </svg>
                {checkedCount > 0 && <button onClick={resetChecked} className="btn-ghost" style={{ fontSize: 'var(--fs-caption)' }}>Réinitialiser</button>}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {orderedSections.map(section => (
                <div key={section}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 6 }}>
                    <span style={{ fontSize: 16 }}>{SECTION_ICON[section] || '📦'}</span>
                    <h4 className="t-micro" style={{ color: 'var(--text)' }}>{section}</h4>
                    <span className="t-caption tx-3">({bySection[section].length})</span>
                  </div>
                  <div>
                    {bySection[section].map((item, i) => {
                      const key = `${item.ingredient}|||${item.unit}`
                      const isChecked = !!checked[key]
                      return (
                        <div key={i} onClick={() => toggleChecked(key)}
                          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 10px', borderRadius: 'var(--r-md)', cursor: 'pointer', opacity: isChecked ? 0.55 : 1 }}>
                          <span className={`check${isChecked ? ' is-checked' : ''}`} style={{ width: 20, height: 20 }}>
                            {isChecked && <I.Check size={12} sw={2.6} stroke="currentColor" />}
                          </span>
                          <span style={{ flex: 1, fontSize: 14, color: isChecked ? 'var(--text-tertiary)' : 'var(--text)', textDecoration: isChecked ? 'line-through' : 'none' }}>{item.ingredient}</span>
                          <span style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', color: isChecked ? 'var(--text-tertiary)' : 'var(--text)' }}>
                            {formatGroceryQty(item.totalAmount, item.unit)} <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>{formatGroceryUnit(item.totalAmount, item.unit)}</span>
                          </span>
                        </div>
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
