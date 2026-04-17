const https = require('https');

let cachedToken = null;
let tokenExpiry = 0;

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
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (r) => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => {
        try { resolve({ status: r.statusCode, body: JSON.parse(d) }); }
        catch(e) { resolve({ status: r.statusCode, body: d }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });

  if (res.status !== 200 || !res.body.access_token) {
    throw new Error(`Error token Syscom ${res.status}: ${JSON.stringify(res.body)}`);
  }

  cachedToken = res.body.access_token;
  tokenExpiry = Date.now() + (23 * 60 * 60 * 1000);
  return cachedToken;
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

      case 'search': {
        const pagina = params.page || 1;
        const q      = (params.q || '').trim();
        const cat    = (params.categoria || '').trim();

        // Syscom REQUIERE al menos busqueda o categoria
        // Si no hay ninguno, usamos una categoría por defecto (Videovigilancia = 22)
        if (q) {
          url = `https://developers.syscom.mx/api/v1/productos?busqueda=${encodeURIComponent(q)}&pagina=${pagina}`;
        } else if (cat) {
          url = `https://developers.syscom.mx/api/v1/productos?categoria=${encodeURIComponent(cat)}&pagina=${pagina}`;
        } else {
          // Sin filtro: traer categoría más relevante para TecnoPatch
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

      case 'categoria': {
        const cat    = (params.categoria || '22').trim();
        const pagina = params.page || 1;
        url = `https://developers.syscom.mx/api/v1/productos?categoria=${encodeURIComponent(cat)}&pagina=${pagina}`;
        break;
      }

      case 'debug': {
        // Devuelve raw de 1 producto para inspeccionar estructura de precios
        const cat = (params.categoria || '22').trim();
        url = `https://developers.syscom.mx/api/v1/productos?categoria=${encodeURIComponent(cat)}&pagina=1`;
        const dbgRes = await fetchJson(url, { method: 'GET', headers: authHeaders });
        if (dbgRes.status !== 200) {
          return { statusCode: dbgRes.status, headers, body: JSON.stringify({ error: 'Syscom error', detail: dbgRes.body }) };
        }
        const list = Array.isArray(dbgRes.body) ? dbgRes.body : (dbgRes.body?.productos || []);
        const sample = list[0] || null;
        return {
          statusCode: 200, headers,
          body: JSON.stringify({
            _debug: true,
            total_productos: list.length,
            campos_precio: sample ? {
              precio_especial: sample.precio_especial,
              precio_lista: sample.precio_lista,
              precio_descuento: sample.precio_descuento,
              precios: sample.precios,
              tipo_precio_especial: typeof sample.precio_especial,
              tipo_precio_lista: typeof sample.precio_lista,
            } : null,
            raw_producto: sample
          })
        };
      }

      default:
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Acción no válida: ' + action }) };
    }

    console.log('Syscom URL:', url);
    const res = await fetchJson(url, { method: 'GET', headers: authHeaders });
    console.log('Syscom status:', res.status);

    if (res.status !== 200) {
      return {
        statusCode: res.status,
        headers,
        body: JSON.stringify({ error: `Error de Syscom: ${res.status}`, detail: res.body })
      };
    }

    return { statusCode: 200, headers, body: JSON.stringify(res.body) };

  } catch (err) {
    console.error('Syscom proxy error:', err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
