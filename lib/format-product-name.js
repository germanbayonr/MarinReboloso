/** Tipos de pieza que pueden ir pegados al nombre del modelo (p. ej. Pendientesfolklore). */
const PRODUCT_TYPE_PREFIXES = [
  'peinecillos',
  'peinecillo',
  'cinturones',
  'cinturon',
  'gargantillas',
  'gargantilla',
  'pendientes',
  'colgantes',
  'colgante',
  'collares',
  'collar',
  'pulseras',
  'pulsera',
  'mantones',
  'manton',
  'anillos',
  'anillo',
  'broches',
  'broche',
  'bolsos',
  'bolso',
  'sortijas',
  'sortija',
  'aretes',
  'aros',
]

function normalizeForMatch(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function capitalizeWord(word) {
  if (!word) return word
  return word.charAt(0).toUpperCase() + word.slice(1)
}

function splitCompoundToken(word) {
  const trimmed = String(word ?? '').trim()
  if (!trimmed) return trimmed

  // PascalCase / camelCase: PendientesDescara → Pendientes Descara
  const camelSplit = trimmed.replace(/([a-záéíóúñ])([A-ZÁÉÍÓÚÑ])/g, '$1 $2')
  if (camelSplit.includes(' ')) {
    return camelSplit
      .split(/\s+/)
      .map((part) => (part.length > 1 && part === part.toUpperCase() ? part : capitalizeWord(part)))
      .join(' ')
  }

  // Minúsculas pegadas: pendientesfolklore → Pendientes Folklore
  const normalized = normalizeForMatch(trimmed)
  for (const prefix of PRODUCT_TYPE_PREFIXES) {
    if (normalized.startsWith(prefix) && normalized.length > prefix.length) {
      const rest = trimmed.slice(prefix.length)
      if (rest.length >= 2) {
        return `${capitalizeWord(trimmed.slice(0, prefix.length))} ${capitalizeWord(rest)}`
      }
    }
  }

  return trimmed
}

/** Separa palabras pegadas en nombres de producto para mostrar en la tienda. */
function formatProductDisplayName(name) {
  const raw = String(name ?? '').trim()
  if (!raw) return raw
  return raw
    .split(/\s+/)
    .flatMap((token) => splitCompoundToken(token).split(/\s+/))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

module.exports = { formatProductDisplayName, splitCompoundToken }
