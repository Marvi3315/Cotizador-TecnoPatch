// lib/fx.js
// Tipo de cambio USD/MXN — obtenido desde la API de Syscom (campo tipo_cambio)

const FX_CACHE_KEY = 'tp_fx_rate'
const FX_CACHE_TTL = 3 * 60 * 60 * 1000 // 3 horas

export async function getFXRate() {
  // 1. Caché válido
  try {
    const cached = JSON.parse(localStorage.getItem(FX_CACHE_KEY) || 'null')
    if (cached?.rate > 10 && cached.ts > Date.now() - FX_CACHE_TTL) {
      return { rate: cached.rate, source: 'cache', ts: cached.ts }
    }
  } catch {}

  // 2. Obtener desde un producto de Syscom — el campo tipo_cambio es el más confiable
  try {
    const API = import.meta.env.VITE_SYSCOM_PROXY || '/api/syscom'
    const res = await fetch(`${API}?action=search&categoria=22&page=1`)
    if (res.ok) {
      const data = await res.json()
      const productos = Array.isArray(data) ? data : (data.productos || [])
      // tipo_cambio viene en cada producto — tomamos el primero disponible
      for (const p of productos) {
        const tc = parseFloat(String(p.tipo_cambio || '0').replace(/,/g,''))
        if (tc > 10) {
          saveFXCache(tc)
          return { rate: tc, source: 'syscom', ts: Date.now() }
        }
      }
    }
  } catch {}

  // 3. Caché vencido como fallback
  try {
    const stale = JSON.parse(localStorage.getItem(FX_CACHE_KEY) || 'null')
    if (stale?.rate > 10) return { rate: stale.rate, source: 'stale', ts: stale.ts }
  } catch {}

  // 4. Hardcoded de emergencia
  return { rate: 17.50, source: 'fallback', ts: Date.now() }
}

function saveFXCache(rate) {
  localStorage.setItem(FX_CACHE_KEY, JSON.stringify({ rate, ts: Date.now() }))
}

export const toUSD = (mxn, rate) => (rate > 0 ? mxn / rate : 0)
export const toMXN = (usd, rate) => usd * rate

export function formatMXN(amount) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount || 0)
}

export function formatUSD(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0)
}

export function formatCurrency(amount, currency = 'MXN', rate = 17.5) {
  const value = currency === 'USD' ? toUSD(amount, rate) : amount
  return new Intl.NumberFormat('es-MX', {
    style: 'currency', currency,
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(value || 0)
}
