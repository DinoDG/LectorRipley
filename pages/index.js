import { useState, useRef } from "react"
import dynamic from "next/dynamic"
import Head from "next/head"

// Carga dinámica: zxing solo funciona en el browser, no en SSR
const Escaner = dynamic(() => import("../components/Escaner"), { ssr: false })

// ─── Formatear precio CLP ────────────────────────────────
function formatPrecio(valor) {
  if (!valor) return "—"
  return new Intl.NumberFormat("es-CL", {
    style:    "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(valor)
}

// ─── Componente tarjeta de resultado ────────────────────
function TarjetaProducto({ producto }) {
  return (
    <div style={styles.tarjeta}>
      <div style={styles.tarjetaHeader}>
        <span style={styles.skuLabel}>SKU / EAN-13</span>
        <span style={styles.skuValor}>{producto.sku}</span>
      </div>

      <p style={styles.descripcion}>{producto.descripcion || "Sin descripción"}</p>

      <div style={styles.precioBloque}>
        <span style={styles.precioLabel}>PRECIO</span>
        <span style={styles.precioValor}>{formatPrecio(producto.precio)}</span>
      </div>

      {producto.promo && (
        <div style={styles.promoBadge}>
          <span>PROMO</span>
          <span style={{ fontFamily: "var(--mono)", fontSize: 13 }}>{producto.promo}</span>
        </div>
      )}

      <div style={styles.metaDatos}>
        {producto.depto   && <Chip label="Depto"    valor={producto.depto}    />}
        {producto.linea   && <Chip label="Línea"    valor={producto.linea}    />}
        {producto.sublinea && <Chip label="Sublínea" valor={producto.sublinea} />}
      </div>
    </div>
  )
}

function Chip({ label, valor }) {
  return (
    <div style={styles.chip}>
      <span style={styles.chipLabel}>{label}</span>
      <span style={styles.chipValor}>{valor}</span>
    </div>
  )
}

// ─── Página principal ────────────────────────────────────
export default function Home() {
  const [sku,        setSku]        = useState("")
  const [estado,     setEstado]     = useState("idle")
  const [producto,   setProducto]   = useState(null)
  const [error,      setError]      = useState("")
  const [escaneando, setEscaneando] = useState(false)
  const inputRef = useRef(null)

  async function buscar(skuOverride) {
    const valor = (skuOverride || sku).trim()
    if (!valor) return

    setEstado("cargando")
    setProducto(null)
    setError("")

    try {
      const res  = await fetch(`/api/precio?sku=${encodeURIComponent(valor)}`)
      const data = await res.json()

      if (res.ok) {
        setProducto(data)
        setEstado("ok")
      } else {
        setError(data.error || "Producto no encontrado")
        setEstado("error")
      }
    } catch {
      setError("Error de conexión")
      setEstado("error")
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter") buscar()
  }

  function onDetectado(codigoEscaneado) {
    setEscaneando(false)
    setSku(codigoEscaneado)
    buscar(codigoEscaneado)
  }

  function limpiar() {
    setSku("")
    setEstado("idle")
    setProducto(null)
    setError("")
    setEscaneando(false)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  return (
    <>
      <Head>
        <title>Consulta Precios</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </Head>

      <div style={styles.page}>

        {/* ── Header ── */}
        <header style={styles.header}>
          <div style={styles.headerInner}>
            <span style={styles.logo}>PRECIO</span>
            <span style={styles.logoDot}>.</span>
            <span style={styles.logoSub}>RIPLEY</span>
          </div>
        </header>

        {/* ── Input ── */}
        <main style={styles.main}>
          <div style={styles.inputWrap}>
            <label style={styles.inputLabel} htmlFor="sku-input">
              Ingresa o escanea el código
            </label>

            <div style={styles.inputRow}>
              <input
                id="sku-input"
                ref={inputRef}
                style={styles.input}
                type="tel"
                inputMode="numeric"
                placeholder="0000000000000"
                value={sku}
                onChange={e => setSku(e.target.value.replace(/\D/g, "").slice(0, 13))}
                onKeyDown={onKeyDown}
                autoFocus
                autoComplete="off"
              />
              <button
                style={styles.btnCamara}
                onClick={() => setEscaneando(true)}
                title="Escanear código de barras"
                aria-label="Abrir cámara para escanear"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </button>
              <button
                style={{
                  ...styles.btnBuscar,
                  ...(estado === "cargando" ? styles.btnDisabled : {}),
                }}
                onClick={() => buscar()}
                disabled={estado === "cargando"}
              >
                {estado === "cargando" ? "..." : "→"}
              </button>
            </div>

            <p style={styles.hint}>
              {sku.length > 0
                ? `${sku.length} / 13 dígitos`
                : "EAN-13 completo o los primeros 12 dígitos"}
            </p>
          </div>

          {/* ── Resultado ── */}
          {estado === "cargando" && (
            <div style={styles.estadoBloque}>
              <span style={styles.spinner} />
              <span style={{ color: "var(--muted)", fontFamily: "var(--mono)", fontSize: 13 }}>
                consultando…
              </span>
            </div>
          )}

          {estado === "error" && (
            <div style={styles.errorBloque}>
              <span style={styles.errorIcon}>✕</span>
              <p style={styles.errorTexto}>{error}</p>
              <button style={styles.btnLimpiar} onClick={limpiar}>Nueva consulta</button>
            </div>
          )}

          {estado === "ok" && producto && (
            <>
              <TarjetaProducto producto={producto} />
              <button style={styles.btnLimpiar} onClick={limpiar}>Nueva consulta</button>
            </>
          )}
        </main>

        {/* ── Footer ── */}
        <footer style={styles.footer}>
          <span>consulta en tiempo real · api ripley</span>
        </footer>

        {/* ── Escaner overlay ── */}
        {escaneando && (
          <Escaner
            onDetectado={onDetectado}
            onCerrar={() => setEscaneando(false)}
          />
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        input::placeholder { color: #333; }
        input:focus { outline: none; border-color: var(--accent) !important; }
        button:active { opacity: 0.7; }
      `}</style>
    </>
  )
}

// ─── Estilos ─────────────────────────────────────────────
const styles = {
  page: {
    minHeight: "100dvh",
    display: "flex",
    flexDirection: "column",
    maxWidth: 480,
    margin: "0 auto",
    padding: "0 0 env(safe-area-inset-bottom)",
  },
  header: {
    padding: "20px 24px 16px",
    borderBottom: "1px solid var(--border)",
  },
  headerInner: {
    display: "flex",
    alignItems: "baseline",
    gap: 2,
  },
  logo: {
    fontFamily: "var(--mono)",
    fontWeight: 600,
    fontSize: 22,
    letterSpacing: 4,
    color: "var(--text)",
  },
  logoDot: {
    fontFamily: "var(--mono)",
    fontWeight: 600,
    fontSize: 26,
    color: "var(--accent)",
    lineHeight: 1,
  },
  logoSub: {
    fontFamily: "var(--mono)",
    fontWeight: 400,
    fontSize: 13,
    letterSpacing: 3,
    color: "var(--muted)",
  },

  main: {
    flex: 1,
    padding: "32px 24px",
    display: "flex",
    flexDirection: "column",
    gap: 24,
  },

  inputWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  inputLabel: {
    fontFamily: "var(--mono)",
    fontSize: 11,
    letterSpacing: 2,
    color: "var(--muted)",
    textTransform: "uppercase",
  },
  inputRow: {
    display: "flex",
    gap: 10,
  },
  input: {
    flex: 1,
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 4,
    color: "var(--text)",
    fontFamily: "var(--mono)",
    fontSize: 20,
    letterSpacing: 3,
    padding: "14px 16px",
    transition: "border-color 0.15s",
  },
  btnCamara: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 4,
    color: "var(--accent)",
    padding: "0 16px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "border-color 0.15s",
  },
  btnBuscar: {
    background: "var(--accent)",
    border: "none",
    borderRadius: 4,
    color: "#000",
    fontFamily: "var(--mono)",
    fontWeight: 600,
    fontSize: 22,
    padding: "0 20px",
    cursor: "pointer",
    transition: "opacity 0.15s",
    flexShrink: 0,
  },
  btnDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  hint: {
    fontFamily: "var(--mono)",
    fontSize: 11,
    color: "var(--muted)",
  },

  estadoBloque: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "20px 0",
  },
  spinner: {
    display: "inline-block",
    width: 18,
    height: 18,
    border: "2px solid var(--border)",
    borderTopColor: "var(--accent)",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },

  errorBloque: {
    background: "#1a0a0a",
    border: "1px solid #3a1a1a",
    borderRadius: 6,
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  errorIcon: {
    fontFamily: "var(--mono)",
    fontSize: 20,
    color: "var(--accent2)",
  },
  errorTexto: {
    fontFamily: "var(--mono)",
    fontSize: 14,
    color: "#ff8080",
  },

  tarjeta: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    overflow: "hidden",
  },
  tarjetaHeader: {
    background: "#0f1f18",
    borderBottom: "1px solid var(--border)",
    padding: "12px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  skuLabel: {
    fontFamily: "var(--mono)",
    fontSize: 10,
    letterSpacing: 2,
    color: "var(--accent)",
    textTransform: "uppercase",
  },
  skuValor: {
    fontFamily: "var(--mono)",
    fontSize: 15,
    letterSpacing: 2,
    color: "var(--text)",
  },

  descripcion: {
    fontFamily: "var(--sans)",
    fontWeight: 300,
    fontSize: 15,
    lineHeight: 1.5,
    color: "var(--text)",
    padding: "16px 16px 0",
  },

  precioBloque: {
    padding: "20px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  precioLabel: {
    fontFamily: "var(--mono)",
    fontSize: 10,
    letterSpacing: 3,
    color: "var(--muted)",
  },
  precioValor: {
    fontFamily: "var(--mono)",
    fontWeight: 600,
    fontSize: 36,
    color: "var(--accent)",
    letterSpacing: -1,
  },

  promoBadge: {
    margin: "0 16px 16px",
    background: "#1a1500",
    border: "1px solid #3a3000",
    borderRadius: 4,
    padding: "8px 12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontFamily: "var(--mono)",
    fontSize: 11,
    letterSpacing: 2,
    color: "#ffcc00",
  },

  metaDatos: {
    borderTop: "1px solid var(--border)",
    padding: "12px 16px",
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    background: "#1a1a1a",
    border: "1px solid var(--border)",
    borderRadius: 4,
    padding: "4px 10px",
    display: "flex",
    flexDirection: "column",
    gap: 1,
  },
  chipLabel: {
    fontFamily: "var(--mono)",
    fontSize: 9,
    letterSpacing: 1,
    color: "var(--muted)",
    textTransform: "uppercase",
  },
  chipValor: {
    fontFamily: "var(--mono)",
    fontSize: 12,
    color: "var(--text)",
  },

  btnLimpiar: {
    background: "transparent",
    border: "1px solid var(--border)",
    borderRadius: 4,
    color: "var(--muted)",
    fontFamily: "var(--mono)",
    fontSize: 12,
    letterSpacing: 2,
    padding: "12px",
    cursor: "pointer",
    textTransform: "uppercase",
    width: "100%",
    transition: "border-color 0.15s, color 0.15s",
  },

  footer: {
    padding: "16px 24px",
    borderTop: "1px solid var(--border)",
    fontFamily: "var(--mono)",
    fontSize: 10,
    letterSpacing: 2,
    color: "#333",
    textAlign: "center",
  },
}