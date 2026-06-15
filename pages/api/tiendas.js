import { listarTiendas } from "../../lib/supabase"

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Metodo no permitido" })
  }

  try {
    const tiendas = await listarTiendas()
    return res.status(200).json({ tiendas })
  } catch (err) {
    return res.status(500).json({ error: err.message || "No se pudieron cargar las tiendas" })
  }
}
