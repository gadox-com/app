// SVG placeholders para cada categoria de animal
export const ANIMAL_SVG = {
  BEZERRO: `<svg viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="120" height="100" rx="12" fill="#FFF7ED"/>
    <!-- Corpo menor/redondo bezerro -->
    <ellipse cx="60" cy="62" rx="28" ry="20" fill="#D97706"/>
    <!-- Cabeça -->
    <ellipse cx="60" cy="38" rx="16" ry="14" fill="#D97706"/>
    <!-- Focinho -->
    <ellipse cx="60" cy="47" rx="9" ry="6" fill="#F59E0B"/>
    <circle cx="57" cy="46" r="1.5" fill="#92400E"/>
    <circle cx="63" cy="46" r="1.5" fill="#92400E"/>
    <!-- Olho -->
    <circle cx="53" cy="34" r="3" fill="white"/>
    <circle cx="53" cy="34" r="1.8" fill="#1C1917"/>
    <circle cx="54" cy="33" r="0.6" fill="white"/>
    <!-- Orelhas pequenas -->
    <ellipse cx="44" cy="31" rx="5" ry="3.5" fill="#D97706" transform="rotate(-20 44 31)"/>
    <ellipse cx="44" cy="31" rx="3" ry="2" fill="#FBBF24" transform="rotate(-20 44 31)"/>
    <ellipse cx="76" cy="31" rx="5" ry="3.5" fill="#D97706" transform="rotate(20 76 31)"/>
    <ellipse cx="76" cy="31" rx="3" ry="2" fill="#FBBF24" transform="rotate(20 76 31)"/>
    <!-- Chifrinhos pequenos -->
    <path d="M50 27 Q47 20 45 22" stroke="#92400E" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M70 27 Q73 20 75 22" stroke="#92400E" stroke-width="2" fill="none" stroke-linecap="round"/>
    <!-- Pernas curtas -->
    <rect x="41" y="78" width="7" height="14" rx="3" fill="#B45309"/>
    <rect x="52" y="78" width="7" height="14" rx="3" fill="#B45309"/>
    <rect x="63" y="78" width="7" height="14" rx="3" fill="#B45309"/>
    <rect x="74" y="78" width="7" height="14" rx="3" fill="#B45309"/>
    <!-- Rabo -->
    <path d="M88 60 Q96 55 93 48" stroke="#B45309" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <!-- Label -->
    <rect x="8" y="6" width="50" height="14" rx="7" fill="#F97316"/>
    <text x="33" y="16.5" text-anchor="middle" font-size="8" font-weight="bold" fill="white" font-family="sans-serif">BEZERRO</text>
  </svg>`,

  BEZERRA: `<svg viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="120" height="100" rx="12" fill="#FFF7ED"/>
    <ellipse cx="60" cy="62" rx="27" ry="19" fill="#F59E0B"/>
    <ellipse cx="60" cy="38" rx="15" ry="13" fill="#F59E0B"/>
    <ellipse cx="60" cy="47" rx="8" ry="5.5" fill="#FCD34D"/>
    <circle cx="57" cy="46" r="1.5" fill="#92400E"/>
    <circle cx="63" cy="46" r="1.5" fill="#92400E"/>
    <circle cx="53" cy="34" r="3" fill="white"/>
    <circle cx="53" cy="34" r="1.8" fill="#1C1917"/>
    <circle cx="54" cy="33" r="0.6" fill="white"/>
    <ellipse cx="45" cy="32" rx="5" ry="3.5" fill="#F59E0B" transform="rotate(-25 45 32)"/>
    <ellipse cx="45" cy="32" rx="3" ry="2" fill="#FDE68A" transform="rotate(-25 45 32)"/>
    <ellipse cx="75" cy="32" rx="5" ry="3.5" fill="#F59E0B" transform="rotate(25 75 32)"/>
    <ellipse cx="75" cy="32" rx="3" ry="2" fill="#FDE68A" transform="rotate(25 75 32)"/>
    <rect x="41" y="78" width="7" height="14" rx="3" fill="#D97706"/>
    <rect x="52" y="78" width="7" height="14" rx="3" fill="#D97706"/>
    <rect x="63" y="78" width="7" height="14" rx="3" fill="#D97706"/>
    <rect x="74" y="78" width="7" height="14" rx="3" fill="#D97706"/>
    <path d="M87 60 Q95 55 92 48" stroke="#D97706" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <rect x="8" y="6" width="52" height="14" rx="7" fill="#F97316"/>
    <text x="34" y="16.5" text-anchor="middle" font-size="8" font-weight="bold" fill="white" font-family="sans-serif">BEZERRA</text>
  </svg>`,

  NOVILHO: `<svg viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="120" height="100" rx="12" fill="#F0FDF4"/>
    <ellipse cx="60" cy="63" rx="32" ry="22" fill="#16A34A"/>
    <ellipse cx="58" cy="37" rx="17" ry="15" fill="#16A34A"/>
    <ellipse cx="58" cy="47" rx="10" ry="6.5" fill="#4ADE80"/>
    <circle cx="57" cy="47" r="1.5" fill="#14532D"/>
    <circle cx="64" cy="47" r="1.5" fill="#14532D"/>
    <circle cx="50" cy="33" r="3.5" fill="white"/>
    <circle cx="50" cy="33" r="2" fill="#1C1917"/>
    <circle cx="51" cy="32" r="0.7" fill="white"/>
    <ellipse cx="41" cy="30" rx="6" ry="4" fill="#16A34A" transform="rotate(-15 41 30)"/>
    <ellipse cx="41" cy="30" rx="3.5" ry="2.5" fill="#86EFAC" transform="rotate(-15 41 30)"/>
    <ellipse cx="75" cy="30" rx="6" ry="4" fill="#16A34A" transform="rotate(15 75 30)"/>
    <ellipse cx="75" cy="30" rx="3.5" ry="2.5" fill="#86EFAC" transform="rotate(15 75 30)"/>
    <path d="M48 24 Q44 16 41 18" stroke="#14532D" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path d="M68 24 Q72 16 75 18" stroke="#14532D" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <rect x="37" y="80" width="8" height="15" rx="3" fill="#15803D"/>
    <rect x="49" y="80" width="8" height="15" rx="3" fill="#15803D"/>
    <rect x="63" y="80" width="8" height="15" rx="3" fill="#15803D"/>
    <rect x="75" y="80" width="8" height="15" rx="3" fill="#15803D"/>
    <path d="M92 60 Q100 54 97 46" stroke="#15803D" stroke-width="3" fill="none" stroke-linecap="round"/>
    <rect x="8" y="6" width="52" height="14" rx="7" fill="#16A34A"/>
    <text x="34" y="16.5" text-anchor="middle" font-size="8" font-weight="bold" fill="white" font-family="sans-serif">NOVILHO</text>
  </svg>`,

  NOVILHA: `<svg viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="120" height="100" rx="12" fill="#F0FDF4"/>
    <ellipse cx="60" cy="63" rx="30" ry="21" fill="#22C55E"/>
    <ellipse cx="58" cy="37" rx="16" ry="14" fill="#22C55E"/>
    <ellipse cx="58" cy="47" rx="9" ry="6" fill="#86EFAC"/>
    <circle cx="57" cy="46" r="1.5" fill="#14532D"/>
    <circle cx="64" cy="46" r="1.5" fill="#14532D"/>
    <circle cx="50" cy="33" r="3.5" fill="white"/>
    <circle cx="50" cy="33" r="2" fill="#1C1917"/>
    <circle cx="51" cy="32" r="0.7" fill="white"/>
    <ellipse cx="42" cy="31" rx="6" ry="4" fill="#22C55E" transform="rotate(-20 42 31)"/>
    <ellipse cx="42" cy="31" rx="3.5" ry="2.5" fill="#BBF7D0" transform="rotate(-20 42 31)"/>
    <ellipse cx="74" cy="31" rx="6" ry="4" fill="#22C55E" transform="rotate(20 74 31)"/>
    <ellipse cx="74" cy="31" rx="3.5" ry="2.5" fill="#BBF7D0" transform="rotate(20 74 31)"/>
    <rect x="38" y="80" width="8" height="15" rx="3" fill="#15803D"/>
    <rect x="50" y="80" width="8" height="15" rx="3" fill="#15803D"/>
    <rect x="63" y="80" width="8" height="15" rx="3" fill="#15803D"/>
    <rect x="75" y="80" width="8" height="15" rx="3" fill="#15803D"/>
    <path d="M90 60 Q98 54 95 46" stroke="#15803D" stroke-width="3" fill="none" stroke-linecap="round"/>
    <rect x="8" y="6" width="52" height="14" rx="7" fill="#22C55E"/>
    <text x="34" y="16.5" text-anchor="middle" font-size="8" font-weight="bold" fill="white" font-family="sans-serif">NOVILHA</text>
  </svg>`,

  VACA: `<svg viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="120" height="100" rx="12" fill="#EFF6FF"/>
    <ellipse cx="60" cy="63" rx="34" ry="23" fill="#3B82F6"/>
    <!-- Manchas vaca -->
    <ellipse cx="52" cy="60" rx="10" ry="8" fill="#1D4ED8" opacity="0.4"/>
    <ellipse cx="72" cy="68" rx="8" ry="6" fill="#1D4ED8" opacity="0.4"/>
    <ellipse cx="58" cy="37" rx="18" ry="15" fill="#3B82F6"/>
    <ellipse cx="58" cy="47" rx="10" ry="6.5" fill="#93C5FD"/>
    <circle cx="55" cy="47" r="1.5" fill="#1E3A8A"/>
    <circle cx="62" cy="47" r="1.5" fill="#1E3A8A"/>
    <circle cx="49" cy="33" r="4" fill="white"/>
    <circle cx="49" cy="33" r="2.2" fill="#1C1917"/>
    <circle cx="50" cy="32" r="0.8" fill="white"/>
    <ellipse cx="40" cy="29" rx="7" ry="5" fill="#3B82F6" transform="rotate(-15 40 29)"/>
    <ellipse cx="40" cy="29" rx="4" ry="3" fill="#BFDBFE" transform="rotate(-15 40 29)"/>
    <ellipse cx="76" cy="29" rx="7" ry="5" fill="#3B82F6" transform="rotate(15 76 29)"/>
    <ellipse cx="76" cy="29" rx="4" ry="3" fill="#BFDBFE" transform="rotate(15 76 29)"/>
    <path d="M47 23 Q43 15 40 17" stroke="#1D4ED8" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path d="M69 23 Q73 15 76 17" stroke="#1D4ED8" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <!-- Úbere -->
    <ellipse cx="60" cy="83" rx="14" ry="7" fill="#FCA5A5"/>
    <circle cx="54" cy="88" r="2.5" fill="#F87171"/>
    <circle cx="60" cy="89" r="2.5" fill="#F87171"/>
    <circle cx="66" cy="88" r="2.5" fill="#F87171"/>
    <rect x="36" y="76" width="8" height="12" rx="3" fill="#2563EB"/>
    <rect x="76" y="76" width="8" height="12" rx="3" fill="#2563EB"/>
    <path d="M94 60 Q102 54 99 46" stroke="#2563EB" stroke-width="3" fill="none" stroke-linecap="round"/>
    <rect x="8" y="6" width="36" height="14" rx="7" fill="#3B82F6"/>
    <text x="26" y="16.5" text-anchor="middle" font-size="8" font-weight="bold" fill="white" font-family="sans-serif">VACA</text>
  </svg>`,

  TOURO: `<svg viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="120" height="100" rx="12" fill="#FEF2F2"/>
    <ellipse cx="60" cy="63" rx="36" ry="25" fill="#DC2626"/>
    <ellipse cx="58" cy="36" rx="20" ry="17" fill="#DC2626"/>
    <ellipse cx="58" cy="47" rx="12" ry="8" fill="#FCA5A5"/>
    <circle cx="53" cy="47" r="2" fill="#7F1D1D"/>
    <circle cx="63" cy="47" r="2" fill="#7F1D1D"/>
    <!-- Anel no nariz -->
    <circle cx="58" cy="50" r="4" fill="none" stroke="#FCD34D" stroke-width="2"/>
    <circle cx="47" cy="31" r="4.5" fill="white"/>
    <circle cx="47" cy="31" r="2.5" fill="#1C1917"/>
    <circle cx="48" cy="30" r="0.9" fill="white"/>
    <ellipse cx="37" cy="26" rx="8" ry="5.5" fill="#DC2626" transform="rotate(-10 37 26)"/>
    <ellipse cx="37" cy="26" rx="4.5" ry="3" fill="#FECACA" transform="rotate(-10 37 26)"/>
    <ellipse cx="79" cy="26" rx="8" ry="5.5" fill="#DC2626" transform="rotate(10 79 26)"/>
    <ellipse cx="79" cy="26" rx="4.5" ry="3" fill="#FECACA" transform="rotate(10 79 26)"/>
    <!-- Chifres grandes -->
    <path d="M44 20 Q36 8 30 12" stroke="#7F1D1D" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <path d="M72 20 Q80 8 86 12" stroke="#7F1D1D" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <rect x="34" y="80" width="10" height="16" rx="4" fill="#B91C1C"/>
    <rect x="49" y="80" width="10" height="16" rx="4" fill="#B91C1C"/>
    <rect x="63" y="80" width="10" height="16" rx="4" fill="#B91C1C"/>
    <rect x="78" y="80" width="10" height="16" rx="4" fill="#B91C1C"/>
    <path d="M96 60 Q106 52 102 42" stroke="#B91C1C" stroke-width="4" fill="none" stroke-linecap="round"/>
    <rect x="8" y="6" width="40" height="14" rx="7" fill="#DC2626"/>
    <text x="28" y="16.5" text-anchor="middle" font-size="8" font-weight="bold" fill="white" font-family="sans-serif">TOURO</text>
  </svg>`,

  BOI: `<svg viewBox="0 0 120 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="120" height="100" rx="12" fill="#F5F3FF"/>
    <ellipse cx="60" cy="63" rx="35" ry="24" fill="#7C3AED"/>
    <ellipse cx="58" cy="36" rx="19" ry="16" fill="#7C3AED"/>
    <ellipse cx="58" cy="47" rx="11" ry="7" fill="#C4B5FD"/>
    <circle cx="54" cy="47" r="1.8" fill="#3B0764"/>
    <circle cx="63" cy="47" r="1.8" fill="#3B0764"/>
    <circle cx="48" cy="31" r="4" fill="white"/>
    <circle cx="48" cy="31" r="2.2" fill="#1C1917"/>
    <circle cx="49" cy="30" r="0.8" fill="white"/>
    <ellipse cx="38" cy="27" rx="7.5" ry="5" fill="#7C3AED" transform="rotate(-12 38 27)"/>
    <ellipse cx="38" cy="27" rx="4" ry="3" fill="#DDD6FE" transform="rotate(-12 38 27)"/>
    <ellipse cx="78" cy="27" rx="7.5" ry="5" fill="#7C3AED" transform="rotate(12 78 27)"/>
    <ellipse cx="78" cy="27" rx="4" ry="3" fill="#DDD6FE" transform="rotate(12 78 27)"/>
    <path d="M46 21 Q40 11 35 14" stroke="#4C1D95" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M70 21 Q76 11 81 14" stroke="#4C1D95" stroke-width="3" fill="none" stroke-linecap="round"/>
    <rect x="35" y="80" width="9" height="16" rx="4" fill="#6D28D9"/>
    <rect x="49" y="80" width="9" height="16" rx="4" fill="#6D28D9"/>
    <rect x="63" y="80" width="9" height="16" rx="4" fill="#6D28D9"/>
    <rect x="77" y="80" width="9" height="16" rx="4" fill="#6D28D9"/>
    <path d="M94 60 Q103 53 100 44" stroke="#6D28D9" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <rect x="8" y="6" width="28" height="14" rx="7" fill="#7C3AED"/>
    <text x="22" y="16.5" text-anchor="middle" font-size="8" font-weight="bold" fill="white" font-family="sans-serif">BOI</text>
  </svg>`,
}

export function getAnimalPlaceholder(categoria) {
  if (!categoria) return ANIMAL_SVG.BOI
  const key = categoria.toUpperCase()
  return ANIMAL_SVG[key] || ANIMAL_SVG.BOI
}

export function getAnimalPlaceholderUrl(categoria) {
  const svg = getAnimalPlaceholder(categoria)
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`
}
