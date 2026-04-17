import { useState, useCallback, useRef, useEffect } from 'react'
import { buscarProductos, obtenerCategorias, normalizarProducto } from '../lib/supabase'

export function useSyscom() {
  const [productos, setProductos]   = useState([])
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState(null)
  const [total, setTotal]           = useState(0)
  const [pagina, setPagina]         = useState(1)
  const [query, setQuery]           = useState('')
  const [catActiva, setCatActiva]   = useState('')
  const debounceRef = useRef(null)

  useEffect(() => {
    obtenerCategorias().then(cats => setCategorias(cats)).catch(() => {})
  }, [])

  const cargar = useCallback(async ({ keyword = '', categoria = '', page = 1, append = false } = {}) => {
    setLoading(true)
    setError(null)
    try {
      const data = await buscarProductos({ keyword, categoria, pagina: page })
      const normalized = (data.productos || []).map((p, i) => normalizarProducto(p, i))
      setProductos(prev => append ? [...prev, ...normalized] : normalized)
      setTotal(data.total || 0)
    } catch (err) {
      setError(err.message)
      if (!append) setProductos([])
    } finally {
      setLoading(false)
    }
  }, [])

  const buscar = useCallback((keyword) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setQuery(keyword)
    if (!keyword && !catActiva) { setProductos([]); setTotal(0); return }
    debounceRef.current = setTimeout(() => {
      setPagina(1)
      cargar({ keyword, categoria: catActiva, page: 1 })
    }, 500)
  }, [cargar, catActiva])

  const filtrarCategoria = useCallback((catId) => {
    setCatActiva(catId)
    setQuery('')
    setPagina(1)
    cargar({ keyword: '', categoria: catId, page: 1 })
  }, [cargar])

  const cargarMas = useCallback(() => {
    const next = pagina + 1
    setPagina(next)
    cargar({ keyword: query, categoria: catActiva, page: next, append: true })
  }, [cargar, pagina, query, catActiva])

  const limpiar = useCallback(() => {
    setProductos([]); setQuery(''); setCatActiva(''); setPagina(1); setTotal(0); setError(null)
  }, [])

  return {
    productos, categorias, loading, error, total, pagina, query, catActiva,
    buscar, filtrarCategoria, cargarMas, limpiar,
    hayMas: productos.length > 0 && productos.length < total,
  }
}
