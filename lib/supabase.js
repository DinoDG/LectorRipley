const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_KEY

// Llamada directa a la REST API de Supabase (sin SDK extra)
export async function guardarProducto(producto) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return  // silencioso si no está configurado

  const row = {
    sku:           producto.sku,
    ean13:         producto.sku,
    descripcion:   producto.descripcion,
    depto:         producto.depto,
    linea:         producto.linea,
    sublinea:      producto.sublinea,
    precio_actual: parseInt(producto.precio || 0),
  }

  await fetch(`${SUPABASE_URL}/rest/v1/productos`, {
    method: "POST",
    headers: {
      "apikey":        SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type":  "application/json",
      "Prefer":        "resolution=merge-duplicates",  // equivale a upsert
    },
    body: JSON.stringify(row),
  })
}
