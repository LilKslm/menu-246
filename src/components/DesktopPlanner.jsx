import { useState, useRef, useMemo, memo, useCallback } from 'react'
import RecipeQuickAddModal from './RecipeQuickAddModal'
import AddRecipeModal from './AddRecipeModal'
import Signature from './Signature'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']
const MEAL_LABELS = {
  breakfast: 'Déjeuner',
  lunch: 'Dîner',
  dinner: 'Souper',
  snack: 'Collation',
}
const MEAL_ICONS = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
}
const MEAL_COLORS = {
  breakfast: { accent: '#EA580C', pill: '#FED7AA', pillBg: '#FFF7ED', text: '#9A3412', border: '#FDBA74' },
  lunch:     { accent: '#16A34A', pill: '#BBF7D0', pillBg: '#F0FDF4', text: '#14532D', border: '#86EFAC' },
  dinner:    { accent: '#2563EB', pill: '#BFDBFE', pillBg: '#EFF6FF', text: '#1E3A8A', border: '#93C5FD' },
  snack:     { accent: '#9333EA', pill: '#E9D5FF', pillBg: '#FAF5FF', text: '#581C87', border: '#C4B5FD' },
}

function getDayLabel(startDate, dayIndex) {
  const date = new Date(startDate)
  date.setDate(date.getDate() + dayIndex)
  return {
    weekday: date.toLocaleDateString('fr-CA', { weekday: 'short' }),
    day: date.getDate(),
    month: date.toLocaleDateString('fr-CA', { month: 'short' }),
    full: date.toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' }),
    isWeekend: [0, 6].includes(date.getDay()),
  }
}

// ── Grid cell ────────────────────────────────────────────────
const GridCell = memo(function GridCell({
  dayIndex, mealType, recipes, pendingRecipe, onCellClick, onRemove, onOpenModal,
}) {
  const mc = MEAL_COLORS[mealType]
  const canDrop = pendingRecipe?.mealType === mealType
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={() => canDrop && onCellClick(dayIndex, mealType)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        minHeight: 108,
        padding: '8px',
        borderRight: '1px solid #F3F4F6',
        borderBottom: '1px solid #F3F4F6',
        background: canDrop
          ? `${mc.pillBg}`
          : hovered ? '#FAFAFA' : '#fff',
        cursor: canDrop ? 'pointer' : 'default',
        transition: 'background 0.12s',
        position: 'relative',
        outline: canDrop ? `2px dashed ${mc.border}` : 'none',
        outlineOffset: '-2px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      {/* Recipe pills */}
      {recipes.map(recipe => (
        <RecipePill
          key={recipe.id}
          recipe={recipe}
          mealType={mealType}
          onRemove={() => onRemove(dayIndex, mealType, recipe.id)}
        />
      ))}

      {/* Add button */}
      {canDrop ? (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '4px 8px', borderRadius: 6,
          border: `1.5px dashed ${mc.border}`,
          color: mc.accent, fontSize: 11, fontWeight: 600, gap: 3,
          marginTop: recipes.length > 0 ? 2 : 0,
        }}>
          <span style={{ fontSize: 14 }}>+</span> Placer ici
        </div>
      ) : (
        <button
          onClick={e => { e.stopPropagation(); onOpenModal(dayIndex, mealType) }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
            padding: '4px 8px', borderRadius: 6, border: 'none',
            background: 'transparent', cursor: 'pointer',
            color: '#D1D5DB', fontSize: 11, fontWeight: 600,
            opacity: hovered || recipes.length === 0 ? 1 : 0,
            transition: 'opacity 0.15s, color 0.15s, background 0.15s',
            width: '100%',
            marginTop: recipes.length > 0 ? 2 : 0,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = mc.accent
            e.currentTarget.style.background = mc.pillBg
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = '#D1D5DB'
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <span style={{ fontSize: 14, lineHeight: 1 }}>+</span>
          {recipes.length === 0 ? 'Ajouter' : 'Ajouter un repas'}
        </button>
      )}
    </div>
  )
})

// ── Ingredient tooltip (fixed-position to escape overflow clipping) ──
function IngredientTooltip({ recipe, anchorRect, mealType }) {
  const mc = MEAL_COLORS[mealType]
  const W = 280
  const OFFSET = 8

  const placeAbove = anchorRect.top > 240
  const top = placeAbove ? undefined : anchorRect.bottom + OFFSET
  const bottom = placeAbove ? window.innerHeight - anchorRect.top + OFFSET : undefined
  let left = anchorRect.left
  if (left + W > window.innerWidth - 8) left = window.innerWidth - W - 8

  return (
    <div style={{
      position: 'fixed', top, bottom, left,
      width: W, zIndex: 9999,
      background: '#fff',
      borderRadius: 12,
      boxShadow: '0 8px 30px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)',
      border: '1px solid #F3F4F6',
      padding: '12px 14px',
      animation: 'fadeIn 0.15s ease',
      pointerEvents: 'none',
    }}>
      <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#111827' }}>
        {recipe.name}
      </p>
      {recipe.ingredients?.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 200, overflowY: 'auto' }}>
          {recipe.ingredients.map((ingr, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, fontSize: 11, color: '#374151', lineHeight: 1.4 }}>
              <span style={{ color: mc.accent, flexShrink: 0 }}>•</span>
              <span>
                {ingr.portion > 0 ? `${ingr.portion}${ingr.unit ? ' ' + ingr.unit : ''} ` : ''}{ingr.ingredient}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF' }}>Aucun ingrédient</p>
      )}
    </div>
  )
}

// ── Recipe pill ──────────────────────────────────────────────
const RecipePill = memo(function RecipePill({ recipe, mealType, onRemove }) {
  const mc = MEAL_COLORS[mealType]
  const [hovered, setHovered] = useState(false)
  const [anchorRect, setAnchorRect] = useState(null)
  const pillRef = useRef(null)

  const handleMouseEnter = useCallback(() => {
    setHovered(true)
    if (pillRef.current) setAnchorRect(pillRef.current.getBoundingClientRect())
  }, [])
  const handleMouseLeave = useCallback(() => {
    setHovered(false)
    setAnchorRect(null)
  }, [])

  return (
    <div
      ref={pillRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '4px 6px 4px 8px',
        borderRadius: 6,
        background: hovered ? mc.pill : mc.pillBg,
        border: `1px solid ${mc.border}`,
        transition: 'background 0.12s',
        minWidth: 0,
      }}
    >
      <span style={{
        flex: 1, fontSize: 11, fontWeight: 600, color: mc.text,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        lineHeight: 1.4,
      }}>
        {recipe.name}
      </span>
      <button
        onClick={e => { e.stopPropagation(); onRemove() }}
        style={{
          width: 14, height: 14, borderRadius: 7, border: 'none',
          background: hovered ? 'rgba(255,255,255,0.8)' : 'transparent',
          color: hovered ? '#EF4444' : mc.text,
          fontSize: 9, cursor: 'pointer', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: hovered ? 1 : 0.5,
          transition: 'all 0.12s',
          padding: 0,
        }}
      >✕</button>

      {anchorRect && <IngredientTooltip recipe={recipe} anchorRect={anchorRect} mealType={mealType} />}
    </div>
  )
})

// ── Recipe carousel card ─────────────────────────────────────
const CarouselCard = memo(function CarouselCard({ recipe, isPending, onClick, onDelete }) {
  const mc = MEAL_COLORS[recipe.mealType] || MEAL_COLORS.snack
  const [hovered, setHovered] = useState(false)
  const [anchorRect, setAnchorRect] = useState(null)
  const cardRef = useRef(null)

  const handleMouseEnter = useCallback(() => {
    setHovered(true)
    if (cardRef.current) setAnchorRect(cardRef.current.getBoundingClientRect())
  }, [])
  const handleMouseLeave = useCallback(() => {
    setHovered(false)
    setAnchorRect(null)
  }, [])

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ position: 'relative', flexShrink: 0 }}
    >
      <button
        onClick={onClick}
        style={{
          width: 130,
          padding: '12px 10px',
          borderRadius: 12,
          border: `1.5px solid ${isPending ? mc.accent : hovered ? mc.border : '#F3F4F6'}`,
          background: isPending ? mc.pillBg : hovered ? '#FAFAFA' : '#fff',
          cursor: 'pointer',
          textAlign: 'left',
          boxShadow: hovered || isPending ? '0 4px 12px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.04)',
          transition: 'all 0.15s',
          display: 'flex', flexDirection: 'column', gap: 6,
        }}
      >
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: mc.pillBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16,
        }}>
          {MEAL_ICONS[recipe.mealType]}
        </div>

        <p style={{
          fontSize: 12, fontWeight: 700, color: '#1C1C1E',
          margin: 0, lineHeight: 1.3,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {recipe.name}
        </p>

        <p style={{ fontSize: 11, color: mc.accent, margin: 0, fontWeight: 600 }}>
          {MEAL_LABELS[recipe.mealType]}
        </p>

        <p style={{ fontSize: 10, color: '#9CA3AF', margin: 0 }}>
          {recipe.ingredients?.length || 0} ingr.
        </p>
      </button>

      {/* Delete button — visible on hover */}
      {onDelete && hovered && (
        <button
          onClick={e => {
            e.stopPropagation()
            if (!confirm(`Masquer "${recipe.name}" de votre bibliothèque?`)) return
            onDelete(recipe)
          }}
          style={{
            position: 'absolute', top: 6, right: 6,
            width: 20, height: 20, borderRadius: 10, border: 'none',
            background: 'rgba(255,255,255,0.9)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
            color: '#EF4444', fontSize: 10, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          title="Masquer de ma bibliothèque"
        >🗑</button>
      )}

      {/* Ingredient tooltip on hover */}
      {anchorRect && (
        <IngredientTooltip recipe={recipe} anchorRect={anchorRect} mealType={recipe.mealType} />
      )}
    </div>
  )
})

// ── Main DesktopPlanner ──────────────────────────────────────
export default function DesktopPlanner({
  recipes,
  campSetup,
  mealPlan,
  onPlaceRecipe,
  onRemoveRecipe,
  onAddRecipe,
  onDeleteLocal,
  onBack,
  onNext,
}) {
  const [addModalSlot, setAddModalSlot] = useState(null)
  const [newRecipeModalOpen, setNewRecipeModalOpen] = useState(false)
  const [newRecipeMealType, setNewRecipeMealType] = useState('breakfast')
  const [pendingRecipe, setPendingRecipe] = useState(null)
  const [carouselSearch, setCarouselSearch] = useState('')
  const [carouselFilter, setCarouselFilter] = useState('all')
  const carouselRef = useRef(null)

  const { numDays, startDate, campName, numPeople, startDate: sd, endDate: ed } = campSetup
  const days = Array.from({ length: numDays }, (_, i) => i)

  // Progress
  const filledCount = Object.values(mealPlan).reduce(
    (t, day) => t + Object.values(day).filter(arr => Array.isArray(arr) ? arr.length > 0 : Boolean(arr)).length, 0
  )
  const totalSlots = numDays * 4

  // Carousel recipes
  const carouselRecipes = useMemo(() => {
    const term = carouselSearch.toLowerCase().trim()
    const types = carouselFilter === 'all' ? MEAL_TYPES : [carouselFilter]
    const result = []
    for (const mt of types) {
      for (const r of (recipes[mt] || [])) {
        if (!term) { result.push(r); continue }
        if (r.name.toLowerCase().includes(term) ||
            r.ingredients?.some(i => i.ingredient?.toLowerCase().includes(term))) {
          result.push(r)
        }
      }
    }
    return result
  }, [recipes, carouselSearch, carouselFilter])

  function handleCellClick(dayIndex, mealType) {
    if (pendingRecipe?.mealType === mealType) {
      onPlaceRecipe(dayIndex, mealType, pendingRecipe)
      setPendingRecipe(null)
    }
  }

  function handleOpenModal(dayIndex, mealType) {
    setAddModalSlot({ dayIndex, mealType })
  }

  function handleModalAdd(recipe) {
    if (!addModalSlot) return
    onPlaceRecipe(addModalSlot.dayIndex, addModalSlot.mealType, recipe)
    // keep modal open for multi-add
  }

  function handleCarouselCardClick(recipe) {
    if (pendingRecipe?.id === recipe.id) {
      setPendingRecipe(null)
    } else {
      setPendingRecipe(recipe)
    }
  }

  function scrollCarousel(dir) {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: dir * 280, behavior: 'smooth' })
    }
  }

  // Format date range
  function formatDateRange() {
    if (!sd || !ed) return ''
    const opts = { day: 'numeric', month: 'short' }
    const s = new Date(sd).toLocaleDateString('fr-CA', opts)
    const e = new Date(ed).toLocaleDateString('fr-CA', opts)
    return `${s} – ${e}`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden', background: '#F9FAFB' }}>

      {/* ── HEADER ─────────────────────────────────────────── */}
      <header style={{
        height: 100, flexShrink: 0,
        background: '#fff',
        borderBottom: '1px solid #E5E7EB',
        display: 'grid',
        gridTemplateColumns: '20% 60% 20%',
        alignItems: 'center',
        padding: '0 24px',
        zIndex: 10,
      }}>
        {/* LEFT — back button */}
        <div>
          <button
            onClick={onBack}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 8, border: 'none',
              background: '#F3F4F6', color: '#374151',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#E5E7EB'}
            onMouseLeave={e => e.currentTarget.style.background = '#F3F4F6'}
          >
            ← Retour
          </button>
        </div>

        {/* CENTER — camp info */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>
            {formatDateRange() || campName || '—'}
          </div>
          <div style={{ fontSize: 16, color: '#6B7280', fontWeight: 400, marginTop: 2 }}>
            {numPeople} personne{numPeople !== 1 ? 's' : ''}
          </div>
          <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 1 }}>
            Planification des repas
          </div>
        </div>

        {/* RIGHT — progress + export */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 60, height: 4, borderRadius: 2, background: '#E5E7EB', overflow: 'hidden' }}>
              <div style={{
                width: `${totalSlots > 0 ? (filledCount / totalSlots) * 100 : 0}%`,
                height: '100%', background: '#2563EB', borderRadius: 2,
                transition: 'width 0.3s',
              }} />
            </div>
            <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>{filledCount}/{totalSlots}</span>
          </div>

          <button
            onClick={onNext}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 8, border: 'none',
              background: '#2563EB', color: '#fff',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#1D4ED8'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,99,235,0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#2563EB'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(37,99,235,0.3)' }}
          >
            Exporter →
          </button>
        </div>
      </header>

      {/* Pending recipe banner */}
      {pendingRecipe && (
        <div style={{
          flexShrink: 0, padding: '8px 24px',
          background: '#EFF6FF', borderBottom: '1px solid #BFDBFE',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 16 }}>📌</span>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1E40AF' }}>{pendingRecipe.name}</span>
            <span style={{ fontSize: 13, color: '#3B82F6', marginLeft: 8 }}>
              Cliquez sur une cellule {MEAL_LABELS[pendingRecipe.mealType]?.toLowerCase()} pour placer
            </span>
          </div>
          <button
            onClick={() => setPendingRecipe(null)}
            style={{
              padding: '4px 12px', borderRadius: 6, border: '1px solid #BFDBFE',
              background: '#fff', color: '#2563EB', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >Annuler</button>
        </div>
      )}

      {/* ── CALENDAR GRID ──────────────────────────────────── */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', position: 'relative' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `80px repeat(${numDays}, minmax(140px, 1fr))`,
          minWidth: `${80 + numDays * 140}px`,
        }}>

          {/* ── Corner cell ── */}
          <div style={{
            position: 'sticky', top: 0, left: 0, zIndex: 4,
            background: '#fff', borderRight: '1px solid #E5E7EB',
            borderBottom: '1px solid #E5E7EB',
            padding: '8px',
          }} />

          {/* ── Day header cells ── */}
          {days.map(i => {
            const lbl = getDayLabel(startDate, i)
            return (
              <div
                key={i}
                style={{
                  position: 'sticky', top: 0, zIndex: 3,
                  background: lbl.isWeekend ? '#F8FAFF' : '#fff',
                  borderRight: '1px solid #E5E7EB',
                  borderBottom: '2px solid #E5E7EB',
                  padding: '10px 8px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {lbl.weekday}
                </div>
                <div style={{
                  fontSize: 22, fontWeight: 800,
                  color: lbl.isWeekend ? '#2563EB' : '#111827',
                  lineHeight: 1.2,
                }}>
                  {lbl.day}
                </div>
                <div style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'capitalize' }}>
                  {lbl.month}
                </div>
              </div>
            )
          })}

          {/* ── Meal rows ── */}
          {MEAL_TYPES.map(mealType => {
            const mc = MEAL_COLORS[mealType]
            return [
              // Sticky row label cell
              <div
                key={`label-${mealType}`}
                style={{
                  position: 'sticky', left: 0, zIndex: 2,
                  background: mc.pillBg,
                  borderRight: '2px solid ' + mc.border,
                  borderBottom: '1px solid #F3F4F6',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  padding: '8px 4px', gap: 4,
                  minHeight: 108,
                }}
              >
                <span style={{ fontSize: 18 }}>{MEAL_ICONS[mealType]}</span>
                <span style={{
                  fontSize: 9, fontWeight: 800, color: mc.text,
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  textAlign: 'center', lineHeight: 1.3,
                  writingMode: 'horizontal-tb',
                }}>
                  {MEAL_LABELS[mealType]}
                </span>
              </div>,

              // Day cells for this meal type
              ...days.map(dayIdx => (
                <GridCell
                  key={`${mealType}-${dayIdx}`}
                  dayIndex={dayIdx}
                  mealType={mealType}
                  recipes={mealPlan[dayIdx]?.[mealType] ?? []}
                  pendingRecipe={pendingRecipe}
                  onCellClick={handleCellClick}
                  onRemove={onRemoveRecipe}
                  onOpenModal={handleOpenModal}
                />
              )),
            ]
          })}
        </div>
      </div>

      {/* ── RECIPE CAROUSEL ────────────────────────────────── */}
      <div style={{
        flexShrink: 0,
        background: '#fff',
        borderTop: '1px solid #E5E7EB',
        padding: '10px 24px 12px',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Carousel toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#F3F4F6', borderRadius: 8,
            padding: '7px 10px', flex: '0 0 220px',
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, opacity: 0.4 }}>
              <circle cx="11" cy="11" r="7" stroke="#111" strokeWidth="2.5"/>
              <path d="M20 20l-3-3" stroke="#111" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Rechercher…"
              value={carouselSearch}
              onChange={e => setCarouselSearch(e.target.value)}
              style={{
                border: 'none', background: 'none', outline: 'none',
                fontSize: 12, color: '#374151', flex: 1, minWidth: 0,
              }}
            />
          </div>

          {/* Filter chips */}
          <div style={{ display: 'flex', gap: 6 }}>
            {[{ id: 'all', label: 'Tous' }, ...MEAL_TYPES.map(mt => ({ id: mt, label: MEAL_LABELS[mt] }))].map(f => {
              const active = carouselFilter === f.id
              const color = f.id !== 'all' ? MEAL_COLORS[f.id]?.accent : '#2563EB'
              return (
                <button
                  key={f.id}
                  onClick={() => setCarouselFilter(f.id)}
                  style={{
                    padding: '5px 10px', borderRadius: 6, border: 'none',
                    fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    background: active ? color : '#F3F4F6',
                    color: active ? '#fff' : '#6B7280',
                    transition: 'all 0.15s',
                  }}
                >{f.label}</button>
              )
            })}
          </div>

          {/* New recipe button */}
          {onAddRecipe && (
            <button
              onClick={() => {
                setNewRecipeMealType(carouselFilter !== 'all' ? carouselFilter : 'breakfast')
                setNewRecipeModalOpen(true)
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 8, border: 'none',
                background: '#F0FDF4', color: '#16A34A',
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#DCFCE7'}
              onMouseLeave={e => e.currentTarget.style.background = '#F0FDF4'}
            >
              + Nouvelle recette
            </button>
          )}

          {/* Scroll arrows */}
          <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
            {[{ dir: -1, label: '←' }, { dir: 1, label: '→' }].map(({ dir, label }) => (
              <button
                key={dir}
                onClick={() => scrollCarousel(dir)}
                style={{
                  width: 28, height: 28, borderRadius: 6, border: '1px solid #E5E7EB',
                  background: '#fff', color: '#374151', fontSize: 14,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.borderColor = '#D1D5DB' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#E5E7EB' }}
              >{label}</button>
            ))}
          </div>
        </div>

        {/* Carousel track */}
        <div
          ref={carouselRef}
          style={{
            display: 'flex', gap: 8, overflowX: 'auto',
            scrollbarWidth: 'none', msOverflowStyle: 'none',
            paddingBottom: 4,
          }}
        >
          {carouselRecipes.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: 80, color: '#9CA3AF', fontSize: 13 }}>
              Aucune recette trouvée
            </div>
          ) : (
            carouselRecipes.map(recipe => (
              <CarouselCard
                key={recipe.id}
                recipe={recipe}
                isPending={pendingRecipe?.id === recipe.id}
                onClick={() => handleCarouselCardClick(recipe)}
                onDelete={onDeleteLocal}
              />
            ))
          )}
        </div>
        <Signature />
      </div>

      {/* ── QUICK ADD MODAL ─────────────────────────────────── */}
      {addModalSlot && (
        <RecipeQuickAddModal
          recipes={recipes}
          slot={{
            ...addModalSlot,
            dayLabel: getDayLabel(startDate, addModalSlot.dayIndex).full,
          }}
          existingRecipes={mealPlan[addModalSlot.dayIndex]?.[addModalSlot.mealType] ?? []}
          onAdd={handleModalAdd}
          onClose={() => setAddModalSlot(null)}
          onDeleteLocal={onDeleteLocal}
        />
      )}

      {/* ── NEW RECIPE MODAL ────────────────────────────────── */}
      {newRecipeModalOpen && onAddRecipe && (
        <AddRecipeModal
          defaultMealType={newRecipeMealType}
          onSave={recipe => {
            onAddRecipe(recipe)
            setNewRecipeModalOpen(false)
          }}
          onClose={() => setNewRecipeModalOpen(false)}
        />
      )}
    </div>
  )
}
