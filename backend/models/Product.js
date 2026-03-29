// =============================================
// backend/models/Product.js
// =============================================

const db = require('../config/database');

class Product {

    // -----------------------------------------------
    // Obtener todos los productos publicados
    // -----------------------------------------------
    static async getAll(filters = {}) {
        try {
            let query = `
                SELECT
                    z.id,
                    z.nombre,
                    z.precio,
                    z.precio_original,
                    z.en_oferta,
                    z.descripcion,
                    z.es_a_pedido,
                    z.publicado,
                    t.nombre  AS tipo,
                    te.nombre AS temporada,
                    (
                        SELECT ruta_imagen
                        FROM zapato_imagenes
                        WHERE zapato_id = z.id AND es_principal = TRUE
                        LIMIT 1
                    ) AS imagen_principal,
                    COALESCE(
                        json_agg(
                            DISTINCT jsonb_build_object(
                                'id',           zi.id,
                                'url',          zi.ruta_imagen,
                                'es_principal', zi.es_principal,
                                'orden',        zi.orden_display
                            )
                        ) FILTER (WHERE zi.id IS NOT NULL),
                        '[]'
                    ) AS imagenes,
                    COALESCE(
                        json_agg(
                            DISTINCT jsonb_build_object(
                                'talla', ta.numero_talla,
                                'stock', zt.stock
                            )
                        ) FILTER (WHERE ta.id IS NOT NULL AND zt.stock > 0),
                        '[]'
                    ) AS tallas
                FROM zapatos z
                LEFT JOIN tipos_zapato    t  ON z.tipo_id      = t.id
                LEFT JOIN temporadas      te ON z.temporada_id = te.id
                LEFT JOIN zapato_imagenes zi ON z.id           = zi.zapato_id
                LEFT JOIN zapato_tallas   zt ON z.id           = zt.zapato_id
                LEFT JOIN tallas          ta ON zt.talla_id    = ta.id
                WHERE z.publicado = TRUE
            `;

            const params = [];
            let idx = 1;

            if (filters.es_a_pedido !== undefined) {
                query += ` AND z.es_a_pedido = $${idx}`;
                params.push(filters.es_a_pedido);
                idx++;
            }

            if (filters.tipo_id) {
                query += ` AND z.tipo_id = $${idx}`;
                params.push(parseInt(filters.tipo_id));
                idx++;
            }

            if (filters.temporada_id) {
                query += ` AND z.temporada_id = $${idx}`;
                params.push(parseInt(filters.temporada_id));
                idx++;
            }

            if (filters.search) {
                query += ` AND z.nombre ILIKE $${idx}`;
                params.push(`%${filters.search}%`);
                idx++;
            }

            if (filters.precioMin) {
                query += ` AND z.precio >= $${idx}`;
                params.push(parseFloat(filters.precioMin));
                idx++;
            }

            if (filters.precioMax) {
                query += ` AND z.precio <= $${idx}`;
                params.push(parseFloat(filters.precioMax));
                idx++;
            }

            if (filters.talla) {
                query += `
                    AND EXISTS (
                        SELECT 1 FROM zapato_tallas zt2
                        JOIN tallas ta2 ON zt2.talla_id = ta2.id
                        WHERE zt2.zapato_id = z.id
                          AND ta2.numero_talla = $${idx}
                          AND zt2.stock > 0
                    )
                `;
                params.push(filters.talla);
                idx++;
            }

            query += ` GROUP BY z.id, t.nombre, te.nombre ORDER BY z.id DESC`;

            const result = await db.query(query, params);
            return result.rows;

        } catch (error) {
            console.error('❌ Error en Product.getAll:', error);
            throw error;
        }
    }

    // -----------------------------------------------
    // Obtener un producto por ID con detalle completo
    // -----------------------------------------------
    static async getById(id) {
        try {
            const result = await db.query(`
                SELECT
                    z.id,
                    z.nombre,
                    z.precio,
                    z.descripcion,
                    z.materiales,
                    z.historia,
                    z.musica_url,
                    z.es_a_pedido,
                    t.nombre  AS tipo,
                    te.nombre AS temporada,
                    (
                        SELECT ruta_imagen
                        FROM zapato_imagenes
                        WHERE zapato_id = z.id AND es_principal = TRUE
                        LIMIT 1
                    ) AS imagen_principal,
                    COALESCE(
                        json_agg(
                            DISTINCT jsonb_build_object(
                                'id',           zi.id,
                                'url',          zi.ruta_imagen,
                                'es_principal', zi.es_principal,
                                'orden',        zi.orden_display
                            )
                        ) FILTER (WHERE zi.id IS NOT NULL),
                        '[]'
                    ) AS imagenes,
                    COALESCE(
                        json_agg(
                            DISTINCT jsonb_build_object(
                                'talla', ta.numero_talla,
                                'stock', zt.stock
                            )
                        ) FILTER (WHERE ta.id IS NOT NULL AND zt.stock > 0),
                        '[]'
                    ) AS tallas
                FROM zapatos z
                LEFT JOIN tipos_zapato    t  ON z.tipo_id      = t.id
                LEFT JOIN temporadas      te ON z.temporada_id = te.id
                LEFT JOIN zapato_imagenes zi ON z.id           = zi.zapato_id
                LEFT JOIN zapato_tallas   zt ON z.id           = zt.zapato_id
                LEFT JOIN tallas          ta ON zt.talla_id    = ta.id
                WHERE z.id = $1 AND z.publicado = TRUE
                GROUP BY z.id, t.nombre, te.nombre
            `, [id]);

            return result.rows[0] || null;

        } catch (error) {
            console.error('❌ Error en Product.getById:', error);
            throw error;
        }
    }

    // -----------------------------------------------
    // Obtener tipos de zapato
    // -----------------------------------------------
    static async getTypes() {
        try {
            const result = await db.query(`
                SELECT id, nombre FROM tipos_zapato ORDER BY nombre
            `);
            return result.rows;
        } catch (error) {
            console.error('❌ Error en Product.getTypes:', error);
            throw error;
        }
    }

    // -----------------------------------------------
    // Obtener temporadas activas
    // -----------------------------------------------
    static async getTemporadas() {
        try {
            const result = await db.query(`
                SELECT id, nombre FROM temporadas
                WHERE activa = TRUE ORDER BY nombre
            `);
            return result.rows;
        } catch (error) {
            console.error('❌ Error en Product.getTemporadas:', error);
            throw error;
        }
    }

    // -----------------------------------------------
    // Obtener productos destacados (más recientes)
    // -----------------------------------------------
    static async getFeatured(limit = 6) {
        try {
            const result = await db.query(`
                SELECT
                    z.id,
                    z.nombre,
                    z.precio,
                    z.es_a_pedido,
                    t.nombre AS tipo,
                    (
                        SELECT ruta_imagen
                        FROM zapato_imagenes
                        WHERE zapato_id = z.id AND es_principal = TRUE
                        LIMIT 1
                    ) AS imagen_principal
                FROM zapatos z
                LEFT JOIN tipos_zapato t ON z.tipo_id = t.id
                WHERE z.publicado = TRUE AND z.es_a_pedido = FALSE
                ORDER BY z.id DESC
                LIMIT $1
            `, [limit]);

            return result.rows;
        } catch (error) {
            console.error('❌ Error en Product.getFeatured:', error);
            throw error;
        }
    }
}

module.exports = Product;