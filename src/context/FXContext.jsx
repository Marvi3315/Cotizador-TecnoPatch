// context/FXContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { getFXRate } from '../lib/fx'

const FXContext = createContext()

export function FXProvider({ children }) {
  const [rate, setRate]         = useState(17.50)
  const [currency, setCurrency] = useState(() => localStorage.getItem('tp_currency') || 'MXN')
  const [source, setSource]     = useState('loading')
  const [loading, setLoading]   = useState(true)
  const [ts, setTs]             = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const result = await getFXRate()
      if (!cancelled) {
        setRate(result.rate)
        setSource(result.source)
        setTs(result.ts)
        setLoading(false)
      }
    }
    load()
    // Refrescar cada 3 horas
    const interval = setInterval(load, 3 * 60 * 60 * 1000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  const toggleCurrency = () => {
    const next = currency === 'MXN' ? 'USD' : 'MXN'
    setCurrency(next)
    localStorage.setItem('tp_currency', next)
  }

  const forceRefresh = async () => {
    localStorage.removeItem('tp_fx_rate')
    setLoading(true)
    const result = await getFXRate()
    setRate(result.rate)
    setSource(result.source)
    setTs(result.ts)
    setLoading(false)
  }

  return (
    <FXContext.Provider value={{ rate, currency, source, loading, ts, toggleCurrency, forceRefresh }}>
      {children}
    </FXContext.Provider>
  )
}

export const useFX = () => useContext(FXContext)
