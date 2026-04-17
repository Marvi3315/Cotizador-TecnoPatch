const https = require('https');

let cachedToken = null;
let tokenExpiry = 0;
let cachedTipoCambio = null;

async function fetchJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };
    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch(e) { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function getToken() {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  const CLIENT_ID     = process.env.SYSCOM_CLIENT_ID;
  const CLIENT_SECRET = process.env.SYSCOM_CLIENT_SECRET;
  if (!CLIENT_ID || !CLIENT_SECRET) throw new Error('Credenciales Syscom no configuradas');
  const body = `client_id=${encodeURIComponent(CLIENT_ID)}&client_secret=${encodeURIComponent(CLIENT_SECRET)}&grant_type=client_credentials`;
  const urlObj = new URL('https://developers.syscom.mx/oauth/token');
  const res = await new Promise((resolve, reject) => {
    const req = https.request({
      hostname: urlObj.hostname, path: urlObj.pathname, method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) }
    }, (r) => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => {
        try { resolve({ status: r.statusCode, body: JSON.parse(d) }); }
        catch(e) { resolve({ status: r.statusCode, body: d }); }
      });
    });
    req.on('error', reject);
    req.write(body); req.end();
  });
  if (res.status !== 200 || !res.body.access_token)
    throw new Error(`Error token Syscom ${res.status}: ${JSON.stringify(res.body)}`);
  cachedToken = res.body.access_token;
  tokenExpiry = Date.now() + (23 * 60 * 60 * 1000);
  return cachedToken;
}

// Normaliza precios: devuelve siempre MXN correctos
// Estructura real de Syscom:
//   precio_lista     → MXN (precio público sugerido, ya convertido)
//   precio_especial  → MXN (precio distribuidor, ya convertido)
//   precio_descuento → USD (precio promocional al público, hay que convertir)
//   tipo_cambio      → TC que usó Syscom para convertir (viene en el producto)
function normalizarPrecios(p) {
  const parse = (v) => parseFloat(String(v || '0').replace(/,/g, '')) || 0;

  const precioListaMXN    = parse(p.precio_lista);     // Ya en MXN
  const precioEspecialMXN = parse(p.precio_especial);  // Ya en MXN (costo distribuidor)
  const precioDescUSD     = parse(p.precio_descuento); // En USD — hay que convertir
  const tipoCambio        = parse(p.tipo_cambio);      // TC de Syscom

  // Guardar tipo_cambio cuando esté disponible
  if (tipoCambio > 10) cachedTipoCambio = tipoCambio;
  const tc = tipoCambio > 10 ? tipoCambio : (cachedTipoCambio || 17.0);

  // precio_descuento en MXN = precio_descuento(USD) × tipo_cambio
  const precioDescMXN = precioDescUSD > 0 ? precioDescUSD * tc : 0;

  // Precio final al cliente:
  // Si hay precio_descuento válido (con descuento promocional) → usarlo
  // Sino usar precio_lista directamente (ya en MXN)
  const precioCliente = precioDescMXN > 0 ? precioDescMXN : precioListaMXN;

  // Precio lista para tachar (solo si precio cliente tiene descuento)
  const precioListaMostrar = (precioListaMXN > 0 && precioListaMXN > precioCliente)
    ? precioListaMXN : 0;

  return {
    precio_cliente_mxn:   Math.round(precioCliente * 100) / 100,
    precio_lista_mxn:     precioListaMXN,
    precio_especial_mxn:  precioEspecialMXN,
    precio_descuento_usd: precioDescUSD,
    precio_lista_tachar:  precioListaMostrar,
    tipo_cambio:          tc,
    // Conservar campos originales para debug
    _precio_lista_raw:    p.precio_lista,
    _precio_especial_raw: p.precio_especial,
    _precio_descuento_raw: p.precio_descuento,
  };
}

function enriquecerProducto(p) {
  const precios = normalizarPrecios(p);
  return {
    ...p,
    _precios: precios,
    // Inyectar campos normalizados directamente para facilitar el frontend
    precio_cliente_mxn:  precios.precio_cliente_mxn,
    precio_lista_mxn:    precios.precio_lista_mxn,
    precio_especial_mxn: precios.precio_especial_mxn,
    precio_lista_tachar: precios.precio_lista_tachar,
    tipo_cambio:         precios.tipo_cambio,
  };
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };

  const params = event.queryStringParameters || {};
  const action = params.action || 'search';

  try {
    const token = await getToken();
    const authHeaders = { Authorization: `Bearer ${token}` };
    let url = '';

    switch (action) {
      case 'categorias':
        url = 'https://developers.syscom.mx/api/v1/categorias';
        break;

      case 'tipocambio': {
        // Endpoint dedicado para obtener el tipo de cambio actual
        url = `https://developers.syscom.mx/api/v1/productos?categoria=22&pagina=1`;
        const tcRes = await fetchJson(url, { method: 'GET', headers: authHeaders });
        const list = Array.isArray(tcRes.body) ? tcRes.body : (tcRes.body?.productos || []);
        const tc = list.find(p => parseFloat(String(p.tipo_cambio||'0').replace(/,/g,'')) > 10);
        const tcVal = tc ? parseFloat(String(tc.tipo_cambio).replace(/,/g,'')) : (cachedTipoCambio || 17.0);
        if (tcVal > 10) cachedTipoCambio = tcVal;
        return { statusCode: 200, headers, body: JSON.stringify({ tipo_cambio: tcVal, rate: tcVal }) };
      }

      case 'search': {
        const pagina = params.page || 1;
        const q      = (params.q || '').trim();
        const cat    = (params.categoria || '').trim();
        if (q) {
          url = `https://developers.syscom.mx/api/v1/productos?busqueda=${encodeURIComponent(q)}&pagina=${pagina}`;
        } else if (cat) {
          url = `https://developers.syscom.mx/api/v1/productos?categoria=${encodeURIComponent(cat)}&pagina=${pagina}`;
        } else {
          url = `https://developers.syscom.mx/api/v1/productos?categoria=22&pagina=${pagina}`;
        }
        break;
      }

      case 'producto': {
        const sku = (params.sku || '').trim();
        if (!sku) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Falta SKU' }) };
        url = `https://developers.syscom.mx/api/v1/productos/${encodeURIComponent(sku)}`;
        break;
      }

      case 'debug': {
        const cat = (params.categoria || '22').trim();
        url = `https://developers.syscom.mx/api/v1/productos?categoria=${encodeURIComponent(cat)}&pagina=1`;
        const dbgRes = await fetchJson(url, { method: 'GET', headers: authHeaders });
        const list = Array.isArray(dbgRes.body) ? dbgRes.body : (dbgRes.body?.productos || []);
        const sample = list[0] || null;
        const precios = sample ? normalizarPrecios(sample) : null;
        return {
          statusCode: 200, headers,
          body: JSON.stringify({
            _debug: true,
            total_productos: list.length,
            precios_normalizados: precios,
            campos_raw: sample ? {
              precio_especial: sample.precio_especial,
              precio_lista: sample.precio_lista,
              precio_descuento: sample.precio_descuento,
              tipo_cambio: sample.tipo_cambio,
            } : null,
            raw_producto: sample,
          })
        };
      }

      default:
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Acción no válida' }) };
    }

    console.log('Syscom URL:', url);
    const res = await fetchJson(url, { method: 'GET', headers: authHeaders });

    if (res.status !== 200) {
      return { statusCode: res.status, headers, body: JSON.stringify({ error: `Error Syscom ${res.status}`, detail: res.body }) };
    }

    // Enriquecer cada producto con precios normalizados
    let body = res.body;
    if (Array.isArray(body)) {
      body = body.map(enriquecerProducto);
    } else if (body && Array.isArray(body.productos)) {
      body = { ...body, productos: body.productos.map(enriquecerProducto) };
    } else if (body && body.producto_id) {
      body = enriquecerProducto(body);
    }

    return { statusCode: 200, headers, body: JSON.stringify(body) };

  } catch (err) {
    console.error('Syscom proxy error:', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
