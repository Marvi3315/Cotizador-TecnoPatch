// components/Sidebar.jsx
import { LayoutDashboard, FileText, Search, Zap, Sun, Moon, RefreshCw } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useFX } from '../context/FXContext'
import { formatMXN } from '../lib/fx'
import { useCotizaciones } from '../hooks/useCotizaciones'

const navItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'nueva',     icon: FileText,         label: 'Nueva Cotización' },
  { id: 'catalogo',  icon: Search,           label: 'Catálogo Syscom'  },
  { id: 'crm',       icon: Zap,              label: 'CRM / Historial'  },
]

export default function Sidebar({ activeTab, onTabChange }) {
  const { theme, toggleTheme } = useTheme()
  const { rate, currency, source, loading, toggleCurrency, forceRefresh } = useFX()
  const { metricas } = useCotizaciones()

  const isDark = theme === 'dark'
  const sidebarBg = isDark ? '#0f0f14' : '#1a1a2e'

  return (
    <aside style={{
      width: 220, minHeight: '100vh',
      background: sidebarBg,
      borderRight: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', flexDirection: 'column',
      position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100,
    }}>
      {/* Logo */}
      <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, background: '#e84545', borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <span style={{ color:'#fff', fontWeight:800, fontSize:18, fontFamily:'"Plus Jakarta Sans",sans-serif' }}>T</span>
          </div>
          <div>
            <div style={{ color:'#fff', fontFamily:'"Plus Jakarta Sans",sans-serif', fontWeight:700, fontSize:15, lineHeight:1 }}>TecnoPatch</div>
            <div style={{ color:'rgba(255,255,255,0.3)', fontSize:10, marginTop:2 }}>Cotizador Pro</div>
          </div>
        </div>
      </div>

      {/* Resumen rápido */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 4 }}>
          Cotizaciones
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            ['Total', metricas?.total || 0, 'rgba(255,255,255,0.6)'],
            ['Pend.', metricas?.pendientes || 0, '#f59e0b'],
            ['Acept.', metricas?.aceptadas || 0, '#10b981'],
          ].map(([label, val, color]) => (
            <div key={label} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color, fontFamily: '"Plus Jakarta Sans",sans-serif', lineHeight: 1 }}>{val}</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Barra FX USD/MXN */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6 }}>
          Tipo de cambio
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Toggle MXN/USD */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.07)', borderRadius: 8, overflow: 'hidden', flex: 1 }}>
            {['MXN', 'USD'].map(cur => (
              <button
                key={cur}
                onClick={toggleCurrency}
                style={{
                  flex: 1, padding: '5px 0', border: 'none', cursor: 'pointer',
                  background: currency === cur ? '#e84545' : 'transparent',
                  color: currency === cur ? '#fff' : 'rgba(255,255,255,0.4)',
                  fontSize: 11, fontWeight: 700,
                  fontFamily: '"Plus Jakarta Sans",sans-serif',
                  transition: 'all 0.15s',
                }}
              >
                {cur}
              </button>
            ))}
          </div>

          {/* Rate + refresh */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700, fontFamily: '"Plus Jakarta Sans",sans-serif' }}>
              {loading ? '...' : `$${rate.toFixed(2)}`}
            </span>
            <button
              onClick={forceRefresh}
              title="Actualizar tipo de cambio"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 2, display: 'flex' }}
            >
              <RefreshCw size={11} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
            </button>
          </div>
        </div>

        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 4 }}>
          {source === 'syscom' ? '● Syscom live' :
           source === 'cache'  ? '● Caché' :
           source === 'fallback' ? '⚠ Fallback' : '● Cargando...'}
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems.map(({ id, icon: Icon, label }) => {
          const active = activeTab === id
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: active ? '#e84545' : 'transparent',
                color: active ? '#fff' : 'rgba(255,255,255,0.45)',
                fontSize: 13, fontFamily: "'DM Sans',sans-serif",
                fontWeight: active ? 600 : 400,
                transition: 'all 0.15s', textAlign: 'left',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)' }}}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)' }}}
            >
              <Icon size={15} />
              {label}
            </button>
          )
        })}
      </nav>

      {/* Tema toggle */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <button
          onClick={toggleTheme}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: 'rgba(255,255,255,0.04)',
            color: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: "'DM Sans',sans-serif",
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }}
        >
          {theme === 'dark' ? <Sun size={13}/> : <Moon size={13}/>}
          {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
    </aside>
  )
}
