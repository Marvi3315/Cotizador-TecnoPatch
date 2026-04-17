import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export const ESTATUS_LABELS = {
  pendiente:  { label:'Pendiente',   color:'#f59e0b', bg:'rgba(245,158,11,0.12)'  },
  enviada:    { label:'Enviada',     color:'#3b82f6', bg:'rgba(59,130,246,0.12)'  },
  aceptada:   { label:'Aceptada',    color:'#10b981', bg:'rgba(16,185,129,0.12)'  },
  rechazada:  { label:'Rechazada',   color:'#ef4444', bg:'rgba(239,68,68,0.12)'   },
  en_proceso: { label:'En proceso',  color:'#8b5cf6', bg:'rgba(139,92,246,0.12)'  },
}

function generarFolio() {
  const d = new Date()
  const fecha = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`
  const rand = Math.floor(Math.random()*9000)+1000
  return `TP-${fecha}-${rand}`
}

export function useCotizaciones() {
  const [cotizaciones, setCotizaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const fetchCotizaciones = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('cotizaciones')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setCotizaciones(data || [])
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchCotizaciones() }, [fetchCotizaciones])

  const guardarCotizacion = useCallback(async (cotizacion) => {
    const payload = {
      ...cotizacion,
      folio:      cotizacion.folio || generarFolio(),
      estatus:    cotizacion.estatus || 'pendiente',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await supabase.from('cotizaciones').insert([payload]).select().single()
    if (error) throw error
    setCotizaciones(prev => [data, ...prev])
    return data
  }, [])

  const actualizarEstatus = useCallback(async (id, estatus) => {
    const { error } = await supabase.from('cotizaciones')
      .update({ estatus, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) throw error
    setCotizaciones(prev => prev.map(c => c.id === id ? { ...c, estatus } : c))
  }, [])

  const eliminarCotizacion = useCallback(async (id) => {
    const { error } = await supabase.from('cotizaciones').delete().eq('id', id)
    if (error) throw error
    setCotizaciones(prev => prev.filter(c => c.id !== id))
  }, [])

  const metricas = {
    total:       cotizaciones.length,
    pendientes:  cotizaciones.filter(c => c.estatus === 'pendiente').length,
    aceptadas:   cotizaciones.filter(c => c.estatus === 'aceptada').length,
    enviadas:    cotizaciones.filter(c => c.estatus === 'enviada').length,
    valorTotal:  cotizaciones
      .filter(c => c.estatus === 'aceptada')
      .reduce((s, c) => s + (c.total || 0), 0),
  }

  return { cotizaciones, loading, error, metricas, fetchCotizaciones, guardarCotizacion, actualizarEstatus, eliminarCotizacion }
}
