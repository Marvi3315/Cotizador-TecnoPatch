import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL      || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const SYSCOM_PROXY = import.meta.env.VITE_SYSCOM_PROXY || '/api/syscom'

async function syscomFetch(params = {}) {
  const url = new URL(SYSCOM_PROXY, window.location.origin)
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v)
  })
  const res = await fetch(url.toString())
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Syscom error ${res.status}`)
  }
  return res.json()
}

export async function buscarProductos({ keyword = '', categoria = '', pagina = 1 } = {}) {
  const params = { action: 'search', page: pagina }
  if (keyword.trim())   params.q        = keyword.trim()
  if (categoria.trim()) params.categoria = categoria.trim()
  const data = await syscomFetch(params)
  if (Array.isArray(data)) return { productos: data, total: data.length }
  return { productos: data.productos || data.data || [], total: data.total || 0 }
}

export async function obtenerProducto(sku) {
  return syscomFetch({ action: 'producto', sku })
}

export async function obtenerCategorias() {
  const data = await syscomFetch({ action: 'categorias' })
  return Array.isArray(data) ? data : (data.categorias || [])
}

// ─── Normalizar producto Syscom ───────────────────────────────────────────────
//
// ESTRUCTURA DE PRECIOS EN SYSCOM API:
//   precio_especial  → precio distribuidor en USD (tu costo de compra)
//   precio_lista     → precio público sugerido en USD
//   precio_descuento → precio final en MXN con IVA incluido (lo que ve el cliente)
//   tipo_cambio      → tipo de cambio MXN/USD que Syscom aplica
//
// REGLA: siempre mostrar precio_descuento como precio al cliente (ya es MXN + IVA)
//        El precio_especial y precio_lista son USD → multiplicar × tipo_cambio para MXN
//
export function normalizarProducto(p, idx = 0) {
  const parsePrice = (v) => parseFloat(String(v || '0').replace(/,/g, '')) || 0

  // Precios en USD (costo distribuidor y lista)
  const precioEspecialUSD = parsePrice(p.precio_especial)  || parsePrice(p.precios?.precio_especial)  || parsePrice(p.precios?.especial)
  const precioListaUSD    = parsePrice(p.precio_lista)     || parsePrice(p.precios?.precio_lista)     || parsePrice(p.precios?.lista)

  // precio_descuento = precio final en MXN con IVA (el precio correcto a mostrar al cliente)
  const precioDescuentoMXN = parsePrice(p.precio_descuento) || parsePrice(p.precios?.precio_descuento)

  // Tipo de cambio que Syscom usa (viene en el producto)
  const tipoCambio = parsePrice(p.tipo_cambio) || 17.5

  // Convertir precios USD → MXN usando el tipo de cambio de Syscom
  const precioEspecialMXN = precioEspecialUSD > 0 ? precioEspecialUSD * tipoCambio : 0
  const precioListaMXN    = precioListaUSD    > 0 ? precioListaUSD    * tipoCambio : 0

  // PRECIO AL CLIENTE:
  // 1. precio_descuento si existe (MXN con IVA, ya es el precio final correcto)
  // 2. precio_lista en MXN como fallback
  const precioCliente = precioDescuentoMXN > 0
    ? precioDescuentoMXN
    : precioListaMXN > 0 ? precioListaMXN : 0

  // PRECIO LISTA (para tachar encima del precio cliente):
  // Es el precio_lista en MXN sin el descuento promocional
  const precioListaMostrar = precioListaMXN > 0 && precioListaMXN > precioCliente
    ? precioListaMXN
    : 0

  // COSTO (precio distribuidor en MXN, solo visible internamente)
  const costoMXN = precioEspecialMXN > 0 ? precioEspecialMXN : precioCliente

  // Categoría
  const primeraCat = Array.isArray(p.categorias) ? p.categorias[0] : null
  const catNombre  = primeraCat?.nombre || p.categoria || 'General'
  const catId      = primeraCat?.id || ''

  // Marca
  const marca = typeof p.marca === 'string' ? p.marca : (p.marca?.nombre || '')

  // Stock
  const stock = typeof p.total_existencia === 'number'
    ? p.total_existencia
    : parseInt(p.total_existencia) || null

  const prodId = p.producto_id ? Number(p.producto_id) : (9000 + idx)

  return {
    id:              prodId,
    syscom_id:       prodId,
    cat:             catNombre,
    catId:           String(catId),
    nombre:          p.titulo || p.nombre || 'Producto',
    descripcion:     p.descripcion_corta || '',
    precio:          precioCliente,       // MXN con IVA — precio al cliente
    costo:           costoMXN,            // MXN — costo distribuidor (interno)
    precioLista:     precioListaMostrar,  // MXN — para tachar (precio sin promo)
    precioEspecial:  precioEspecialMXN,   // MXN — precio especial distribuidor
    precioEspecialUSD,                    // USD — para referencia
    precioListaUSD,                       // USD — para referencia
    tipoCambio,
    sku:             p.modelo || String(p.producto_id || ''),
    marca,
    stock,
    imagen:          p.img_portada || p.imagen || '',
    proveedor:       'Syscom',
    _raw:            p,
  }
}
