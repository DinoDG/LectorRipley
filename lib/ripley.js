// =========================================================
// CONFIGURACIÓN
// =========================================================

const STORE_ID = process.env.RIPLEY_STORE_ID || "10025"

const BASE_URL     = "https://api.ripley.com/experience/customer/autoatencion/bff/v1"
const URL_TOKEN    = `${BASE_URL}/auth/generate`
const URL_PRODUCTO = `${BASE_URL}/cart/product`

const BASE_HEADERS = {
  "accept":      "application/json, text/plain, */*",
  "application": "trx-prd-product-reader-client-1.0.0",
  "origin":      "https://lector-precios.ripley.cl",
  "referer":     "https://lector-precios.ripley.cl/",
  "user-agent":  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
}

// =========================================================
// TOKEN EN MEMORIA DEL SERVIDOR
// =========================================================

let TOKEN        = null
let TOKEN_EXPIRA = 0

async function obtenerToken() {
  const res  = await fetch(URL_TOKEN, { headers: BASE_HEADERS })
  const data = await res.json()
  if (!data.success) throw new Error(`Error obteniendo token: ${JSON.stringify(data)}`)

  TOKEN        = data.message.access_token
  TOKEN_EXPIRA = Date.now() + (parseInt(data.message.expires_in) - 60) * 1000
}

async function asegurarToken() {
  if (!TOKEN || Date.now() >= TOKEN_EXPIRA) await obtenerToken()
}

async function headersAuth() {
  await asegurarToken()
  return { ...BASE_HEADERS, authorization: `Bearer ${TOKEN}`, "content-type": "application/json" }
}

// =========================================================
// DÍGITO DE CONTROL EAN-13
// =========================================================

function calcularDigitoEan13(ean12) {
  if (!/^\d{12}$/.test(ean12)) throw new Error("Debe ser 12 dígitos")
  let odd = 0, even = 0
  for (let i = 0; i < 12; i++) {
    const d = parseInt(ean12[i])
    if ((i + 1) % 2 === 0) even += d
    else odd += d
  }
  return String((10 - ((odd + even * 3) % 10)) % 10)
}

// =========================================================
// CONSULTAR PRECIO — función principal
// =========================================================

export async function consultarPrecio(skuRaw) {
  let sku = skuRaw.trim()

  // Completar EAN-13 si viene con 12 dígitos
  if (sku.length === 12) {
    sku = sku + calcularDigitoEan13(sku)
  } else if (sku.length !== 13) {
    return { ok: false, error: `SKU inválido: debe tener 12 o 13 dígitos (recibido: ${sku.length})` }
  }

  try {
    const headers = await headersAuth()

    const payload = {
      store:       STORE_ID,
      products:    [{ sku, quantity: 1 }],
    }

    let res = await fetch(URL_PRODUCTO, { method: "POST", headers, body: JSON.stringify(payload) })

    if (res.status === 401 || res.status === 403) {
      await obtenerToken()
      res = await fetch(URL_PRODUCTO, { method: "POST", headers: await headersAuth(), body: JSON.stringify(payload) })
    }

    if (!res.ok) return { ok: false, error: `Error HTTP: ${res.status}` }

    const data = await res.json()

    if (!data.success || !data.message?.products?.length) {
      return { ok: false, error: data.error || "Producto no encontrado" }
    }

    const p = data.message.products[0]

    return {
      ok: true,
      producto: {
        sku:         p.ean13 || sku,
        descripcion: p.description,
        precio:      p.price,
        promo:       p.code_promotion_ripley || null,
        depto:       p.department,
        linea:       p.linecode,
        sublinea:    p.sublinecode,
      },
    }

  } catch (err) {
    return { ok: false, error: err.message }
  }
}