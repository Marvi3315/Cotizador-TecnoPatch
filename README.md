# TecnoPatch Cotizador Pro 🔴

Cotizador profesional unificado con catálogo Syscom en tiempo real.
**Stack:** React 19 + Vite + Tailwind + Supabase + Netlify Functions

---

## 🚀 Deploy en 4 pasos

### 1. Variables de entorno

Copia `.env.example` a `.env.local`:
```bash
cp .env.example .env.local
# Llena VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
```

### 2. Tabla en Supabase

Ejecuta `supabase/schema.sql` en **Supabase > SQL Editor**.

### 3. Variables en Netlify

En **Netlify > Site Settings > Environment Variables** agrega:
- `SYSCOM_CLIENT_ID` → tu Client ID de Syscom
- `SYSCOM_CLIENT_SECRET` → tu Client Secret de Syscom
- `VITE_SUPABASE_URL` → URL de tu proyecto Supabase
- `VITE_SUPABASE_ANON_KEY` → Anon key de Supabase

### 4. Deploy

```bash
npm install
npm run build
# Arrastra /dist a Netlify, o conecta el repo para CI/CD
```

---

## 📁 Estructura

```
src/
├── components/
│   ├── Sidebar.jsx          # Nav + barra FX USD/MXN + métricas
│   ├── Dashboard.jsx        # KPIs + cotizaciones recientes
│   ├── NuevaCotizacion.jsx  # Form + buscador + tabla de ítems + costo/utilidad
│   ├── BuscadorSyscom.jsx   # Búsqueda con tarjetas estilo Syscom
│   ├── ProductCard.jsx      # Tarjeta: imagen, precio lista/especial, stock
│   ├── ProductModal.jsx     # Modal detalle igual que syscom.mx
│   └── CRM.jsx              # Historial + cambio de estatus + PDF
├── hooks/
│   ├── useSyscom.js         # Búsqueda, categorías, paginación
│   └── useCotizaciones.js   # CRUD Supabase + métricas
├── lib/
│   ├── fx.js                # USD/MXN desde Syscom + formatos
│   ├── pdf.js               # PDF cliente (azul profesional) + PDF interno
│   └── supabase.js          # Cliente + normalizador de productos
├── context/
│   ├── ThemeContext.jsx      # Dark/light toggle
│   └── FXContext.jsx         # Tipo de cambio global
functions/
└── syscom.js                # Netlify Function proxy (credenciales seguras)
supabase/
└── schema.sql               # DDL tabla cotizaciones
```

---

## 💡 Características

- **Catálogo Syscom live** — búsqueda por keyword + filtros por categoría
- **Tarjetas estilo Syscom** — imagen, marca, modelo, precio lista tachado, precio especial, stock
- **Modal de detalle** — igual a la página del producto en syscom.mx
- **Conversión USD/MXN automática** — tipo de cambio desde Syscom, toggle en sidebar
- **PDF cliente** — formato profesional azul oscuro TecnoPatch con anticipo 60%
- **PDF interno** — costos, utilidades y margen por ítem (solo para ti)
- **CRM** — historial con cambio de estatus inline, búsqueda, filtros
- **Dark/light mode** — persistido en localStorage
