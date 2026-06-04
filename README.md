# Consulta Precios Ripley

App móvil para consultar precios en tiempo real desde la API de Ripley.
Desarrollada con Next.js y desplegada en Vercel.

## Estructura

```
ripley-precios/
├── lib/
│   ├── ripley.js      ← lógica de consulta a la API de Ripley (token, carrito, precio)
│   └── supabase.js    ← guardado de productos en Supabase
├── pages/
│   ├── api/
│   │   └── precio.js  ← endpoint GET /api/precio?sku=...
│   ├── _app.js
│   └── index.js       ← UI principal
├── styles/
│   └── globals.css
├── .env.example       ← copia esto como .env.local con tus valores
└── package.json
```

## Cómo desplegar

### 1. Instalar dependencias localmente (opcional, para probar)

```bash
npm install
npm run dev
# Abrir http://localhost:3000
```

### 2. Subir a GitHub

```bash
git init
git add .
git commit -m "init"
# Crear repo en github.com y seguir las instrucciones que te da
git remote add origin https://github.com/TU_USUARIO/ripley-precios.git
git push -u origin main
```

### 3. Desplegar en Vercel

1. Ir a https://vercel.com → New Project
2. Importar el repo de GitHub
3. En "Environment Variables" agregar:

| Variable          | Valor                              |
|-------------------|------------------------------------|
| RIPLEY_STORE_ID   | 10025                              |
| RIPLEY_CART_ID    | a96d8d90-5f69-11f1-8a3c-2f4138c9ac50 |
| SUPABASE_URL      | https://djfaqgrzjtafloxoaeuz.supabase.co |
| SUPABASE_KEY      | tu_key_aqui                        |

4. Click en Deploy → listo.

### 4. Instalar en el teléfono como app (PWA)

- **Android (Chrome)**: abrir la URL → menú "⋮" → "Añadir a pantalla de inicio"
- **iPhone (Safari)**: abrir la URL → botón compartir → "En pantalla de inicio"

## Uso

1. Escribe o escanea el EAN-13 (13 dígitos) o EAN-12 (12 dígitos, el código de verificación se calcula automáticamente)
2. Pulsa → o Enter
3. Aparece el precio, descripción, promo si existe, y metadatos del producto
4. Pulsa "Nueva consulta" para consultar otro producto

## API

```
GET /api/precio?sku=7891010642190
```

Respuesta exitosa (200):
```json
{
  "sku": "7891010642190",
  "descripcion": "Nombre del producto",
  "precio": 9990,
  "promo": "3x2",
  "depto": "ALIMENTOS",
  "linea": "LACTEOS",
  "sublinea": "YOGURT"
}
```

Error (404):
```json
{ "error": "Producto no encontrado" }
```
