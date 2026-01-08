-- ========================================
-- SCRIPT DE MIGRACIÓN DE BASE DE DATOS
-- Olivia Merino - Sistema de Gestión de Zapatos
-- ========================================

-- IMPORTANTE: Ejecutar este script en PostgreSQL
-- Puede usar pgAdmin o línea de comandos

-- 1. TABLA PRINCIPAL: ZAPATOS
-- ========================================
CREATE TABLE IF NOT EXISTS zapatos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) CHECK (tipo IN ('sandalia', 'botin', 'zapato')),
    precio DECIMAL(10,2) NOT NULL,
    descripcion TEXT,
    a_pedido BOOLEAN DEFAULT false,
    publicado BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABLA DE TALLAS
-- ========================================
CREATE TABLE IF NOT EXISTS tallas (
    id SERIAL PRIMARY KEY,
    numero_talla VARCHAR(10) UNIQUE NOT NULL
);

-- 3. TABLA RELACIÓN ZAPATO-TALLA (con stock)
-- ========================================
CREATE TABLE IF NOT EXISTS zapato_tallas (
    id SERIAL PRIMARY KEY,
    zapato_id INTEGER REFERENCES zapatos(id) ON DELETE CASCADE,
    talla_id INTEGER REFERENCES tallas(id) ON DELETE CASCADE,
    stock INTEGER DEFAULT 0 CHECK (stock >= 0),
    UNIQUE(zapato_id, talla_id)
);

-- 4. TABLA DE IMÁGENES
-- ========================================
CREATE TABLE IF NOT EXISTS zapato_imagenes (
    id SERIAL PRIMARY KEY,
    zapato_id INTEGER REFERENCES zapatos(id) ON DELETE CASCADE,
    ruta_imagen VARCHAR(500) NOT NULL,
    es_principal BOOLEAN DEFAULT false
);

-- 5. TABLA DE USUARIOS ADMINISTRADORES
-- ========================================
CREATE TABLE IF NOT EXISTS usuarios_admin (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- ÍNDICES PARA MEJOR RENDIMIENTO
-- ========================================
CREATE INDEX IF NOT EXISTS idx_zapatos_publicado ON zapatos(publicado);
CREATE INDEX IF NOT EXISTS idx_zapatos_tipo ON zapatos(tipo);
CREATE INDEX IF NOT EXISTS idx_zapato_imagenes_zapato_id ON zapato_imagenes(zapato_id);
CREATE INDEX IF NOT EXISTS idx_zapato_tallas_zapato_id ON zapato_tallas(zapato_id);

-- ========================================
-- INSERTAR TALLAS ESTÁNDAR
-- ========================================
INSERT INTO tallas (numero_talla) VALUES 
    ('35'), ('36'), ('37'), ('38'), ('39'), 
    ('40'), ('41'), ('42'), ('43'), ('44')
ON CONFLICT (numero_talla) DO NOTHING;

-- ========================================
-- DATOS DE EJEMPLO (Opcional)
-- ========================================
-- Descomentar para insertar productos de prueba

/*
-- Insertar zapato de ejemplo
INSERT INTO zapatos (nombre, tipo, precio, descripcion, publicado) 
VALUES (
    'Sandalia de Cuero Premium',
    'sandalia',
    45000.00,
    'Elegante sandalia de cuero genuino con acabados de alta calidad',
    true
);

-- Obtener el ID del zapato insertado (cambiar según corresponda)
-- Insertar stock de tallas
INSERT INTO zapato_tallas (zapato_id, talla_id, stock) 
SELECT 1, id, 5 FROM tallas WHERE numero_talla IN ('37', '38', '39', '40');

-- Insertar imagen
INSERT INTO zapato_imagenes (zapato_id, ruta_imagen, es_principal) 
VALUES (1, 'assets/images/products/sandalia1.jpg', true);
*/

-- ========================================
-- VERIFICACIÓN
-- ========================================
-- Descomentar para verificar que todo se creó correctamente

-- SELECT 'Tabla zapatos' as tabla, COUNT(*) as registros FROM zapatos
-- UNION ALL
-- SELECT 'Tabla tallas', COUNT(*) FROM tallas
-- UNION ALL
-- SELECT 'Tabla zapato_tallas', COUNT(*) FROM zapato_tallas
-- UNION ALL
-- SELECT 'Tabla zapato_imagenes', COUNT(*) FROM zapato_imagenes;

-- ========================================
-- FUNCIÓN DE ACTUALIZACIÓN AUTOMÁTICA
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS update_zapatos_updated_at ON zapatos;
CREATE TRIGGER update_zapatos_updated_at 
    BEFORE UPDATE ON zapatos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- PERMISOS (Ajustar según tu usuario)
-- ========================================
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO olivia_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO olivia_user;

COMMIT;

-- ========================================
-- NOTAS IMPORTANTES
-- ========================================
-- 1. Este script es idempotente (se puede ejecutar múltiples veces)
-- 2. Las relaciones ON DELETE CASCADE eliminan automáticamente registros relacionados
-- 3. Los índices mejoran el rendimiento de consultas frecuentes
-- 4. La función update_updated_at mantiene actualizado el timestamp
