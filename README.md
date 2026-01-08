# OLIVIA MERINO - Tienda de Zapatos Premium

Una tienda de zapatos online moderna y elegante, con funcionalidades completas de e-commerce, backend Node.js, diseño responsive y **manual de marca implementado**.

## 🎨 Manual de Marca

Este proyecto implementa el **Manual de Identidad Visual de Olivia Merino**:

- ✅ **Paleta de colores oficial**: Marfil cálido (#F5F5F0), negro suave (#2A2A2A)
- ✅ **Sistema tipográfico**: Adelia + Poppins según jerarquías
- ✅ **Colores de acento**: Morado, verde, rosado, naranja, beige
- ✅ **Diseño editorial**: Grid basado en composición ordenada
- ✅ **Productos protagonistas**: Espacios limpios que realzan texturas

📘 **Documentación:**
- [MANUAL-MARCA.md](MANUAL-MARCA.md) - Guía completa de implementación
- [GUIA-RAPIDA.md](GUIA-RAPIDA.md) - Referencia rápida de colores y clases
- [ejemplos-marca.html](ejemplos-marca.html) - Ejemplos visuales de uso
- [css/brand-patterns.css](css/brand-patterns.css) - Patrones reutilizables

## 🚀 Características

- **Catálogo de Productos**: Sistema completo con base de datos PostgreSQL
- **Backend Node.js + Express**: API REST profesional
- **Sistema de Filtros**: Por categoría, tipo y precio
- **Búsqueda en tiempo real**: Encuentra productos fácilmente
- **Carrito de Compras**: Persistente con LocalStorage
- **Diseño Responsive**: Funciona perfectamente en móviles, tablets y desktop
- **Animaciones Suaves**: Experiencia de usuario moderna
- **Base de Datos Real**: PostgreSQL con gestión completa de inventario
- **🎨 Manual de Marca**: Identidad visual profesional implementada

## 📁 Estructura del Proyecto

```
Olivia/
│
├── index.html              # Página principal
├── productos.html          # Página de productos
├── ejemplos-marca.html     # 🎨 Ejemplos del manual de marca
├── MANUAL-MARCA.md         # 📘 Documentación completa
├── GUIA-RAPIDA.md          # ⚡ Referencia rápida
├── css/
│   ├── styles.css         # Estilos principales (con manual de marca)
│   ├── brand-patterns.css # 🎨 Patrones del manual
│   └── main.css           # Sistema modular
├── js/
│   └── app.js             # Lógica del frontend
├── data/
│   └── products.json      # Fallback (si no hay API)
├── assets/
│   └── images/            # Imágenes de productos
└── backend/               # ⭐ Backend Node.js
    ├── server.js          # Servidor Express
    ├── config/
    │   └── database.js    # Conexión PostgreSQL
    ├── models/
    │   └── Product.js     # Modelo de productos
    ├── routes/
    │   └── products.js    # Rutas de la API
    ├── database/
    │   ├── schema.sql     # Estructura de BD
    │   └── seed.sql       # Datos de prueba
    └── .env               # Variables de entorno
```

## 🛠️ Tecnologías Utilizadas

### Frontend
- **HTML5**: Estructura semántica
- **CSS3**: Grid, Flexbox, Animaciones
- **Manual de Marca**: Sistema de diseño Olivia Merino
- **JavaScript ES6+**: Async/await, LocalStorage, Fetch API
- **Font Awesome**: Iconos

### Backend
- **Node.js**: Runtime de JavaScript
- **Express**: Framework web
- **PostgreSQL**: Base de datos relacional
- **pg**: Cliente PostgreSQL para Node.js
- **CORS**: Manejo de peticiones cross-origin
- **Helmet**: Seguridad HTTP

## 🚦 Instalación y Uso

### Opción 1: Solo Frontend (Sin Base de Datos)

```bash
# Usar Live Server en VS Code
# O abrir index.html directamente en el navegador
```

### Opción 2: Frontend + Backend (RECOMENDADO)

#### Paso 1: Configurar Backend

```bash
# 1. Instalar dependencias
cd backend
npm install

# 2. Configurar base de datos
# - Crear base de datos en PostgreSQL (pgAdmin)
# - Ejecutar: backend/database/schema.sql
# - (Opcional) Ejecutar: backend/database/seed.sql

# 3. Configurar variables de entorno
# - El archivo .env ya está configurado
# - Ajustar si tus credenciales son diferentes

# 4. Iniciar servidor
npm run dev
```

**El servidor estará en:** `http://localhost:3000`

#### Paso 2: Abrir Frontend

```bash
# Desde la raíz del proyecto
# Usar Live Server en VS Code
# O servir con:
npx serve
```

**El frontend estará en:** `http://localhost:5500` o similar

### 📖 Documentación Adicional

- [Backend README](backend/README.md) - Documentación completa de la API
- [Guía de Migración](backend/MIGRATION.md) - Cómo migrar desde el proyecto PHP

### Opción 2: Abrir directamente

Simplemente abre `index.html` en tu navegador favorito.

## 📱 Funcionalidades Principales

### 1. Navegación y Búsqueda
- Barra de búsqueda en tiempo real
- Filtros por categoría (Mujer, Hombre, Niños)
- Filtros por tipo (Deportivo, Casual, Formal, Botas)
- Filtros por rango de precio

### 2. Carrito de Compras
- Añadir/eliminar productos
- Ajustar cantidades
- Total calculado automáticamente
- Guardado en LocalStorage (persiste al cerrar el navegador)

### 3. Diseño Responsive
- Mobile First
- Breakpoints: 480px, 768px, 1024px
- Menú hamburguesa en móviles
- Grid adaptable

## 🎨 Personalización

### Colores
Edita las variables CSS en `styles.css`:

```css
:root {
    --primary-color: #2c3e50;
    --secondary-color: #e74c3c;
    --accent-color: #3498db;
}
```

### Productos
Edita `data/products.json` para añadir, modificar o eliminar productos.

## 🔄 Migración a Base de Datos

Este proyecto está preparado para migrar fácilmente a una base de datos real:

### Opción 1: Node.js + Express + MongoDB

```javascript
// Ejemplo de endpoint
app.get('/api/products', async (req, res) => {
    const products = await Product.find();
    res.json({ products });
});
```

### Opción 2: Node.js + Express + PostgreSQL

```javascript
// Ejemplo de endpoint
app.get('/api/products', async (req, res) => {
    const result = await pool.query('SELECT * FROM products');
    res.json({ products: result.rows });
});
```

Solo necesitas cambiar en `app.js`:

```javascript
// De:
const response = await fetch('data/products.json');

// A:
const response = await fetch('/api/products');
```

## 📋 Próximas Mejoras Sugeridas

- [ ] Sistema de autenticación de usuarios
- [ ] Página de detalle de producto individual
- [ ] Sistema de reviews y valoraciones
- [ ] Integración con pasarela de pago (Stripe/PayPal)
- [ ] Panel de administración
- [ ] Wishlist (lista de deseos)
- [ ] Comparador de productos
- [ ] Sistema de cupones y descuentos
- [ ] Newsletter funcional
- [ ] Seguimiento de pedidos

## 🌐 Backend Sugerido (Opcional)

Para hacerlo completamente funcional con base de datos:

```bash
# Instalar dependencias
npm init -y
npm install express mongoose dotenv cors

# Crear servidor básico
node server.js
```

## 📝 Licencia

Este proyecto está creado para uso educativo y personal.

## 👤 Autor

**Olivia Merino Store**
- Tienda de zapatos premium
- Año: 2025

---

¡Disfruta de tu nueva tienda online! 🎉👟
