// components/ProductModal.jsx
import { useState, useEffect } from 'react'
import { X, ShoppingCart, Copy, Check, Package } from 'lucide-react'
import { useFX } from '../context/FXContext'
import { formatMXN, formatUSD, toUSD } from '../lib/fx'

export default function ProductModal({ producto, onCerrar, onAgregar }) {
  const { rate, currency } = useFX()
  const [qty, setQty] = useState(1)
  const [copiado, setCopiado] = useState(false)
  const [agregado, setAgregado] = useState(false)

  useEffect(() => {
    setQty(1)
    setCopiado(false)
    setAgregado(false)
  }, [producto?.id])

  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onCerrar()
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onCerrar])

  if (!producto) return null

  const { nombre, marca, sku, imagen, stock, precio, precioLista, precioEspecial, costo, cat, descripcion, _raw = {} } = producto

  const fmt = (mxn) => currency === 'USD' ? formatUSD(toUSD(mxn, rate)) : formatMXN(mxn)

  const hayPrecioLista = precioLista > 0 && precioEspecial > 0 && precioLista > precio
  const hayStock = stock !== null

  const copiarSKU = () => {
    navigator.clipboard.writeText(sku || '')
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const handleAgregar = () => {
    onAgregar({ ...producto, _qty: qty })
    setAgregado(true)
    setTimeout(() => { setAgregado(false); onCerrar() }, 1200)
  }

  // Especificaciones desde _raw
  const SPEC_FIELDS = [
    ['Garantía', 'garantia'], ['Peso', 'peso'], ['Dimensiones', 'dimensiones'],
    ['Color', 'color'], ['Voltaje', 'voltaje'], ['Resolución', 'resolucion'],
    ['Conectividad', 'conectividad'], ['Material', 'material'],
    ['Capacidad', 'capacidad'], ['Velocidad', 'velocidad'],
  ]
  const specs = SPEC_FIELDS.filter(([, k]) => _raw[k])

  // Descripción larga
  const descLarga = _raw.descripcion || _raw.descripcion_larga || descripcion || ''

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onCerrar}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          zIndex: 9000, backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16,
          animation: 'fadeIn 0.15s ease',
        }}
      >
        {/* Modal */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 18, width: '100%', maxWidth: 700,
            maxHeight: '90vh', display: 'flex', flexDirection: 'column',
            overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.32)',
            animation: 'slideUp 0.2s ease',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '14px 18px', borderBottom: '1px solid var(--border)', flexShrink: 0,
          }}>
            <h2 style={{
              flex: 1, fontSize: 14, fontWeight: 700, color: 'var(--text)',
              fontFamily: '"Plus Jakarta Sans",sans-serif', margin: 0,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {nombre}
            </h2>
            <button onClick={onCerrar} style={{
              width: 30, height: 30, borderRadius: '50%', border: 'none',
              background: 'var(--bg3)', color: 'var(--text2)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div style={{ display: 'flex', overflow: 'hidden', flex: 1 }}>
            {/* Columna izquierda: imagen + precios */}
            <div style={{
              width: 260, flexShrink: 0, padding: 20,
              borderRight: '1px solid var(--border)',
              display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto',
            }}>
              {/* Imagen grande */}
              <div style={{
                width: '100%', aspectRatio: '1', borderRadius: 10, overflow: 'hidden',
                background: 'var(--bg3)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {imagen ? (
                  <img src={imagen} alt={nombre}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 16 }}
                    onError={e => { e.target.style.display = 'none' }}
                  />
                ) : (
                  <Package size={52} style={{ opacity: 0.2 }} />
                )}
              </div>

              {/* Box de precios */}
              <div style={{
                background: 'var(--bg3)', border: '1px solid var(--border)',
                borderRadius: 10, padding: 14,
                display: 'flex', flexDirection: 'column', gap: 6,
              }}>
                {/* Precio lista tachado */}
                {hayPrecioLista && (
                  <div style={{ fontSize: 11, color: 'var(--text3)', textDecoration: 'line-through' }}>
                    Lista: {fmt(precioLista)}
                  </div>
                )}
                {/* Precio principal */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 500 }}>{currency}</span>
                  <span style={{ fontSize: 28, fontWeight: 900, color: 'var(--text)', fontFamily: '"Plus Jakarta Sans",sans-serif', lineHeight: 1 }}>
                    {currency === 'USD'
                      ? formatUSD(toUSD(precio, rate)).replace('US$','').replace('USD','').trim()
                      : formatMXN(precio).replace('MX$','').replace('$','').trim()
                    }
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text3)' }}>IVA inc.</span>
                </div>
                {/* Precio especial */}
                {precioEspecial > 0 && (
                  <div style={{ fontSize: 12, color: 'var(--success)', fontWeight: 700 }}>
                    {precioEspecial > 0 ? `Precio especial: ${fmt(precioEspecial)}` : ''}
                  </div>
                )}
              </div>

              {/* Stock */}
              {hayStock && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
                  fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 99,
                  background: stock > 0 ? 'rgba(5,150,105,0.12)' : 'rgba(220,38,38,0.1)',
                  color: stock > 0 ? 'var(--success)' : 'var(--danger)',
                  border: `1px solid ${stock > 0 ? 'rgba(5,150,105,0.3)' : 'rgba(220,38,38,0.2)'}`,
                }}>
                  {stock > 0 ? `✓ ${stock > 500 ? '500+' : stock} en stock` : '✗ Sin stock'}
                </span>
              )}
            </div>

            {/* Columna derecha: info */}
            <div style={{ flex: 1, padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Meta: cat, marca, SKU */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {cat && (
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--blue)' }}>
                    {cat}
                  </div>
                )}
                {marca && (
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', fontFamily: '"Plus Jakarta Sans",sans-serif' }}>
                    {marca}
                  </div>
                )}
                {sku && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      onClick={copiarSKU}
                      title="Clic para copiar SKU"
                      style={{
                        fontSize: 11, color: 'var(--text2)', background: 'var(--bg3)',
                        border: '1px solid var(--border)', borderRadius: 4, padding: '3px 8px',
                        fontFamily: 'monospace', cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { e.target.style.background = 'var(--blue)'; e.target.style.color = '#fff' }}
                      onMouseLeave={e => { e.target.style.background = 'var(--bg3)'; e.target.style.color = 'var(--text2)' }}
                    >
                      {copiado ? '✓ Copiado' : `📋 ${sku}`}
                    </span>
                    <span style={{ fontSize: 9, color: 'var(--text3)' }}>clic para copiar</span>
                  </div>
                )}
              </div>

              {/* Descripción */}
              {descLarga && (
                <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6, margin: 0 }}>
                  {descLarga}
                </p>
              )}

              {/* Especificaciones */}
              {specs.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--blue)', marginBottom: 6, fontFamily: '"Plus Jakarta Sans",sans-serif' }}>
                    Especificaciones
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {specs.map(([label, key]) => (
                      <div key={key} style={{ display: 'flex', gap: 8, fontSize: 11, padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ color: 'var(--text2)', flexShrink: 0, width: 100 }}>{label}</span>
                        <span style={{ color: 'var(--text)', fontWeight: 500, wordBreak: 'break-word' }}>{_raw[key]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer: cantidad + agregar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '14px 18px', borderTop: '1px solid var(--border)', flexShrink: 0,
          }}>
            {/* Control de cantidad */}
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{
                width: 36, height: 36, border: 'none', background: 'var(--bg3)',
                color: 'var(--text)', fontSize: 18, cursor: 'pointer', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>−</button>
              <div style={{
                width: 40, textAlign: 'center', fontSize: 14, fontWeight: 700,
                color: 'var(--text)', fontFamily: '"Plus Jakarta Sans",sans-serif',
                background: 'var(--bg2)', padding: '0 4px', lineHeight: '36px',
                borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)',
              }}>{qty}</div>
              <button onClick={() => setQty(q => q + 1)} style={{
                width: 36, height: 36, border: 'none', background: 'var(--bg3)',
                color: 'var(--text)', fontSize: 18, cursor: 'pointer', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>+</button>
            </div>

            <button onClick={handleAgregar} style={{
              flex: 1, padding: '10px', borderRadius: 10, border: 'none',
              background: agregado ? 'var(--success)' : 'var(--blue)',
              color: '#fff', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', fontFamily: '"Plus Jakarta Sans",sans-serif',
              transition: 'background 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              {agregado ? <><Check size={16} /> ¡Agregado!</> : <><ShoppingCart size={16} /> Agregar a cotización</>}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  )
}
