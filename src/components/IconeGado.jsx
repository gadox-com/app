// Ícone customizado de cabeça de gado (substitui o Beef do lucide)
export default function IconeGado({ size = 24, strokeWidth = 1.8, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Chifres */}
      <path d="M7 4 C5 4 3 5 3 7 C3 9 5 10 7 9" />
      <path d="M17 4 C19 4 21 5 21 7 C21 9 19 10 17 9" />
      {/* Cabeça */}
      <ellipse cx="12" cy="13" rx="7" ry="6" />
      {/* Focinho */}
      <ellipse cx="12" cy="17" rx="3.5" ry="2" />
      {/* Narinas */}
      <circle cx="10.5" cy="17" r="0.5" fill="currentColor" stroke="none" />
      <circle cx="13.5" cy="17" r="0.5" fill="currentColor" stroke="none" />
      {/* Orelhas */}
      <path d="M5.5 11 C4 10 3.5 12 5 13" />
      <path d="M18.5 11 C20 10 20.5 12 19 13" />
      {/* Olhos */}
      <circle cx="9.5" cy="12" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="12" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  )
}
