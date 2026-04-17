// components/BuscadorSyscom.jsx
import { useState } from 'react'
import { Search, X, Loader2, AlertCircle, ChevronDown } from 'lucide-react'
import { useSyscom } from '../hooks/useSyscom'
import ProductCard from './ProductCard'
import ProductModal from './ProductModal'

const inputStyle = {
  width: '100%', padding: '10px 40px 10px 38px',
  background: 'var(--bg2)', border: '1.5px solid var(--border)',
  borderRadius: 10, color: 'var(--text)', fontSize: 13,
  fontFamily: "'DM Sans',sans-serif", outline: 'none',
  transition: 'border-color 0.15s',
}

export default function BuscadorSyscom({ onAgregar, standalone = false }) {
  const {
    productos, categorias, loading, error,
    total, query, catActiva,
    buscar, filtrarCategoria, cargarMas, limpiar, hayMas,
  } = useSyscom()

  const [modalProducto, setModalProducto] = useState(null)
  const [inputVal, setInputVal] = useState('')

  const handleSearch = (val) => {
    setInputVal(val)
    buscar(val)
  }

  const handleLimpiar = () => {
    setInputVal('')
    limpiar()
  }

  const handleAgregarDesdeModal = (producto) => {
    onAgregar({ ...producto, cantidad: producto._qty || 1 })
    setModalProducto(null)
  }

  const handleAgregarDirecto = (producto) => {
    onAgregar({ ...producto, cantidad: 1 })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Buscador */}
      <div style={{ position: 'relative' }}>
        <Search size={15} style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--text3)', pointerEvents: 'none',
        }} />
        <input
          value={inputVal}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Buscar en catálogo Syscom… (Hikvision, Ubiquiti, fibra, switch…)"
          style={inputStyle}
          onFocus={e => e.target.style.borderColor = 'var(--blue)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
        {loading && (
          <Loader2 size={14} style={{
            position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--blue)', animation: 'spin 0.8s linear infinite',
          }} />
        )}
        {inputVal && !loading && (
          <button onClick={handleLimpiar} style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)',
            display: 'flex', padding: 2,
          }}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* Tabs de categorías */}
      {categorias.length > 0 && (
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, flexWrap: 'nowrap' }}>
          {[{ id: '', nombre: 'Todos' }, ...categorias].map(cat => (
            <button
              key={cat.id}
              onClick={() => filtrarCategoria(cat.id)}
              style={{
                padding: '5px 12px', borderRadius: 20, flexShrink: 0, border: '1px solid var(--border)',
                background: catActiva === cat.id ? 'var(--blue)' : 'var(--card)',
                color: catActiva === cat.id ? '#fff' : 'var(--text2)',
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
                fontFamily: '"Plus Jakarta Sans",sans-serif',
                transition: 'all 0.15s', whiteSpace: 'nowrap',
              }}
            >
              {cat.nombre}
            </button>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
          background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.3)',
          borderRadius: 8, color: 'var(--danger)', fontSize: 12,
        }}>
          <AlertCircle size={14} />
          {error}
          <button onClick={() => buscar(query)} style={{ marginLeft: 'auto', background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontSize: 11 }}>
            Reintentar
          </button>
        </div>
      )}

      {/* Contador de resultados */}
      {productos.length > 0 && (
        <div style={{ fontSize: 11, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
          Mostrando {productos.length} de {total.toLocaleString('es-MX')} productos
        </div>
      )}

      {/* Grid de productos */}
      {productos.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: standalone
            ? 'repeat(auto-fill, minmax(220px, 1fr))'
            : 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 12,
        }}>
          {productos.map(p => (
            <ProductCard
              key={p.id}
              producto={p}
              onAgregar={handleAgregarDirecto}
              onVerDetalle={setModalProducto}
            />
          ))}
        </div>
      )}

      {/* Cargar más */}
      {hayMas && !loading && (
        <button onClick={cargarMas} style={{
          padding: '10px', borderRadius: 10, border: '1px solid var(--border)',
          background: 'var(--card)', color: 'var(--text2)', cursor: 'pointer',
          fontSize: 13, fontWeight: 600, fontFamily: '"Plus Jakarta Sans",sans-serif',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.color = 'var(--text)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text2)' }}
        >
          <ChevronDown size={14} /> Cargar más productos
        </button>
      )}

      {/* Skeleton loading */}
      {loading && productos.length === 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {Array(8).fill(0).map((_, i) => (
            <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              <div className="skeleton" style={{ height: 160, borderRadius: 0 }} />
              <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="skeleton" style={{ height: 10, width: '60%' }} />
                <div className="skeleton" style={{ height: 14, width: '90%' }} />
                <div className="skeleton" style={{ height: 10, width: '75%' }} />
                <div className="skeleton" style={{ height: 20, width: '50%', marginTop: 4 }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Estado vacío */}
      {!loading && !error && productos.length === 0 && (query.length >= 2 || catActiva) && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text3)' }}>
          <div style={{ fontSize: 40, marginBottom: 10, opacity: 0.3 }}>🔍</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text2)', marginBottom: 4 }}>Sin resultados</div>
          <div style={{ fontSize: 12 }}>Intenta otra búsqueda o categoría</div>
        </div>
      )}

      {/* Modal de detalle */}
      {modalProducto && (
        <ProductModal
          producto={modalProducto}
          onCerrar={() => setModalProducto(null)}
          onAgregar={handleAgregarDesdeModal}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
