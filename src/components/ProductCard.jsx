// components/ProductCard.jsx
import { useState } from 'react'
import { ShoppingCart, Package, Check } from 'lucide-react'
import { useFX } from '../context/FXContext'
import { formatMXN, formatUSD, toUSD } from '../lib/fx'

export default function ProductCard({ producto, onAgregar, onVerDetalle }) {
  const { rate, currency } = useFX()
  const [agregado, setAgregado] = useState(false)

  const {
    nombre, marca, sku, imagen, stock,
    precio, precioLista, precioEspecial, costo, cat,
  } = producto

  const fmt = (mxn) => currency === 'USD'
    ? formatUSD(toUSD(mxn, rate))
    : formatMXN(mxn)

  const handleAgregar = (e) => {
    e.stopPropagation()
    onAgregar(producto)
    setAgregado(true)
    setTimeout(() => setAgregado(false), 1800)
  }

  const hayPrecioLista = precioLista > 0 && precioEspecial > 0 && precioLista > precio
  const hayStock = stock !== null

  return (
    <div
      onClick={() => onVerDetalle(producto)}
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.1s',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--blue)'
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.12)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Imagen */}
      <div style={{
        width: '100%', height: 160,
        background: 'var(--bg3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', position: 'relative', flexShrink: 0,
      }}>
        {imagen ? (
          <img
            src={imagen}
            alt={nombre}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 12 }}
            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
          />
        ) : null}
        <div style={{
          display: imagen ? 'none' : 'flex',
          alignItems: 'center', justifyContent: 'center',
          width: '100%', height: '100%',
          color: 'var(--text3)', fontSize: 36,
        }}>
          <Package size={36} />
        </div>

        {/* Stock badge */}
        {hayStock && (
          <div style={{
            position: 'absolute', top: 8, right: 8,
            padding: '3px 8px', borderRadius: 99,
            fontSize: 10, fontWeight: 700,
            background: stock > 0 ? 'rgba(5,150,105,0.9)' : 'rgba(220,38,38,0.85)',
            color: '#fff',
            backdropFilter: 'blur(4px)',
          }}>
            {stock > 0 ? `${stock > 500 ? '500+' : stock} en stock` : 'Sin stock'}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '12px 12px 10px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* Cat + marca/modelo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--accent)' }}>
            {cat}
          </span>
        </div>

        {marca || sku ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {marca && (
              <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text)', fontFamily: '"Plus Jakarta Sans",sans-serif' }}>
                {marca}
              </span>
            )}
            {sku && (
              <span style={{
                fontSize: 10, color: 'var(--text2)',
                background: 'var(--bg3)', border: '1px solid var(--border)',
                borderRadius: 4, padding: '1px 5px',
                fontFamily: 'monospace',
              }}>
                {sku}
              </span>
            )}
          </div>
        ) : null}

        {/* Nombre */}
        <div style={{
          fontSize: 12, fontWeight: 600, color: 'var(--text)',
          lineHeight: 1.35, flex: 1,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {nombre}
        </div>

        {/* Precios */}
        <div style={{ marginTop: 4 }}>
          {/* Precio lista tachado */}
          {hayPrecioLista && (
            <div style={{ fontSize: 11, color: 'var(--text3)', textDecoration: 'line-through', marginBottom: 2 }}>
              Lista: {fmt(precioLista)}
            </div>
          )}
          {/* Precio principal */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text2)' }}>{currency}</span>
                <span style={{
                  fontSize: 20, fontWeight: 900, color: 'var(--text)',
                  fontFamily: '"Plus Jakarta Sans",sans-serif', lineHeight: 1,
                }}>
                  {currency === 'USD'
                    ? formatUSD(toUSD(precio, rate)).replace('US$', '').replace('USD', '').trim()
                    : formatMXN(precio).replace('MX$', '').replace('$', '').trim()
                  }
                </span>
              </div>
              <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 1 }}>IVA incluido</div>

              {/* Precio especial (costo distribuidor) */}
              {precioEspecial > 0 && (
                <div style={{ fontSize: 10, color: 'var(--success)', fontWeight: 700, marginTop: 2 }}>
                  Precio especial: {fmt(precioEspecial)}
                </div>
              )}
            </div>

            {/* Botón agregar */}
            <button
              onClick={handleAgregar}
              title="Agregar a cotización"
              style={{
                width: 36, height: 36, borderRadius: 8, border: 'none',
                background: agregado ? 'var(--success)' : 'var(--blue)',
                color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
              }}
            >
              {agregado ? <Check size={16} /> : <ShoppingCart size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
