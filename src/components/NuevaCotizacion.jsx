// components/NuevaCotizacion.jsx
import { useState } from 'react'
import { Trash2, Plus, Download, Save, Package, FileBarChart } from 'lucide-react'
import BuscadorSyscom from './BuscadorSyscom'
import { useFX } from '../context/FXContext'
import { formatMXN, formatUSD, toUSD } from '../lib/fx'
import { calcularTotales, generarPDFCliente, generarPDFInterno } from '../lib/pdf'

const input = (extra = {}) => ({
  width: '100%', padding: '8px 11px',
  background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8,
  color: 'var(--text)', fontSize: 13, fontFamily: "'DM Sans',sans-serif",
  outline: 'none', transition: 'border-color 0.15s',
  ...extra,
})

const emptyForm = {
  titulo:'', cliente_nombre:'', cliente_empresa:'', cliente_rfc:'',
  cliente_contacto:'', cliente_email:'', cliente_telefono:'',
  notas:'', descuento: 0, incluye_iva: true,
}

export default function NuevaCotizacion({ onGuardar }) {
  const { rate, currency } = useFX()
  const [form, setForm]   = useState(emptyForm)
  const [items, setItems] = useState([])
  const [saving, setSaving] = useState(false)

  const fmt = (mxn) => currency === 'USD' ? formatUSD(toUSD(mxn, rate)) : formatMXN(mxn)
  const totales = calcularTotales(items, form.descuento, form.incluye_iva)

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleAgregar = (producto) => {
    setItems(prev => {
      const idx = prev.findIndex(i => i.syscom_id && i.syscom_id === producto.syscom_id)
      if (idx >= 0) {
        const upd = [...prev]
        upd[idx] = { ...upd[idx], cantidad: upd[idx].cantidad + (producto.cantidad || 1) }
        return upd
      }
      return [...prev, {
        _id: Date.now(),
        syscom_id: producto.syscom_id || null,
        sku:     producto.sku || '',
        nombre:  producto.nombre || producto.name || '',
        descripcion: producto.descripcion || '',
        precio:  producto.precio || producto.price || 0,
        costo:   producto.costo || producto.cost  || 0,
        cantidad: producto.cantidad || 1,
        marca:   producto.marca || '',
        cat:     producto.cat || '',
        proveedor: producto.proveedor || 'Manual',
        imagen:  producto.imagen || '',
        nota:    '',
      }]
    })
  }

  const setItem = (id, key, val) => {
    setItems(prev => prev.map(i =>
      i._id === id ? { ...i, [key]: ['precio','costo','cantidad'].includes(key) ? Number(val)||0 : val } : i
    ))
  }

  const removeItem = (id) => setItems(prev => prev.filter(i => i._id !== id))

  const handleGuardar = async () => {
    if (!form.cliente_nombre || items.length === 0) {
      alert('Agrega el nombre del cliente y al menos un producto.')
      return
    }
    setSaving(true)
    try {
      await onGuardar({ ...form, items, subtotal: totales.subtotal, total: totales.total })
      setForm(emptyForm); setItems([])
    } catch (err) { alert('Error: ' + err.message) }
    finally { setSaving(false) }
  }

  const cotizacionActual = { ...form, items, total: totales.total }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, color: 'var(--text)', fontFamily: '"Plus Jakarta Sans",sans-serif', marginBottom: 4 }}>
            Nueva Cotización
          </h2>
          <p style={{ color: 'var(--text2)', fontSize: 13 }}>
            Precios en <strong>{currency}</strong>{currency==='USD' ? ` · TC: $${rate.toFixed(2)} MXN` : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => generarPDFInterno(cotizacionActual, rate)} style={btnSecStyle}>
            <FileBarChart size={14} /> PDF Interno
          </button>
          <button onClick={() => generarPDFCliente(cotizacionActual, rate, currency)} style={btnSecStyle}>
            <Download size={14} /> PDF Cliente
          </button>
          <button onClick={handleGuardar} disabled={saving} style={{ ...btnPrimStyle, opacity: saving ? 0.6 : 1 }}>
            <Save size={14} /> {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
        {/* ─── Columna principal ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Datos del cliente */}
          <div style={cardStyle}>
            <h3 style={sectionTitle}>Datos del Cliente</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={labelStyle}>TÍTULO DEL PROYECTO *</label>
                <input value={form.titulo} onChange={e=>setF('titulo',e.target.value)}
                  placeholder="Ej. Sistema CCTV planta industrial"
                  style={input()} onFocus={focusBlue} onBlur={blurBorder}/>
              </div>
              {[
                ['cliente_nombre',  'NOMBRE / CONTACTO *',  'Juan Pérez'],
                ['cliente_empresa', 'EMPRESA',              'Empresa SA de CV'],
                ['cliente_rfc',     'RFC',                  'XAXX010101000'],
                ['cliente_contacto','CONTACTO DIRECTO',     'Ing. García'],
                ['cliente_email',   'CORREO',               'juan@empresa.com'],
                ['cliente_telefono','TELÉFONO',             '33 1234 5678'],
              ].map(([k,lbl,ph]) => (
                <div key={k}>
                  <label style={labelStyle}>{lbl}</label>
                  <input value={form[k]} onChange={e=>setF(k,e.target.value)}
                    placeholder={ph} type={k==='cliente_email'?'email':'text'}
                    style={input()} onFocus={focusBlue} onBlur={blurBorder}/>
                </div>
              ))}
              <div style={{ gridColumn:'1/-1' }}>
                <label style={labelStyle}>NOTAS / ALCANCE DEL PROYECTO</label>
                <textarea value={form.notas} onChange={e=>setF('notas',e.target.value)}
                  placeholder="Descripción, condiciones especiales, observaciones..."
                  rows={3} style={{ ...input(), resize:'vertical' }}
                  onFocus={focusBlue} onBlur={blurBorder}/>
              </div>
            </div>
          </div>

          {/* Buscador Syscom */}
          <div style={cardStyle}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <h3 style={sectionTitle}>Catálogo Syscom</h3>
              <span style={{ fontSize:10, padding:'2px 8px', borderRadius:20, background:'rgba(5,150,105,0.12)', color:'var(--success)', fontWeight:700 }}>
                ● LIVE
              </span>
            </div>
            <BuscadorSyscom onAgregar={handleAgregar} />
          </div>

          {/* Lista de ítems */}
          <div style={cardStyle}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <h3 style={sectionTitle}>Partidas ({items.length})</h3>
              <button onClick={() => setItems(prev => [...prev, {
                _id:Date.now(), syscom_id:null, sku:'', nombre:'Servicio/Material manual',
                descripcion:'', precio:0, costo:0, cantidad:1, marca:'', cat:'Manual', proveedor:'Manual', nota:'',
              }])} style={btnSecStyle}>
                <Plus size={12}/> Manual
              </button>
            </div>

            {items.length === 0 ? (
              <div style={{ textAlign:'center', padding:'32px 20px', color:'var(--text3)', background:'var(--bg3)', borderRadius:8, border:'2px dashed var(--border)' }}>
                <Package size={32} style={{ margin:'0 auto 10px', opacity:0.3 }}/>
                <div style={{ fontSize:13 }}>Busca productos en el catálogo o agrega partidas manuales</div>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {/* Header tabla */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 70px 100px 90px 80px 30px', gap:8, padding:'0 8px', fontSize:10, fontWeight:600, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.05em' }}>
                  <span>Descripción</span><span style={{textAlign:'center'}}>Cant.</span>
                  <span style={{textAlign:'right'}}>Precio ({currency})</span>
                  <span style={{textAlign:'right'}}>Costo</span>
                  <span style={{textAlign:'right'}}>Total</span>
                  <span/>
                </div>
                {items.map(item => {
                  const utilItem = (item.precio - (item.costo||0)) * item.cantidad
                  return (
                    <div key={item._id} style={{ display:'flex', flexDirection:'column', gap:6, padding:'10px 8px', background:'var(--bg3)', borderRadius:8, border:'1px solid var(--border)' }}>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 70px 100px 90px 80px 30px', gap:8, alignItems:'center' }}>
                        {/* Nombre */}
                        <div>
                          {item.syscom_id ? (
                            <div>
                              <div style={{ fontSize:12, fontWeight:600, color:'var(--text)', lineHeight:1.3 }}>{item.nombre}</div>
                              {item.sku && <div style={{ fontSize:10, color:'var(--text3)', marginTop:1 }}>SKU: {item.sku}</div>}
                            </div>
                          ) : (
                            <input value={item.nombre} onChange={e=>setItem(item._id,'nombre',e.target.value)}
                              style={{ ...input(), padding:'5px 8px', fontSize:12 }} onFocus={focusBlue} onBlur={blurBorder}/>
                          )}
                        </div>
                        {/* Cantidad */}
                        <input type="number" min={1} value={item.cantidad} onChange={e=>setItem(item._id,'cantidad',e.target.value)}
                          style={{ ...input({textAlign:'center',padding:'5px 4px'}), fontSize:13 }} onFocus={focusBlue} onBlur={blurBorder}/>
                        {/* Precio */}
                        <input type="number" min={0} step={0.01} value={item.precio} onChange={e=>setItem(item._id,'precio',e.target.value)}
                          style={{ ...input({textAlign:'right',padding:'5px 8px'}), fontSize:13, color:'var(--accent)' }} onFocus={focusBlue} onBlur={blurBorder}/>
                        {/* Costo */}
                        <input type="number" min={0} step={0.01} value={item.costo||''} placeholder="0.00" onChange={e=>setItem(item._id,'costo',e.target.value)}
                          style={{ ...input({textAlign:'right',padding:'5px 8px'}), fontSize:13, color:'var(--warning)' }} onFocus={focusBlue} onBlur={blurBorder}/>
                        {/* Total */}
                        <div style={{ textAlign:'right', fontSize:12, fontWeight:700, color:'var(--text)', fontFamily:'"Plus Jakarta Sans",sans-serif' }}>
                          {fmt(item.precio * item.cantidad)}
                        </div>
                        <button onClick={()=>removeItem(item._id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)', padding:2, display:'flex', transition:'color 0.15s' }}
                          onMouseEnter={e=>e.currentTarget.style.color='var(--danger)'}
                          onMouseLeave={e=>e.currentTarget.style.color='var(--text3)'}>
                          <Trash2 size={14}/>
                        </button>
                      </div>
                      {/* Fila de utilidad + nota interna */}
                      <div style={{ display:'flex', alignItems:'center', gap:12, paddingTop:6, borderTop:'1px solid var(--border)' }}>
                        <span style={{ fontSize:10, color: utilItem>=0?'var(--success)':'var(--danger)', fontWeight:700, whiteSpace:'nowrap' }}>
                          Util: {fmt(utilItem)}
                        </span>
                        <input
                          value={item.nota||''} onChange={e=>setItem(item._id,'nota',e.target.value)}
                          placeholder="📝 Nota interna (instalación, garantía…)"
                          style={{ ...input(), fontSize:10, flex:1, padding:'4px 8px', color:'var(--text2)' }}
                          onFocus={focusBlue} onBlur={blurBorder}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ─── Columna resumen ─── */}
        <div style={{ display:'flex', flexDirection:'column', gap:14, position:'sticky', top:20 }}>
          <div style={cardStyle}>
            <h3 style={{ ...sectionTitle, marginBottom:14 }}>Resumen</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:16 }}>
              <div>
                <label style={labelStyle}>DESCUENTO (%)</label>
                <input type="number" min={0} max={100} value={form.descuento}
                  onChange={e=>setF('descuento',Number(e.target.value))}
                  style={input()} onFocus={focusBlue} onBlur={blurBorder}/>
              </div>
              <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, color:'var(--text2)' }}>
                <input type="checkbox" checked={form.incluye_iva} onChange={e=>setF('incluye_iva',e.target.checked)}
                  style={{ accentColor:'var(--blue)', width:14, height:14 }}/>
                Incluir IVA (16%)
              </label>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
              {[
                ['Subtotal', totales.subtotalBruto],
                form.descuento > 0 && [`Descuento (${form.descuento}%)`, -totales.descuentoAmt],
                form.incluye_iva && ['IVA (16%)', totales.ivaAmt],
              ].filter(Boolean).map(([lbl,val]) => (
                <div key={lbl} style={{ display:'flex', justifyContent:'space-between', fontSize:13 }}>
                  <span style={{ color:'var(--text2)' }}>{lbl}</span>
                  <span style={{ color: val < 0 ? 'var(--danger)' : 'var(--text)', fontWeight:500 }}>
                    {val < 0 ? '-' : ''}{fmt(Math.abs(val))}
                  </span>
                </div>
              ))}
              {items.length > 0 && totales.margen && (
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, paddingTop:4, borderTop:'1px solid var(--border)' }}>
                  <span style={{ color:'var(--text3)' }}>Ganancia estimada</span>
                  <span style={{ color: totales.ganancia>=0?'var(--success)':'var(--danger)', fontWeight:600 }}>
                    {fmt(totales.ganancia)} ({totales.margen}%)
                  </span>
                </div>
              )}
              <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 12px', background:'var(--blue)', borderRadius:8, marginTop:4 }}>
                <span style={{ color:'#fff', fontWeight:700, fontFamily:'"Plus Jakarta Sans",sans-serif', fontSize:13 }}>TOTAL</span>
                <span style={{ color:'#fff', fontWeight:800, fontFamily:'"Plus Jakarta Sans",sans-serif', fontSize:16 }}>
                  {fmt(totales.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div style={cardStyle}>
            <div style={{ fontSize:10, color:'var(--text3)', fontWeight:600, marginBottom:10, textTransform:'uppercase', letterSpacing:'0.05em' }}>Acciones</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              <button onClick={handleGuardar} disabled={saving} style={{ ...btnPrimStyle, width:'100%', justifyContent:'center', opacity: saving?0.6:1 }}>
                <Save size={13}/> {saving ? 'Guardando…' : 'Guardar Cotización'}
              </button>
              <button onClick={() => generarPDFCliente(cotizacionActual, rate, currency)} style={{ ...btnSecStyle, width:'100%', justifyContent:'center' }}>
                <Download size={13}/> PDF Cliente
              </button>
              <button onClick={() => generarPDFInterno(cotizacionActual, rate)} style={{ ...btnSecStyle, width:'100%', justifyContent:'center' }}>
                <FileBarChart size={13}/> PDF Interno (con costos)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Estilos helpers
const cardStyle = { background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:20, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }
const sectionTitle = { fontSize:14, color:'var(--text)', fontFamily:'"Plus Jakarta Sans",sans-serif', margin:0 }
const labelStyle = { fontSize:10, color:'var(--text3)', display:'block', marginBottom:4, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' }
const btnPrimStyle = { display:'flex', alignItems:'center', gap:6, padding:'8px 14px', background:'var(--blue)', color:'#fff', border:'none', borderRadius:8, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }
const btnSecStyle = { display:'flex', alignItems:'center', gap:6, padding:'7px 12px', background:'var(--card)', border:'1.5px solid var(--border)', borderRadius:8, color:'var(--text2)', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }
const focusBlue = (e) => e.target.style.borderColor = 'var(--blue)'
const blurBorder = (e) => e.target.style.borderColor = 'var(--border)'
