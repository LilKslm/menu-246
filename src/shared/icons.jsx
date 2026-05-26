// Shared icons for Menu 246 — stroke-based, rounded, SF Symbols feel.
// Ported from the Hearth design handoff. Only icons actually used in the app
// are kept here (meal glyphs were replaced by emoji; see shared/meals.js).

export const Icon = ({ d, size = 18, sw = 1.6, fill = 'none', stroke = 'currentColor', style, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
       strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style} className={className}>
    {d}
  </svg>
)

export const I = {
  Check:    (p) => <Icon {...p} d={<polyline points="4,12 10,18 20,6" />} />,
  ChevR:    (p) => <Icon {...p} d={<polyline points="9,5 16,12 9,19" />} />,
  ChevL:    (p) => <Icon {...p} d={<polyline points="15,5 8,12 15,19" />} />,
  ChevD:    (p) => <Icon {...p} d={<polyline points="5,9 12,16 19,9" />} />,
  Arrow:    (p) => <Icon {...p} d={<><line x1="4" y1="12" x2="20" y2="12"/><polyline points="14,6 20,12 14,18"/></>} />,
  Plus:     (p) => <Icon {...p} d={<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>} />,
  Minus:    (p) => <Icon {...p} d={<line x1="5" y1="12" x2="19" y2="12"/>} />,
  Search:   (p) => <Icon {...p} d={<><circle cx="11" cy="11" r="6"/><line x1="16" y1="16" x2="20" y2="20"/></>} />,
  Book:     (p) => <Icon {...p} d={<><path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v17H6.5A1.5 1.5 0 0 1 5 18.5z"/><path d="M5 18.5A1.5 1.5 0 0 1 6.5 17H19"/></>} />,
  Message:  (p) => <Icon {...p} d={<path d="M4 5h16v11H9l-5 4z"/>} />,
  Save:     (p) => <Icon {...p} d={<><path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h8V4"/><rect x="8" y="13" width="8" height="5"/></>} />,
  Drag:     (p) => <Icon {...p} d={<><circle cx="9" cy="6" r="1.2" fill="currentColor"/><circle cx="15" cy="6" r="1.2" fill="currentColor"/><circle cx="9" cy="12" r="1.2" fill="currentColor"/><circle cx="15" cy="12" r="1.2" fill="currentColor"/><circle cx="9" cy="18" r="1.2" fill="currentColor"/><circle cx="15" cy="18" r="1.2" fill="currentColor"/></>} />,
  Download: (p) => <Icon {...p} d={<><line x1="12" y1="4" x2="12" y2="15"/><polyline points="7,10 12,15 17,10"/><line x1="5" y1="19" x2="19" y2="19"/></>} />,
  Doc:      (p) => <Icon {...p} d={<><path d="M7 3h7l4 4v14H7z"/><polyline points="14,3 14,7 18,7"/></>} />,
  X:        (p) => <Icon {...p} d={<><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></>} />,
  Trash:    (p) => <Icon {...p} d={<><polyline points="4,7 20,7"/><path d="M9 7V5h6v2"/><path d="M6 7l1 13h10l1-13"/><line x1="10" y1="11" x2="10" y2="16"/><line x1="14" y1="11" x2="14" y2="16"/></>} />,
}
