import { useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import Head from "next/head"

const Escaner = dynamic(() => import("../components/Escaner"), { ssr: false })
const TIENDA_STORAGE_KEY = "ripley-precios-tienda"

const TAMANOS_POP = [
  { id: 1, nombre: "4x10" },
  { id: 2, nombre: "10x11" },
  { id: 3, nombre: "13x19" },
  { id: 4, nombre: "20x22" },
  { id: 5, nombre: "22x8" },
  { id: 6, nombre: "vitrina" },
  { id: 8, nombre: "20x19" },
]

function formatPrecio(valor) {
  if (!valor) return "-"
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(valor)
}

function TarjetaProducto({ producto, tienda }) {
  const [formAbierto, setFormAbierto] = useState(false)
  const [tamanoId, setTamanoId] = useState(TAMANOS_POP[0].id)
  const [cantidad, setCantidad] = useState(1)
  const [comentario, setComentario] = useState("")
  const [estadoSolicitud, setEstadoSolicitud] = useState("idle")
  const [errorSolicitud, setErrorSolicitud] = useState("")
  const mostrarPrecioTarjeta =
    producto.precioTarjetaRipley &&
    producto.precioTarjetaRipley !== producto.precio

  async function solicitarPop() {
    setEstadoSolicitud("cargando")
    setErrorSolicitud("")

    try {
      const res = await fetch("/api/solicitudes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          producto,
          tamano_id: tamanoId,
          tienda: tienda.id,
          cantidad,
          comentario,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "No se pudo crear la solicitud")
      }

      setEstadoSolicitud("ok")
    } catch (err) {
      setErrorSolicitud(err.message || "No se pudo crear la solicitud")
      setEstadoSolicitud("error")
    }
  }

  return (
    <div style={styles.tarjeta}>
      <div style={styles.descripcionBloque}>
        <span style={styles.descripcionLabel}>Descripcion</span>
        <p style={styles.descripcion}>{producto.descripcion || "Sin descripcion"}</p>
      </div>

      <div style={styles.precioBloque}>
        <span style={styles.precioLabel}>PRECIO</span>
        <span style={styles.precioValor}>{formatPrecio(producto.precio)}</span>
      </div>

      {mostrarPrecioTarjeta && (
        <div style={styles.precioTarjetaBloque}>
          <span style={styles.precioTarjetaLabel}>PRECIO TARJETA RIPLEY</span>
          <span style={styles.precioTarjetaValor}>
            {formatPrecio(producto.precioTarjetaRipley)}
          </span>
        </div>
      )}

      {producto.promo && (
        <div style={styles.promoBadge}>
          <span>CODIGO PROMO</span>
          <span style={styles.promoValor}>{producto.promo}</span>
        </div>
      )}

      <div style={styles.eanBloque}>
        <span style={styles.eanLabel}>EAN13</span>
        <span style={styles.eanValor}>{producto.sku}</span>
      </div>

      <div style={styles.popBloque}>
        {!formAbierto && estadoSolicitud !== "ok" && (
          <button style={styles.btnPop} onClick={() => setFormAbierto(true)}>
            SOLICITAR POP
          </button>
        )}

        {formAbierto && estadoSolicitud !== "ok" && (
          <div style={styles.popForm}>
            <div style={styles.formGrid}>
              <label style={styles.field}>
                <span style={styles.fieldLabel}>Tamano</span>
                <select
                  style={styles.select}
                  value={tamanoId}
                  onChange={e => setTamanoId(Number(e.target.value))}
                  disabled={estadoSolicitud === "cargando"}
                >
                  {TAMANOS_POP.map(tamano => (
                    <option key={tamano.id} value={tamano.id}>
                      {tamano.nombre}
                    </option>
                  ))}
                </select>
              </label>

              <label style={styles.field}>
                <span style={styles.fieldLabel}>Cantidad</span>
                <input
                  style={styles.cantidadInput}
                  type="number"
                  min="1"
                  max="99"
                  value={cantidad}
                  onChange={e => setCantidad(Math.max(1, Number(e.target.value || 1)))}
                  disabled={estadoSolicitud === "cargando"}
                />
              </label>
            </div>

            <label style={styles.field}>
              <span style={styles.fieldLabel}>Comentario</span>
              <input
                style={styles.comentarioInput}
                type="text"
                maxLength={60}
                value={comentario}
                onChange={e => setComentario(e.target.value.slice(0, 60))}
                placeholder="Opcional"
                disabled={estadoSolicitud === "cargando"}
              />
              <span style={styles.contadorComentario}>{comentario.length} / 60</span>
            </label>

            {estadoSolicitud === "error" && (
              <p style={styles.errorSolicitud}>{errorSolicitud}</p>
            )}

            <div style={styles.formActions}>
              <button
                style={styles.btnSecundario}
                onClick={() => setFormAbierto(false)}
                disabled={estadoSolicitud === "cargando"}
              >
                Cancelar
              </button>
              <button
                style={{
                  ...styles.btnConfirmarPop,
                  ...(estadoSolicitud === "cargando" ? styles.btnDisabled : {}),
                }}
                onClick={solicitarPop}
                disabled={estadoSolicitud === "cargando"}
              >
                {estadoSolicitud === "cargando" ? "ENVIANDO..." : "CONFIRMAR"}
              </button>
            </div>
          </div>
        )}

        {estadoSolicitud === "ok" && (
          <div style={styles.solicitudOk}>Solicitud POP registrada</div>
        )}
      </div>
    </div>
  )
}

function SelectorTienda({ tiendas, cargando, error, tiendaElegida, onElegir, onRecargar }) {
  const [tiendaId, setTiendaId] = useState("")

  useEffect(() => {
    if (!tiendaId && tiendas.length > 0) {
      setTiendaId(String(tiendas[0].id))
    }
  }, [tiendas, tiendaId])

  function confirmar() {
    const tienda = tiendas.find(item => String(item.id) === String(tiendaId))
    if (tienda) onElegir(tienda)
  }

  return (
    <main style={styles.welcomeMain}>
      <div style={styles.welcomeBox}>
        <span style={styles.welcomeEyebrow}>Consulta precios</span>
        <h1 style={styles.welcomeTitle}>Bienvenid@</h1>
        <p style={styles.welcomeText}>Que tienda desea consultar?</p>

        {cargando && (
          <div style={styles.estadoBloque}>
            <span style={styles.spinner} />
            <span style={styles.estadoTexto}>cargando tiendas...</span>
          </div>
        )}

        {error && (
          <div style={styles.errorBloque}>
            <p style={styles.errorTexto}>{error}</p>
            <button style={styles.btnLimpiar} onClick={onRecargar}>Reintentar</button>
          </div>
        )}

        {!cargando && !error && (
          <>
            <label style={styles.field}>
              <span style={styles.fieldLabel}>Tienda</span>
              <select
                style={styles.selectGrande}
                value={tiendaId}
                onChange={e => setTiendaId(e.target.value)}
              >
                {tiendas.map(tienda => (
                  <option key={tienda.id} value={tienda.id}>
                    {tienda.descripcion}
                  </option>
                ))}
              </select>
            </label>

            <button
              style={{
                ...styles.btnEntrar,
                ...(tiendaElegida ? {} : {}),
              }}
              onClick={confirmar}
              disabled={!tiendaId}
            >
              Entrar
            </button>
          </>
        )}
      </div>
    </main>
  )
}

export default function Home() {
  const [sku, setSku] = useState("")
  const [estado, setEstado] = useState("idle")
  const [producto, setProducto] = useState(null)
  const [error, setError] = useState("")
  const [escaneando, setEscaneando] = useState(false)
  const [tienda, setTienda] = useState(null)
  const [tiendas, setTiendas] = useState([])
  const [cargandoTiendas, setCargandoTiendas] = useState(true)
  const [errorTiendas, setErrorTiendas] = useState("")
  const [inicioListo, setInicioListo] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    const guardada = window.localStorage.getItem(TIENDA_STORAGE_KEY)
    if (guardada) {
      try {
        const tiendaGuardada = JSON.parse(guardada)
        if (tiendaGuardada?.id && tiendaGuardada?.descripcion) {
          setTienda(tiendaGuardada)
          setInicioListo(true)
          setCargandoTiendas(false)
          return
        }
      } catch {
        window.localStorage.removeItem(TIENDA_STORAGE_KEY)
      }
    }

    cargarTiendas()
  }, [])

  async function cargarTiendas() {
    setCargandoTiendas(true)
    setErrorTiendas("")

    try {
      const res = await fetch("/api/tiendas")
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No se pudieron cargar las tiendas")

      setTiendas(data.tiendas || [])
      setInicioListo(true)
    } catch (err) {
      setErrorTiendas(err.message || "No se pudieron cargar las tiendas")
      setInicioListo(true)
    } finally {
      setCargandoTiendas(false)
    }
  }

  function elegirTienda(tiendaElegida) {
    const normalizada = {
      id: Number(tiendaElegida.id),
      descripcion: tiendaElegida.descripcion,
    }
    setTienda(normalizada)
    window.localStorage.setItem(TIENDA_STORAGE_KEY, JSON.stringify(normalizada))
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function cambiarTienda() {
    window.localStorage.removeItem(TIENDA_STORAGE_KEY)
    setTienda(null)
    setProducto(null)
    setEstado("idle")
    setSku("")
    cargarTiendas()
  }

  async function buscar(skuOverride) {
    const valor = (skuOverride || sku).trim()
    if (!valor) return
    if (!tienda?.id) {
      setError("Debes seleccionar una tienda")
      setEstado("error")
      return
    }

    setEstado("cargando")
    setProducto(null)
    setError("")

    try {
      const params = new URLSearchParams({
        sku: valor,
        tienda: String(tienda.id),
      })
      const res = await fetch(`/api/precio?${params.toString()}`)
      const data = await res.json()

      if (res.ok) {
        setProducto(data)
        setEstado("ok")
      } else {
        setError(data.error || "Producto no encontrado")
        setEstado("error")
      }
    } catch {
      setError("Error de conexion")
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
        <header style={styles.header}>
          <div style={styles.headerInner}>
            <span style={styles.logo}>PRECIO</span>
            <span style={styles.logoDot}>.</span>
            <span style={styles.logoSub}>RIPLEY</span>
          </div>
        </header>

        {!inicioListo && (
          <main style={styles.main}>
            <div style={styles.estadoBloque}>
              <span style={styles.spinner} />
              <span style={styles.estadoTexto}>iniciando...</span>
            </div>
          </main>
        )}

        {inicioListo && !tienda && (
          <SelectorTienda
            tiendas={tiendas}
            cargando={cargandoTiendas}
            error={errorTiendas}
            tiendaElegida={tienda}
            onElegir={elegirTienda}
            onRecargar={cargarTiendas}
          />
        )}

        {inicioListo && tienda && (
          <main style={styles.main}>
            <div style={styles.tiendaActiva}>
              <div>
                <span style={styles.tiendaLabel}>Tienda</span>
                <p style={styles.tiendaNombre}>{tienda.descripcion}</p>
              </div>
              <button style={styles.btnCambiarTienda} onClick={cambiarTienda}>
                Cambiar
              </button>
            </div>

            <div style={styles.inputWrap}>
              <label style={styles.inputLabel} htmlFor="sku-input">
                Ingresa o escanea el codigo
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
                  title="Escanear codigo de barras"
                  aria-label="Abrir camara para escanear"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
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
                  {estado === "cargando" ? "..." : ">"}
                </button>
              </div>

              <p style={styles.hint}>
                {sku.length > 0
                  ? `${sku.length} / 13 digitos`
                  : "EAN-13 completo o los primeros 12 digitos"}
              </p>
            </div>

            {estado === "cargando" && (
              <div style={styles.estadoBloque}>
                <span style={styles.spinner} />
                <span style={styles.estadoTexto}>consultando...</span>
              </div>
            )}

            {estado === "error" && (
              <div style={styles.errorBloque}>
                <span style={styles.errorIcon}>x</span>
                <p style={styles.errorTexto}>{error}</p>
                <button style={styles.btnLimpiar} onClick={limpiar}>Nueva consulta</button>
              </div>
            )}

            {estado === "ok" && producto && (
              <>
                <TarjetaProducto producto={producto} tienda={tienda} />
                <button style={styles.btnLimpiar} onClick={limpiar}>Nueva consulta</button>
              </>
            )}
          </main>
        )}

        <footer style={styles.footer}>
          <span>consulta en tiempo real - Dino - 2026</span>
        </footer>

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
        input:focus, select:focus { outline: none; border-color: var(--accent) !important; }
        button:active { opacity: 0.7; }
      `}</style>
    </>
  )
}

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
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: 22,
  },
  welcomeMain: {
    flex: 1,
    padding: "32px 24px",
    display: "flex",
    alignItems: "center",
  },
  welcomeBox: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  welcomeEyebrow: {
    fontFamily: "var(--mono)",
    fontSize: 11,
    letterSpacing: 2,
    color: "var(--accent)",
    textTransform: "uppercase",
  },
  welcomeTitle: {
    fontFamily: "var(--sans)",
    fontWeight: 600,
    fontSize: 34,
    color: "var(--text)",
  },
  welcomeText: {
    fontFamily: "var(--sans)",
    fontSize: 17,
    color: "var(--muted)",
    lineHeight: 1.4,
  },
  tiendaActiva: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 6,
    padding: "12px 14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  tiendaLabel: {
    fontFamily: "var(--mono)",
    fontSize: 9,
    letterSpacing: 2,
    color: "var(--muted)",
    textTransform: "uppercase",
  },
  tiendaNombre: {
    fontFamily: "var(--mono)",
    fontSize: 14,
    color: "var(--text)",
  },
  btnCambiarTienda: {
    background: "transparent",
    border: "1px solid var(--border)",
    borderRadius: 4,
    color: "var(--accent)",
    fontFamily: "var(--mono)",
    fontSize: 11,
    letterSpacing: 1,
    padding: "8px 10px",
    cursor: "pointer",
    textTransform: "uppercase",
    flexShrink: 0,
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
    minWidth: 0,
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
  estadoTexto: {
    color: "var(--muted)",
    fontFamily: "var(--mono)",
    fontSize: 13,
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
  descripcionBloque: {
    background: "#0f1f18",
    borderBottom: "1px solid var(--border)",
    padding: "14px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  descripcionLabel: {
    fontFamily: "var(--mono)",
    fontSize: 10,
    letterSpacing: 2,
    color: "var(--accent)",
    textTransform: "uppercase",
  },
  descripcion: {
    fontFamily: "var(--sans)",
    fontWeight: 400,
    fontSize: 17,
    lineHeight: 1.35,
    color: "var(--text)",
  },
  precioBloque: {
    padding: "18px 16px",
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
    letterSpacing: 0,
  },
  precioTarjetaBloque: {
    margin: "0 16px 16px",
    background: "#101b24",
    border: "1px solid #1d3a4d",
    borderRadius: 4,
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: 3,
  },
  precioTarjetaLabel: {
    fontFamily: "var(--mono)",
    fontSize: 10,
    letterSpacing: 2,
    color: "#79c7ff",
  },
  precioTarjetaValor: {
    fontFamily: "var(--mono)",
    fontWeight: 600,
    fontSize: 28,
    color: "#79c7ff",
    letterSpacing: 0,
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
    gap: 12,
    fontFamily: "var(--mono)",
    fontSize: 11,
    letterSpacing: 2,
    color: "#ffcc00",
  },
  promoValor: {
    fontFamily: "var(--mono)",
    fontSize: 13,
    letterSpacing: 1,
  },
  eanBloque: {
    borderTop: "1px solid var(--border)",
    padding: "12px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  eanLabel: {
    fontFamily: "var(--mono)",
    fontSize: 9,
    letterSpacing: 2,
    color: "var(--muted)",
    textTransform: "uppercase",
  },
  eanValor: {
    fontFamily: "var(--mono)",
    fontSize: 14,
    letterSpacing: 2,
    color: "var(--text)",
  },
  popBloque: {
    borderTop: "1px solid var(--border)",
    padding: 16,
  },
  btnPop: {
    width: "100%",
    background: "var(--accent)",
    border: "none",
    borderRadius: 4,
    color: "#000",
    fontFamily: "var(--mono)",
    fontWeight: 600,
    fontSize: 12,
    letterSpacing: 2,
    padding: "13px",
    cursor: "pointer",
  },
  popForm: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 104px",
    gap: 10,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  fieldLabel: {
    fontFamily: "var(--mono)",
    fontSize: 10,
    letterSpacing: 2,
    color: "var(--muted)",
    textTransform: "uppercase",
  },
  select: {
    width: "100%",
    background: "#0d0d0d",
    border: "1px solid var(--border)",
    borderRadius: 4,
    color: "var(--text)",
    fontFamily: "var(--mono)",
    fontSize: 14,
    padding: "11px 10px",
  },
  selectGrande: {
    width: "100%",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 4,
    color: "var(--text)",
    fontFamily: "var(--mono)",
    fontSize: 16,
    padding: "14px 12px",
  },
  cantidadInput: {
    width: "100%",
    background: "#0d0d0d",
    border: "1px solid var(--border)",
    borderRadius: 4,
    color: "var(--text)",
    fontFamily: "var(--mono)",
    fontSize: 16,
    padding: "10px",
  },
  comentarioInput: {
    width: "100%",
    background: "#0d0d0d",
    border: "1px solid var(--border)",
    borderRadius: 4,
    color: "var(--text)",
    fontFamily: "var(--sans)",
    fontSize: 15,
    padding: "11px 10px",
  },
  contadorComentario: {
    alignSelf: "flex-end",
    fontFamily: "var(--mono)",
    fontSize: 10,
    color: "var(--muted)",
  },
  errorSolicitud: {
    fontFamily: "var(--mono)",
    fontSize: 12,
    color: "#ff8080",
  },
  formActions: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },
  btnSecundario: {
    background: "transparent",
    border: "1px solid var(--border)",
    borderRadius: 4,
    color: "var(--muted)",
    fontFamily: "var(--mono)",
    fontSize: 11,
    letterSpacing: 2,
    padding: "12px",
    cursor: "pointer",
    textTransform: "uppercase",
  },
  btnConfirmarPop: {
    background: "var(--accent)",
    border: "none",
    borderRadius: 4,
    color: "#000",
    fontFamily: "var(--mono)",
    fontWeight: 600,
    fontSize: 11,
    letterSpacing: 2,
    padding: "12px",
    cursor: "pointer",
    textTransform: "uppercase",
  },
  solicitudOk: {
    background: "#0f1f18",
    border: "1px solid #1f5c46",
    borderRadius: 4,
    color: "var(--accent)",
    fontFamily: "var(--mono)",
    fontSize: 12,
    letterSpacing: 1,
    padding: "12px",
    textAlign: "center",
    textTransform: "uppercase",
  },
  btnEntrar: {
    width: "100%",
    background: "var(--accent)",
    border: "none",
    borderRadius: 4,
    color: "#000",
    fontFamily: "var(--mono)",
    fontWeight: 600,
    fontSize: 13,
    letterSpacing: 2,
    padding: "14px",
    cursor: "pointer",
    textTransform: "uppercase",
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
