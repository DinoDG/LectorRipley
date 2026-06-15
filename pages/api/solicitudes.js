import { crearSolicitud, guardarProducto } from "../../lib/supabase"

const TAMANOS_VALIDOS = new Set([1, 2, 3, 4, 5, 6, 8])

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo no permitido" })
  }

  try {
    const { producto, sku, tamano_id, tienda, comentario = "", cantidad = 1 } = req.body || {}
    const skuFinal = producto?.sku || sku
    const tamano = Number(tamano_id)
    const tiendaId = Number(tienda)
    const cantidadFinal = Number(cantidad)
    const comentarioFinal = String(comentario || "").trim()

    if (!skuFinal) {
      return res.status(400).json({ error: "Falta el SKU del producto" })
    }
    if (!TAMANOS_VALIDOS.has(tamano)) {
      return res.status(400).json({ error: "Tamano no valido" })
    }
    if (!Number.isInteger(tiendaId) || tiendaId <= 0) {
      return res.status(400).json({ error: "Tienda no valida" })
    }
    if (!Number.isInteger(cantidadFinal) || cantidadFinal < 1) {
      return res.status(400).json({ error: "Cantidad no valida" })
    }
    if (comentarioFinal.length > 60) {
      return res.status(400).json({ error: "El comentario no puede superar 60 caracteres" })
    }

    if (producto?.sku) {
      await guardarProducto(producto)
    }

    const solicitud = await crearSolicitud({
      sku: skuFinal,
      tamano_id: tamano,
      tienda: tiendaId,
      comentario: comentarioFinal,
      cantidad: cantidadFinal,
    })

    return res.status(201).json({ solicitud })
  } catch (err) {
    return res.status(500).json({ error: err.message || "No se pudo crear la solicitud" })
  }
}
