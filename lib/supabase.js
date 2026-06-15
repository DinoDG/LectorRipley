const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_KEY

function assertSupabaseConfig() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Supabase no esta configurado")
  }
}

async function supabaseFetch(path, options = {}) {
  assertSupabaseConfig()

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  })

  if (!res.ok) {
    const texto = await res.text()
    throw new Error(texto || `Error Supabase: ${res.status}`)
  }

  if (res.status === 204) return null

  const texto = await res.text()
  if (!texto) return null

  return JSON.parse(texto)
}

export async function listarTiendas() {
  return supabaseFetch("tiendas?select=id,descripcion&order=descripcion.asc")
}

export async function guardarProducto(producto) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return

  const row = {
    sku: producto.sku,
    ean13: producto.sku,
    descripcion: producto.descripcion,
    depto: producto.depto,
    linea: producto.linea,
    sublinea: producto.sublinea,
    precio_actual: parseInt(producto.precio || 0),
  }

  await supabaseFetch("productos?on_conflict=sku", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(row),
  })
}

export async function crearSolicitud(solicitud) {
  const row = {
    sku: solicitud.sku,
    tamano_id: solicitud.tamano_id,
    tienda: solicitud.tienda,
    comentario: solicitud.comentario || null,
    cantidad: solicitud.cantidad || 1,
    estado: "pendiente",
    origen: "movil",
  }

  const data = await supabaseFetch("solicitudes", {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify(row),
  })

  return data?.[0] || null
}
