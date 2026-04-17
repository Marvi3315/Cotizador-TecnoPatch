import { useState } from 'react'
import { Download, Trash2, RefreshCw, Search, FileBarChart } from 'lucide-react'
import { ESTATUS_LABELS } from '../hooks/useCotizaciones'
import { useFX } from '../context/FXContext'
import { formatMXN, formatUSD, toUSD } from '../lib/fx'
import { formatDateShort, generarPDFCliente, generarPDFInterno } from '../lib/pdf'

const FILTROS = ['todos','pendiente','enviada','aceptada','rechazada','en_proceso']

export default function CRM({ cotizaciones, loading, onActualizarEstatus, onEliminar, onRefresh }) {
  const { rate, currency } = useFX()
  const [filtro, setFiltro]       = useState('todos')
  const [busqueda, setBusqueda]   = useState('')
  const [deletingId, setDeletingId] = useState(null)

  const fmt = (mxn) => currency === 'USD' ? formatUSD(toUSD(mxn, rate)) : formatMXN(mxn)

  const filtered = cotizaciones.filter(c => {
    const matchFiltro   = filtro === 'todos' || c.estatus === filtro
    const matchBusqueda = !busqueda ||
      [c.titulo, c.cliente_nombre, c.folio, c.cliente_empresa]
        .some(v => v?.toLowerCase().includes(busqueda.toLowerCase()))
    return matchFiltro && matchBusqueda
  })

  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminar esta cotización? No se puede deshacer.')) return
    setDeletingId(id)
    try { await onEliminar(id) } finally { setDeletingId(null) }
  }

  const cardStyle = { background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h2 style={{ fontSize:22, color:'var(--text)', fontFamily:'"Plus Jakarta Sans",sans-serif', marginBottom:4 }}>CRM / Historial</h2>
          <p style={{ color:'var(--text2)', fontSize:13 }}>{cotizaciones.length} cotización{cotizaciones.length!==1?'es':''} en total</p>
        </div>
        <button onClick={onRefresh} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', background:'var(--card)', border:'1.5px solid var(--border)', borderRadius:8, color:'var(--text2)', fontSize:12, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
          <RefreshCw size={13}/> Actualizar
        </button>
      </div>

      {/* Filtros */}
      <div style={{ ...cardStyle, padding:14 }}>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ position:'relative', flex:'1 1 200px' }}>
            <Search size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text3)', pointerEvents:'none' }}/>
            <input value={busqueda} onChange={e=>setBusqueda(e.target.value)}
              placeholder="Buscar por folio, cliente, proyecto..."
              style={{ width:'100%', padding:'7px 10px 7px 30px', background:'var(--bg)', border:'1.5px solid var(--border)', borderRadius:8, color:'var(--text)', fontSize:12, fontFamily:"'DM Sans',sans-serif", outline:'none' }}
              onFocus={e=>e.target.style.borderColor='var(--blue)'}
              onBlur={e=>e.target.style.borderColor='var(--border)'}
            />
          </div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {FILTROS.map(est => {
              const info = est==='todos' ? { label:'Todos' } : ESTATUS_LABELS[est]
              const active = filtro === est
              return (
                <button key={est} onClick={()=>setFiltro(est)} style={{
                  padding:'5px 12px', borderRadius:20, border: active?'none':'1px solid var(--border)',
                  background: active ? (est==='todos'?'var(--blue)':info?.bg||'var(--blue)') : 'transparent',
                  color: active ? (est==='todos'?'#fff':info?.color||'#fff') : 'var(--text2)',
                  fontSize:11, fontWeight: active?700:400, cursor:'pointer',
                  fontFamily:'"Plus Jakarta Sans",sans-serif', transition:'all 0.15s',
                }}>
                  {info?.label||est}
                  {est!=='todos' && <span style={{ marginLeft:5, opacity:0.7 }}>{cotizaciones.filter(c=>c.estatus===est).length}</span>}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div style={{ ...cardStyle, overflow:'hidden' }}>
        {/* Header */}
        <div style={{ display:'grid', gridTemplateColumns:'100px 1fr 130px 110px 120px 90px 100px', gap:10, padding:'10px 16px', background:'var(--bg3)', borderBottom:'1px solid var(--border)', fontSize:10, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.05em' }}>
          <span>Folio</span><span>Proyecto</span><span>Cliente</span>
          <span style={{textAlign:'right'}}>Total</span>
          <span>Estatus</span><span>Fecha</span><span style={{textAlign:'center'}}>Acciones</span>
        </div>

        {loading ? (
          <div style={{ padding:'40px', textAlign:'center', color:'var(--text3)' }}>
            <RefreshCw size={24} style={{ margin:'0 auto 10px', animation:'spin 1s linear infinite' }}/>
            <div>Cargando...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding:'40px', textAlign:'center', color:'var(--text3)', fontSize:13 }}>
            No hay cotizaciones{filtro!=='todos'?` con estatus "${ESTATUS_LABELS[filtro]?.label}"`:''}.
          </div>
        ) : filtered.map((c, i) => {
          const est = ESTATUS_LABELS[c.estatus] || ESTATUS_LABELS.pendiente
          return (
            <div key={c.id}
              style={{ display:'grid', gridTemplateColumns:'100px 1fr 130px 110px 120px 90px 100px', gap:10, alignItems:'center', padding:'12px 16px', borderBottom:i<filtered.length-1?'1px solid var(--border)':'none', transition:'background 0.1s' }}
              onMouseEnter={e=>e.currentTarget.style.background='var(--bg3)'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}
            >
              <div style={{ fontSize:11, fontWeight:700, color:'var(--blue)', fontFamily:'"Plus Jakarta Sans",sans-serif' }}>{c.folio}</div>
              <div>
                <div style={{ fontSize:13, fontWeight:500, color:'var(--text)' }}>{c.titulo||'Sin título'}</div>
                <div style={{ fontSize:10, color:'var(--text3)', marginTop:1 }}>{(c.items?.length||0)} producto{(c.items?.length||0)!==1?'s':''}</div>
              </div>
              <div>
                <div style={{ fontSize:12, color:'var(--text)', fontWeight:500 }}>{c.cliente_nombre||'—'}</div>
                <div style={{ fontSize:10, color:'var(--text3)' }}>{c.cliente_empresa||''}</div>
              </div>
              <div style={{ textAlign:'right', fontSize:13, fontWeight:700, color:'var(--text)', fontFamily:'"Plus Jakarta Sans",sans-serif' }}>
                {fmt(c.total)}
              </div>

              {/* Selector estatus */}
              <select value={c.estatus} onChange={e=>onActualizarEstatus(c.id,e.target.value)} style={{
                width:'100%', padding:'4px 8px', borderRadius:20, border:'none',
                background:est.bg, color:est.color, fontSize:10, fontWeight:700,
                cursor:'pointer', fontFamily:"'DM Sans',sans-serif", outline:'none', textAlign:'center',
              }}>
                {Object.entries(ESTATUS_LABELS).map(([k,v]) => (
                  <option key={k} value={k} style={{ background:'var(--bg)', color:'var(--text)' }}>{v.label}</option>
                ))}
              </select>

              <div style={{ fontSize:11, color:'var(--text3)' }}>
                {c.created_at ? formatDateShort(c.created_at) : '—'}
              </div>

              {/* Acciones */}
              <div style={{ display:'flex', gap:5, justifyContent:'center' }}>
                {[
                  { icon: Download, title:'PDF Cliente', action:() => generarPDFCliente(c), hoverColor:'var(--blue)' },
                  { icon: FileBarChart, title:'PDF Interno', action:() => generarPDFInterno(c), hoverColor:'var(--accent)' },
                  { icon: Trash2, title:'Eliminar', action:() => handleEliminar(c.id), hoverColor:'var(--danger)', disabled: deletingId===c.id },
                ].map(({ icon:Icon, title, action, hoverColor, disabled }) => (
                  <button key={title} onClick={action} disabled={disabled} title={title} style={{ background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:6, padding:'5px 6px', cursor:disabled?'not-allowed':'pointer', color:'var(--text3)', display:'flex', alignItems:'center', transition:'all 0.15s', opacity:disabled?0.5:1 }}
                    onMouseEnter={e=>{ e.currentTarget.style.borderColor=hoverColor; e.currentTarget.style.color=hoverColor }}
                    onMouseLeave={e=>{ e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text3)' }}>
                    <Icon size={12}/>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
    </div>
  )
}
