// lib/fx.js
// Obtiene el tipo de cambio USD/MXN directamente desde el endpoint de Syscom
// La API de Syscom devuelve el campo `tipo_cambio` en sus respuestas de productos

const FX_CACHE_KEY = 'tp_fx_rate'
const FX_CACHE_TTL = 3 * 60 * 60 * 1000 // 3 horas

/**
 * Retorna el tipo de cambio USD → MXN cachado o fresco desde Syscom.
 * Syscom lo incluye en la respuesta de /api/v1/productos como `tipo_cambio`.
 * Si falla, usa el valor cacheado o un fallback conservador.
 */
export async function getFXRate() {
  // 1. Intentar caché válido
  try {
    const cached = JSON.parse(localStorage.getItem(FX_CACHE_KEY) || 'null')
    if (cached && cached.rate && cached.ts > Date.now() - FX_CACHE_TTL) {
      return { rate: cached.rate, source: 'cache', ts: cached.ts }
    }
  } catch {}

  // 2. Intentar obtener desde nuestra Netlify Function / Supabase Edge
  // El proxy ya llama a Syscom — simplemente pedimos el campo tipo_cambio
  // usando el endpoint de debug (devuelve un producto con tipo_cambio)
  try {
    const API = import.meta.env.VITE_SYSCOM_PROXY || '/api/syscom'
    const res = await fetch(`${API}?action=tipocambio`)
    if (res.ok) {
      const data = await res.json()
      const rate = parseFloat(data.tipo_cambio || data.rate || 0)
      if (rate > 10) {
        saveFXCache(rate)
        return { rate, source: 'syscom', ts: Date.now() }
      }
    }
  } catch {}

  // 3. Fallback: tipo_cambio desde un producto real de Syscom
  try {
    const API = import.meta.env.VITE_SYSCOM_PROXY || '/api/syscom'
    const res = await fetch(`${API}?action=search&categoria=22&page=1`)
    if (res.ok) {
      const data = await res.json()
      const productos = Array.isArray(data) ? data : (data.productos || [])
      const tc = parseFloat(productos[0]?.tipo_cambio || 0)
      if (tc > 10) {
        saveFXCache(tc)
        return { rate: tc, source: 'syscom_product', ts: Date.now() }
      }
    }
  } catch {}

  // 4. Último fallback: valor cacheado aunque esté vencido
  try {
    const stale = JSON.parse(localStorage.getItem(FX_CACHE_KEY) || 'null')
    if (stale?.rate > 10) return { rate: stale.rate, source: 'stale', ts: stale.ts }
  } catch {}

  // 5. Fallback hardcoded (se actualiza manualmente)
  return { rate: 17.50, source: 'fallback', ts: Date.now() }
}

function saveFXCache(rate) {
  localStorage.setItem(FX_CACHE_KEY, JSON.stringify({ rate, ts: Date.now() }))
}

/** Convierte MXN → USD */
export const toUSD = (mxn, rate) => (rate > 0 ? mxn / rate : 0)

/** Convierte USD → MXN */
export const toMXN = (usd, rate) => usd * rate

/** Formatea con símbolo de moneda */
export function formatCurrency(amount, currency = 'MXN', rate = 17.5) {
  const value = currency === 'USD' ? toUSD(amount, rate) : amount
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0)
}

export const formatMXN = (amount) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount || 0)

export const formatUSD = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0)
