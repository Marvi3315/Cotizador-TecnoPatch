import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. Manejo de CORS (Preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Leer las credenciales de los Secrets de Supabase
    const clientId = Deno.env.get('SYSCOM_CLIENT_ID')
    const clientSecret = Deno.env.get('SYSCOM_CLIENT_SECRET')

    if (!clientId || !clientSecret) {
      throw new Error("Las credenciales SYSCOM_CLIENT_ID o SYSCOM_CLIENT_SECRET no están configuradas.")
    }

    // 3. Leer el cuerpo de la petición (keyword)
    const body = await req.json().catch(() => ({}))
    const keyword = body.keyword

    // 4. Obtener el Token de Syscom
    const authParams = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
    })

    const authResponse = await fetch('https://developers.syscom.mx/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: authParams.toString(),
    })

    if (!authResponse.ok) {
      const errorText = await authResponse.text()
      throw new Error(`Error de autenticación Syscom: ${errorText}`)
    }

    const authData = await authResponse.json()
    const token = authData.access_token

    // 5. SI hay un keyword, buscar productos usando el parámetro CORRECTO: "busqueda"
    if (keyword) {
      // Cambio crítico: usamos busqueda=${keyword} porque keyword=${keyword} da error 422
      const searchResponse = await fetch(`https://developers.syscom.mx/api/v1/productos?busqueda=${encodeURIComponent(keyword)}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      
      const products = await searchResponse.json()
      
      return new Response(JSON.stringify(products), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // 6. Si no hay keyword, solo devolver el token
    return new Response(JSON.stringify({ token }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error("Error en la función:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})