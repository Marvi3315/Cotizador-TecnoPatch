import { useState } from 'react'
import { ThemeProvider } from './context/ThemeContext'
import { FXProvider } from './context/FXContext'
import { useCotizaciones } from './hooks/useCotizaciones'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import NuevaCotizacion from './components/NuevaCotizacion'
import BuscadorSyscom from './components/BuscadorSyscom'
import CRM from './components/CRM'
import './index.css'

function AppInner() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const { cotizaciones, loading, metricas, guardarCotizacion, actualizarEstatus, eliminarCotizacion, fetchCotizaciones } = useCotizaciones()

  const handleGuardar = async (cotizacion) => {
    await guardarCotizacion(cotizacion)
    setActiveTab('crm')
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard metricas={metricas} cotizaciones={cotizaciones} onTabChange={setActiveTab}/>
      case 'nueva':
        return <NuevaCotizacion onGuardar={handleGuardar}/>
      case 'catalogo':
        return (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 22, color: 'var(--text)', fontFamily: '"Plus Jakarta Sans",sans-serif', marginBottom: 4 }}>
                Catálogo Syscom
              </h2>
              <p style={{ color: 'var(--text2)', fontSize: 13 }}>Precios y stock en tiempo real</p>
            </div>
            <BuscadorSyscom onAgregar={() => setActiveTab('nueva')} standalone />
          </div>
        )
      case 'crm':
        return <CRM cotizaciones={cotizaciones} loading={loading} onActualizarEstatus={actualizarEstatus} onEliminar={eliminarCotizacion} onRefresh={fetchCotizaciones}/>
      default:
        return null
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab}/>
      <main style={{ marginLeft: 220, flex: 1, padding: '24px 28px', minHeight: '100vh', background: 'var(--bg)', maxWidth: 'calc(100vw - 220px)', overflowY: 'auto' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }} className="animate-fade-in" key={activeTab}>
          {renderContent()}
        </div>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <FXProvider>
        <AppInner />
      </FXProvider>
    </ThemeProvider>
  )
}
