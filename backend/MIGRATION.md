# 📦 Guía de Migración - Olivia Merino Backend

Esta guía te ayudará a migrar la base de datos PostgreSQL existente y conectar el backend Node.js.

## 🎯 Objetivo

Integrar el backend Node.js con la base de datos PostgreSQL que ya existe del proyecto PHP.

## ✅ Pre-requisitos

1. **PostgreSQL instalado y corriendo**
2. **Node.js v16 o superior**
3. **Base de datos `olivia_zapatos_new` existente** (del repo PHP)
4. **Usuario `olivia_user` con permisos**

## 📋 Pasos de Migración

### 1. Verificar PostgreSQL

Abre **pgAdmin** o la consola de PostgreSQL y verifica:

```sql
-- Conectarse a la base de datos
\c olivia_zapatos_db

-- Ver tablas existentes
\dt

-- Deberías ver:
-- zapatos
-- tallas
-- zapato_tallas
-- zapato_imagenes
-- usuarios_admin
```

### 2. Verificar Estructura de Tablas

Si las tablas NO existen, ejecuta el script de migración:

```bash
# Opción 1: Desde pgAdmin
# Abrir Query Tool y ejecutar: backend/database/schema.sql

# Opción 2: Desde terminal
psql -U olivia_user -d olivia_zapatos_db -f backend/database/schema.sql
```

### 3. Verificar Datos Existentes

```sql
-- Ver cuántos productos hay
SELECT COUNT(*) FROM zapatos;

-- Ver productos publicados
SELECT id, nombre, tipo, precio, publicado FROM zapatos LIMIT 5;

-- Ver tallas
SELECT * FROM tallas;
```

### 4. Instalar Dependencias del Backend

```bash
cd backend
npm install
```

**Dependencias que se instalarán:**

- `express` - Framework web
- `pg` - Cliente PostgreSQL
- `cors` - Manejo de CORS
- `helmet` - Seguridad HTTP
- `dotenv` - Variables de entorno
- `nodemon` - Auto-reload en desarrollo

### 5. Configurar Variables de Entorno

El archivo `.env` ya está creado con las credenciales del repo PHP:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=olivia_zapatos_db
DB_USER=olivia_user
DB_PASSWORD=0Livia12
```

**⚠️ Si tus credenciales son diferentes, edita el archivo `.env`**

### 6. Probar Conexión

```bash
# Desde la carpeta backend/
npm run dev
```

**Deberías ver:**

```
========================================
🚀 Servidor Olivia Merino Backend
========================================
📡 Servidor corriendo en: http://localhost:3000
✅ Conectado a PostgreSQL
```

### 7. Probar los Endpoints

Abre tu navegador o Postman:

**1. Health Check:**

```
GET http://localhost:3000/health
```

**2. Ver todos los productos:**

```
GET http://localhost:3000/api/products
```

**3. Ver producto específico:**

```
GET http://localhost:3000/api/products/1
```

**4. Filtrar productos:**

```
GET http://localhost:3000/api/products?tipo=sandalia
GET http://localhost:3000/api/products?search=cuero
```

### 8. Conectar Frontend

El archivo `js/app.js` ya está modificado para usar la API.

**Para activar la API:**

```javascript
// En js/app.js, línea 7
const USE_API = true; // Ya está configurado
```

**Abrir el frontend:**

1. Usa Live Server en VS Code
2. O abre `index.html` directamente
3. El frontend automáticamente cargará productos desde la API

## 🔧 Solución de Problemas

### Error: "connect ECONNREFUSED"

**Problema:** No puede conectar a PostgreSQL

**Solución:**

1. Verifica que PostgreSQL esté corriendo:
   ```bash
   # Windows: Buscar en Services "PostgreSQL"
   # O desde pgAdmin
   ```
2. Verifica credenciales en `.env`
3. Confirma que el puerto 5432 esté libre

### Error: "relation does not exist"

**Problema:** Las tablas no existen

**Solución:**

```bash
# Ejecutar el script de creación
psql -U olivia_user -d olivia_zapatos_db -f backend/database/schema.sql
```

### Error: "no data" en la API

**Problema:** No hay productos publicados

**Solución:**

```sql
-- Publicar todos los productos
UPDATE zapatos SET publicado = true;

-- O insertar datos de prueba
-- Ejecutar: backend/database/seed.sql
```

### Puerto 3000 ya en uso

**Solución:**

```env
# Cambiar en .env
PORT=3001
```

## 📊 Migración de Datos Existentes

Si ya tienes productos en la BD del proyecto PHP, **no necesitas hacer nada**. El backend Node.js leerá directamente esos datos.

### Verificar Compatibilidad

```sql
-- Ver estructura de la tabla zapatos
\d zapatos

-- Debe tener al menos:
-- id, nombre, tipo, precio, descripcion, a_pedido, publicado
```

### Ajustar Imágenes

Las rutas de las imágenes en la BD deben ser **relativas al proyecto frontend**:

```sql
-- Ver rutas actuales
SELECT ruta_imagen FROM zapato_imagenes LIMIT 5;

-- Si están como 'img/zapatos/foto.jpg' (del PHP)
-- Actualizar a rutas del proyecto Olivia:
UPDATE zapato_imagenes
SET ruta_imagen = REPLACE(ruta_imagen, 'img/zapatos/', 'assets/images/products/');
```

## 🚀 Datos de Prueba (Opcional)

Si la base de datos está vacía o quieres datos de ejemplo:

```bash
psql -U olivia_user -d olivia_zapatos_db -f backend/database/seed.sql
```

Esto insertará:

- 4 productos de ejemplo
- Stock por tallas
- Imágenes de referencia
- Usuario admin

## ✨ Siguiente Paso

Una vez que el backend esté funcionando:

1. **Verificar en el navegador:**
   - Abrir `http://localhost:3000/api/products`
   - Deberías ver JSON con los productos

2. **Abrir el frontend:**
   - Con Live Server en VS Code
   - Los productos se cargarán automáticamente desde la API

3. **Panel de Administración (Futuro):**
   - El panel PHP seguirá funcionando para agregar/editar productos
   - O puedes crear un nuevo panel con React/Vue

## 📝 Notas Importantes

- ✅ El backend es **SOLO LECTURA** (GET requests)
- ✅ Para agregar productos, usa el panel PHP existente
- ✅ El frontend tiene **fallback** a `products.json` si la API falla
- ✅ La BD es compartida entre PHP y Node.js
- ✅ Puedes ejecutar ambos sistemas simultáneamente

## 🆘 Ayuda Adicional

Si encuentras problemas:

1. Revisa los logs del servidor (terminal donde corre `npm run dev`)
2. Verifica la conexión a PostgreSQL en pgAdmin
3. Confirma que hay productos con `publicado = true`
4. Revisa la consola del navegador (F12)
