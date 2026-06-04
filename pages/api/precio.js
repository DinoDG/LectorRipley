import { consultarPrecio } from "../../lib/ripley"
import { guardarProducto }  from "../../lib/supabase"

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" })
  }

  const { sku } = req.query
  if (!sku) {
    return res.status(400).json({ error: "Falta el parámetro ?sku=" })
  }

  const resultado = await consultarPrecio(sku)

  if (resultado.ok) {
    // Guardar en Supabase en segundo plano (no bloqueamos la respuesta)
    guardarProducto(resultado.producto).catch(() => {})
    return res.status(200).json(resultado.producto)
  } else {
    return res.status(404).json({ error: resultado.error })
  }
}
