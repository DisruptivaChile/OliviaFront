-- ========================================
-- DATOS DE EJEMPLO PARA TESTING
-- Olivia Merino - Productos de Prueba
-- ========================================

-- IMPORTANTE: Ejecutar después de schema.sql

-- ========================================
-- LIMPIAR DATOS ANTERIORES (CUIDADO!)
-- ========================================
-- Descomentar solo si quieres empezar desde cero
-- TRUNCATE zapatos, zapato_tallas, zapato_imagenes RESTART IDENTITY CASCADE;

-- ========================================
-- INSERTAR PRODUCTOS DE EJEMPLO
-- ========================================

-- Producto 1: Sandalia de Cuero
INSERT INTO zapatos (nombre, tipo, precio, descripcion, publicado) 
VALUES (
    'Sandalia de Cuero Premium',
    'sandalia',
    45000.00,
    'Elegante sandalia de cuero genuino con acabados de alta calidad. Perfecta para ocasiones especiales.',
    true
) RETURNING id;

-- Producto 2: Botín Negro
INSERT INTO zapatos (nombre, tipo, precio, descripcion, publicado) 
VALUES (
    'Botín Negro Elegante',
    'botin',
    65000.00,
    'Botín de cuero negro con tacón medio. Ideal para look formal y casual.',
    true
) RETURNING id;

-- Producto 3: Zapato Casual
INSERT INTO zapatos (nombre, tipo, precio, descripcion, publicado) 
VALUES (
    'Zapato Casual Confort',
    'zapato',
    55000.00,
    'Zapato casual ultra cómodo para uso diario. Plantilla acolchada.',
    true
) RETURNING id;

-- Producto 4: Sandalia Plana
INSERT INTO zapatos (nombre, tipo, precio, descripcion, publicado) 
VALUES (
    'Sandalia Plana Verano',
    'sandalia',
    35000.00,
    'Sandalia plana perfecta para el verano. Liviana y cómoda.',
    true
) RETURNING id;

-- ========================================
-- INSERTAR STOCK POR TALLAS
-- ========================================
-- Asumiendo que los IDs de los zapatos son 1, 2, 3, 4

-- Sandalia de Cuero (ID: 1) - Tallas 37-40
INSERT INTO zapato_tallas (zapato_id, talla_id, stock) 
SELECT 1, id, 5 FROM tallas WHERE numero_talla IN ('37', '38', '39', '40');

-- Botín Negro (ID: 2) - Tallas 36-39
INSERT INTO zapato_tallas (zapato_id, talla_id, stock) 
SELECT 2, id, 3 FROM tallas WHERE numero_talla IN ('36', '37', '38', '39');

-- Zapato Casual (ID: 3) - Tallas 38-42
INSERT INTO zapato_tallas (zapato_id, talla_id, stock) 
SELECT 3, id, 4 FROM tallas WHERE numero_talla IN ('38', '39', '40', '41', '42');

-- Sandalia Plana (ID: 4) - Tallas 35-38
INSERT INTO zapato_tallas (zapato_id, talla_id, stock) 
SELECT 4, id, 6 FROM tallas WHERE numero_talla IN ('35', '36', '37', '38');

-- ========================================
-- INSERTAR IMÁGENES DE EJEMPLO
-- ========================================
-- NOTA: Estas rutas deben coincidir con imágenes reales en tu proyecto

-- Imágenes para Sandalia de Cuero
INSERT INTO zapato_imagenes (zapato_id, ruta_imagen, es_principal) VALUES
(1, 'assets/images/products/sandalia-cuero-1.jpg', true),
(1, 'assets/images/products/sandalia-cuero-2.jpg', false);

-- Imágenes para Botín Negro
INSERT INTO zapato_imagenes (zapato_id, ruta_imagen, es_principal) VALUES
(2, 'assets/images/products/botin-negro-1.jpg', true),
(2, 'assets/images/products/botin-negro-2.jpg', false);

-- Imágenes para Zapato Casual
INSERT INTO zapato_imagenes (zapato_id, ruta_imagen, es_principal) VALUES
(3, 'assets/images/products/zapato-casual-1.jpg', true);

-- Imágenes para Sandalia Plana
INSERT INTO zapato_imagenes (zapato_id, ruta_imagen, es_principal) VALUES
(4, 'assets/images/products/sandalia-plana-1.jpg', true);

-- ========================================
-- CREAR USUARIO ADMIN DE PRUEBA
-- ========================================
-- Password: admin123 (hasheada con bcrypt)
-- NOTA: En producción usa contraseñas seguras y hashing real

INSERT INTO usuarios_admin (email, nombre, password_hash) 
VALUES (
    'admin@oliviamerino.com',
    'Administrador',
    '$2b$10$rBV2kSXW.X9YvS5tQj3.SekT7PJv8t8Z8Zk8F3oK7.8e8L9m8M0a2'
) ON CONFLICT (email) DO NOTHING;

-- ========================================
-- VERIFICAR DATOS INSERTADOS
-- ========================================
SELECT 
    '✅ Productos insertados' as status,
    COUNT(*) as cantidad 
FROM zapatos;

SELECT 
    '✅ Relaciones talla-stock' as status,
    COUNT(*) as cantidad 
FROM zapato_tallas;

SELECT 
    '✅ Imágenes insertadas' as status,
    COUNT(*) as cantidad 
FROM zapato_imagenes;

-- ========================================
-- CONSULTA DE VERIFICACIÓN COMPLETA
-- ========================================
SELECT 
    z.id,
    z.nombre,
    z.tipo,
    z.precio,
    z.publicado,
    COUNT(DISTINCT zt.id) as tallas_disponibles,
    COUNT(DISTINCT zi.id) as imagenes
FROM zapatos z
LEFT JOIN zapato_tallas zt ON z.id = zt.zapato_id
LEFT JOIN zapato_imagenes zi ON z.id = zi.zapato_id
GROUP BY z.id
ORDER BY z.id;

COMMIT;
