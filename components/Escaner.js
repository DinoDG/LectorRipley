import { useEffect, useRef, useState } from "react"

export default function Escaner({ onDetectado, onCerrar }) {
  const videoRef    = useRef(null)
  const readerRef   = useRef(null)
  const [error, setError]   = useState(null)
  const [listo, setListo]   = useState(false)

 useEffect(() => {
    let activo = true

    async function iniciar() {
      try {
        const { BrowserMultiFormatReader, NotFoundException } = await import("@zxing/library")

        const reader = new BrowserMultiFormatReader()
        readerRef.current = reader

        if (!activo) return
        setListo(true)

        await reader.decodeFromVideoDevice(
          undefined,        // undefined = zxing elige la cámara disponible
          videoRef.current,
          (resultado, err) => {
            if (!activo) return
            if (resultado) {
              const texto = resultado.getText()
              if (/^\d{12,13}$/.test(texto)) {
                onDetectado(texto)
              }
            }
            if (err && !(err instanceof NotFoundException)) {
              console.warn("Scanner error:", err)
            }
          }
        )
      } catch (e) {
        if (!activo) return
        if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
          setError("Sin permiso para acceder a la cámara.\nHabilítala en ajustes del navegador.")
        } else if (e.name === "NotFoundError") {
          setError("No se encontró ninguna cámara en este dispositivo.")
        } else {
          setError(`Error al iniciar cámara: ${e.message}`)
        }
      }
    }

    iniciar()

    return () => {
      activo = false
      readerRef.current?.reset()
    }
  }, [])

  return (
    <div style={s.overlay}>

      {/* Fondo semitransparente clickeable para cerrar */}
      <div style={s.backdrop} onClick={onCerrar} />

      <div style={s.modal}>

        {/* Header */}
        <div style={s.header}>
          <span style={s.titulo}>ESCANEAR CÓDIGO</span>
          <button style={s.btnCerrar} onClick={onCerrar}>✕</button>
        </div>

        {/* Visor de cámara */}
        <div style={s.visorWrap}>
          <video
            ref={videoRef}
            style={s.video}
            playsInline
            muted
          />

          {/* Marco de escaneo */}
          {listo && !error && (
            <>
              <div style={s.marco} />
              <div style={s.lineaScan} />
            </>
          )}

          {/* Estado de carga */}
          {!listo && !error && (
            <div style={s.estadoCenter}>
              <span style={s.spinner} />
              <span style={s.estadoTexto}>iniciando cámara…</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={s.estadoCenter}>
              <span style={{ fontSize: 32, marginBottom: 12 }}>📷</span>
              <p style={s.errorTexto}>{error}</p>
            </div>
          )}
        </div>

        <p style={s.instruccion}>
          Apunta al código de barras del producto
        </p>
      </div>

      <style>{`
        @keyframes scanLine {
          0%   { top: 18%; }
          50%  { top: 78%; }
          100% { top: 18%; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

const s = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 100,
    display: "flex",
    alignItems: "flex-end",
  },
  backdrop: {
    position: "absolute",
    inset: 0,
    background: "rgba(0,0,0,0.85)",
  },
  modal: {
    position: "relative",
    zIndex: 1,
    width: "100%",
    background: "var(--surface)",
    borderRadius: "16px 16px 0 0",
    borderTop: "1px solid var(--border)",
    overflow: "hidden",
    paddingBottom: "env(safe-area-inset-bottom, 16px)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    borderBottom: "1px solid var(--border)",
  },
  titulo: {
    fontFamily: "var(--mono)",
    fontSize: 11,
    letterSpacing: 3,
    color: "var(--accent)",
  },
  btnCerrar: {
    background: "transparent",
    border: "1px solid var(--border)",
    borderRadius: 4,
    color: "var(--muted)",
    fontFamily: "var(--mono)",
    fontSize: 14,
    padding: "4px 10px",
    cursor: "pointer",
  },
  visorWrap: {
    position: "relative",
    width: "100%",
    aspectRatio: "4/3",
    background: "#000",
    overflow: "hidden",
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  marco: {
    position: "absolute",
    top: "15%",
    left: "10%",
    right: "10%",
    bottom: "15%",
    border: "2px solid var(--accent)",
    borderRadius: 4,
    boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)",
    pointerEvents: "none",
  },
  lineaScan: {
    position: "absolute",
    left: "11%",
    right: "11%",
    height: 2,
    background: "var(--accent)",
    boxShadow: "0 0 8px var(--accent)",
    animation: "scanLine 2s ease-in-out infinite",
    pointerEvents: "none",
  },
  estadoCenter: {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    background: "rgba(0,0,0,0.7)",
  },
  spinner: {
    display: "inline-block",
    width: 24,
    height: 24,
    border: "2px solid var(--border)",
    borderTopColor: "var(--accent)",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  estadoTexto: {
    fontFamily: "var(--mono)",
    fontSize: 13,
    color: "var(--muted)",
  },
  errorTexto: {
    fontFamily: "var(--mono)",
    fontSize: 13,
    color: "#ff8080",
    textAlign: "center",
    padding: "0 24px",
    whiteSpace: "pre-line",
    lineHeight: 1.6,
  },
  instruccion: {
    fontFamily: "var(--mono)",
    fontSize: 11,
    letterSpacing: 1,
    color: "var(--muted)",
    textAlign: "center",
    padding: "14px 20px",
  },
}