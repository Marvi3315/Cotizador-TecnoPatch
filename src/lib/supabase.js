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

export function normalizarProducto(p, idx = 0) {
  const parsePrice = (v) => parseFloat(String(v || '0').replace(/,/g, '')) || 0
  const pEspecial  = parsePrice(p.precio_especial)  || parsePrice(p.precios?.precio_especial)
  const pDescuento = parsePrice(p.precio_descuento) || parsePrice(p.precios?.precio_descuento)
  const pLista     = parsePrice(p.precio_lista)     || parsePrice(p.precios?.precio_lista)
  const tipoCambio = parsePrice(p.tipo_cambio) || 0
  const costoSyscom = pEspecial > 0 ? pEspecial : (pDescuento > 0 ? pDescuento : pLista)
  const precioCliente = pEspecial > 0 ? Math.ceil(pEspecial * 1.25) : pLista > 0 ? pLista : 0
  const primeraCat = Array.isArray(p.categorias) ? p.categorias[0] : null
  const catNombre  = primeraCat?.nombre || p.categoria || 'General'
  const catId      = primeraCat?.id || ''
  const marca = typeof p.marca === 'string' ? p.marca : (p.marca?.nombre || '')
  const stock = typeof p.total_existencia === 'number' ? p.total_existencia : parseInt(p.total_existencia) || null
  const prodId = p.producto_id ? Number(p.producto_id) : (9000 + idx)
  return {
    id: prodId, syscom_id: prodId,
    cat: catNombre, catId: String(catId),
    nombre: p.titulo || p.nombre || 'Producto',
    descripcion: p.descripcion_corta || '',
    precio: precioCliente,
    costo: costoSyscom,
    precioLista: pLista,
    precioEspecial: pEspecial,
    sku: p.modelo || String(p.producto_id || ''),
    marca, stock, imagen: p.img_portada || p.imagen || '',
    tipoCambio, proveedor: 'Syscom', _raw: p,
  }
}
