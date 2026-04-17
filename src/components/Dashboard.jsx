import { FileText, CheckCircle, Clock, Send, DollarSign } from 'lucide-react'
import { ESTATUS_LABELS } from '../hooks/useCotizaciones'
import { useFX } from '../context/FXContext'
import { formatMXN, formatUSD, toUSD } from '../lib/fx'
import { formatDateShort } from '../lib/pdf'

function MetricCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:18, display:'flex', gap:14, alignItems:'center', boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
      <div style={{ width:44, height:44, borderRadius:10, background:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <Icon size={20} style={{ color }}/>
      </div>
      <div>
        <div style={{ fontSize:22, fontWeight:800, fontFamily:'"Plus Jakarta Sans",sans-serif', color:'var(--text)', lineHeight:1 }}>{value}</div>
        <div style={{ fontSize:12, color:'var(--text2)', marginTop:2 }}>{label}</div>
      </div>
    </div>
  )
}

export default function Dashboard({ metricas, cotizaciones, onTabChange }) {
  const { rate, currency } = useFX()
  const fmt = (mxn) => currency === 'USD' ? formatUSD(toUSD(mxn, rate)) : formatMXN(mxn)
  const recientes = cotizaciones.slice(0, 7)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
      <div>
        <h2 style={{ fontSize:24, color:'var(--text)', fontFamily:'"Plus Jakarta Sans",sans-serif', marginBottom:4 }}>Bienvenido, Moisés 👋</h2>
        <p style={{ color:'var(--text2)', fontSize:13 }}>Resumen de cotizaciones TecnoPatch</p>
      </div>

      {/* Métricas */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(190px, 1fr))', gap:12 }}>
        <MetricCard icon={FileText}      label="Total"        value={metricas.total}     color="#3b82f6" bg="rgba(59,130,246,0.12)"/>
        <MetricCard icon={Clock}         label="Pendientes"   value={metricas.pendientes} color="#f59e0b" bg="rgba(245,158,11,0.12)"/>
        <MetricCard icon={Send}          label="Enviadas"     value={metricas.enviadas}  color="#3b82f6" bg="rgba(59,130,246,0.12)"/>
        <MetricCard icon={CheckCircle}   label="Aceptadas"    value={metricas.aceptadas} color="#10b981" bg="rgba(16,185,129,0.12)"/>
        <MetricCard icon={DollarSign}    label="Valor aceptado" value={fmt(metricas.valorTotal)} color="#e84545" bg="rgba(232,69,69,0.12)"/>
      </div>

      {/* Acciones rápidas */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
        {[
          ['Nueva Cotización', 'nueva', true],
          ['Catálogo Syscom',  'catalogo', false],
          ['Ver CRM',          'crm', false],
        ].map(([label, tab, primary]) => (
          <button key={tab} onClick={() => onTabChange(tab)} style={{
            padding:'10px 18px', borderRadius:10, cursor:'pointer', fontSize:13, fontWeight:600,
            fontFamily:'"Plus Jakarta Sans",sans-serif', transition:'all 0.15s',
            background: primary ? 'var(--blue)' : 'var(--card)',
            color: primary ? '#fff' : 'var(--text)',
            border: primary ? 'none' : '1.5px solid var(--border)',
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* Cotizaciones recientes */}
      <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:20, boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <h3 style={{ fontSize:15, color:'var(--text)', fontFamily:'"Plus Jakarta Sans",sans-serif' }}>Cotizaciones Recientes</h3>
          <button onClick={() => onTabChange('crm')} style={{ fontSize:12, color:'var(--blue)', background:'none', border:'none', cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>
            Ver todas →
          </button>
        </div>

        {recientes.length === 0 ? (
          <div style={{ textAlign:'center', padding:'32px 20px', color:'var(--text3)' }}>
            <FileText size={36} style={{ margin:'0 auto 10px', opacity:0.3 }}/>
            <div style={{ fontSize:13 }}>Crea tu primera cotización</div>
          </div>
        ) : (
          recientes.map((c, i) => {
            const est = ESTATUS_LABELS[c.estatus] || ESTATUS_LABELS.pendiente
            return (
              <div key={c.id} style={{ display:'grid', gridTemplateColumns:'100px 1fr 130px 100px 90px', gap:12, alignItems:'center', padding:'11px 6px', borderBottom: i<recientes.length-1?'1px solid var(--border)':'none' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--blue)', fontFamily:'"Plus Jakarta Sans",sans-serif' }}>{c.folio}</div>
                <div>
                  <div style={{ fontSize:13, fontWeight:500, color:'var(--text)' }}>{c.titulo||'Sin título'}</div>
                  <div style={{ fontSize:11, color:'var(--text3)', marginTop:1 }}>{c.cliente_nombre}</div>
                </div>
                <div style={{ fontSize:12, color:'var(--text2)' }}>{c.cliente_empresa||'—'}</div>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', fontFamily:'"Plus Jakarta Sans",sans-serif' }}>{fmt(c.total)}</div>
                <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:20, fontSize:10, fontWeight:700, background:est.bg, color:est.color }}>
                  {est.label}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
