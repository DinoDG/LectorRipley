import { consultarPrecio } from "../../lib/ripley"
import { guardarProducto } from "../../lib/supabase"

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Metodo no permitido" })
  }

  const { sku, tienda } = req.query
  if (!sku) {
    return res.status(400).json({ error: "Falta el parametro ?sku=" })
  }

  const resultado = await consultarPrecio(sku, tienda)

  if (resultado.ok) {
    guardarProducto(resultado.producto).catch(() => {})
    return res.status(200).json(resultado.producto)
  }

  return res.status(404).json({ error: resultado.error })
}
