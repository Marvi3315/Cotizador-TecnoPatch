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

// ─── Normalizar producto ──────────────────────────────────────────────────────
// La función de Netlify ya viene los campos _precios.* calculados correctamente:
//   precio_cliente_mxn  → precio final al cliente en MXN (con IVA, listo para mostrar)
//   precio_lista_mxn    → precio lista en MXN (para tachar si hay descuento)
//   precio_especial_mxn → precio distribuidor en MXN (costo interno)
//   precio_lista_tachar → precio lista para mostrar tachado (0 si no aplica)
//   tipo_cambio         → TC real que usó Syscom
//
export function normalizarProducto(p, idx = 0) {
  const parse = (v) => parseFloat(String(v || '0').replace(/,/g, '')) || 0

  // Usar campos pre-calculados de la función si existen
  const precioCliente  = parse(p.precio_cliente_mxn)  || parse(p.precio_lista)   || 0
  const precioLista    = parse(p.precio_lista_tachar)  || 0
  const costoMXN       = parse(p.precio_especial_mxn) || parse(p.precio_especial) || 0
  const tipoCambio     = parse(p.tipo_cambio)          || 17.0

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
    id:            prodId,
    syscom_id:     prodId,
    cat:           catNombre,
    catId:         String(catId),
    nombre:        p.titulo || p.nombre || 'Producto',
    descripcion:   p.descripcion_corta || '',
    precio:        precioCliente,   // MXN con IVA — mostrar al cliente
    costo:         costoMXN,        // MXN — costo distribuidor (interno)
    precioLista:   precioLista,     // MXN — precio lista para tachar
    precioEspecial: costoMXN,       // alias
    tipoCambio,
    sku:           p.modelo || String(p.producto_id || ''),
    marca,
    stock,
    imagen:        p.img_portada || p.imagen || '',
    proveedor:     'Syscom',
    _raw:          p,
  }
}
