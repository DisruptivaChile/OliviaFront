# 🚀 Olivia Merino - Backend API

Backend Node.js + Express + PostgreSQL para la tienda Olivia Merino.

## 📋 Requisitos Previos

- Node.js (v16 o superior)
- PostgreSQL (v12 o superior)
- npm o yarn

## 🛠️ Instalación

1. **Instalar dependencias:**
```bash
cd backend
npm install
```

2. **Configurar variables de entorno:**
```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar .env con tus credenciales de PostgreSQL
```

3. **Verificar que PostgreSQL esté corriendo:**
```bash
# Windows (desde Services o)
pg_ctl status

# O verificar en pgAdmin
```

4. **La base de datos debe tener la siguiente estructura:**

```sql
-- Tabla principal de zapatos
CREATE TABLE zapatos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    tipo VARCHAR(50),
    precio DECIMAL(10,2),
    descripcion TEXT,
    a_pedido BOOLEAN DEFAULT false,
    publicado BOOLEAN DEFAULT false
);

-- Tabla de tallas
CREATE TABLE tallas (
    id SERIAL PRIMARY KEY,
    numero_talla VARCHAR(10) UNIQUE
);

-- Tabla de relación zapato-talla
CREATE TABLE zapato_tallas (
    id SERIAL PRIMARY KEY,
    zapato_id INTEGER REFERENCES zapatos(id) ON DELETE CASCADE,
    talla_id INTEGER REFERENCES tallas(id),
    stock INTEGER DEFAULT 0
);

-- Tabla de imágenes
CREATE TABLE zapato_imagenes (
    id SERIAL PRIMARY KEY,
    zapato_id INTEGER REFERENCES zapatos(id) ON DELETE CASCADE,
    ruta_imagen VARCHAR(500),
    es_principal BOOLEAN DEFAULT false
);

-- Tabla de usuarios admin (opcional)
CREATE TABLE usuarios_admin (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    nombre VARCHAR(255)
);
```

## ▶️ Ejecutar el Servidor

### Modo desarrollo (con auto-reload):
```bash
npm run dev
```

### Modo producción:
```bash
npm start
```

El servidor estará disponible en: `http://localhost:3000`

## 📡 Endpoints Disponibles

### Base
- `GET /` - Información de la API
- `GET /health` - Estado del servidor y BD

### Productos
- `GET /api/products` - Todos los productos publicados
  - Query params: `?tipo=sandalia&search=cuero&precioMin=10000&precioMax=50000`
- `GET /api/products/:id` - Producto específico por ID
- `GET /api/products/types` - Tipos de productos disponibles
- `GET /api/products/featured` - Productos destacados
  - Query params: `?limit=6`

### Ejemplos de Respuesta

**GET /api/products**
```json
{
  "success": true,
  "count": 10,
  "products": [
    {
      "id": 1,
      "nombre": "Sandalia de Cuero",
      "tipo": "sandalia",
      "precio": 35000,
      "descripcion": "Sandalia elegante de cuero genuino",
      "a_pedido": false,
      "publicado": true,
      "imagenes": [
        {
          "id": 1,
          "url": "img/zapatos/sandalia1.jpg",
          "es_principal": true
        }
      ],
      "tallas": [
        { "talla": "37", "stock": 5 },
        { "talla": "38", "stock": 3 }
      ]
    }
  ]
}
```

## 🔧 Configuración CORS

Por defecto, el servidor acepta peticiones desde cualquier origen en desarrollo. Para producción, configura `FRONTEND_URL` en `.env`:

```env
FRONTEND_URL=https://tu-dominio.com
```

## 🐛 Troubleshooting

### Error: "connect ECONNREFUSED"
- Verifica que PostgreSQL esté corriendo
- Revisa las credenciales en `.env`
- Confirma que el puerto 5432 esté disponible

### Error: "relation does not exist"
- Asegúrate de que las tablas existan en la BD
- Verifica el nombre de la base de datos en `.env`

### Puerto 3000 en uso
- Cambia el puerto en `.env`: `PORT=3001`
- O detén el proceso que usa el puerto

## 📦 Dependencias Principales

- **express**: Framework web
- **pg**: Cliente PostgreSQL
- **cors**: Manejo de CORS
- **helmet**: Seguridad HTTP
- **dotenv**: Variables de entorno

## 🚀 Próximos Pasos

1. Conectar el frontend para consumir esta API
2. Agregar autenticación JWT (opcional)
3. Implementar caché con Redis (opcional)
4. Deploy en Railway/Render/Heroku

## 📝 Notas

- La API solo devuelve productos con `publicado = true`
- Las imágenes deben estar en rutas relativas al proyecto principal
- El pool de PostgreSQL maneja automáticamente las conexiones
