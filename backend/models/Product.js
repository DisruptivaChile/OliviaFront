const db = require('../config/database');

class Product {
  // Obtener todos los productos publicados con sus imágenes y tallas
  static async getAll(filters = {}) {
    try {
      let query = `
        SELECT 
          z.id,
          z.nombre,
          z.tipo,
          z.precio,
          z.descripcion,
          z.a_pedido,
          z.publicado,
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object(
                'id', zi.id,
                'url', zi.ruta_imagen,
                'es_principal', zi.es_principal
              )
            ) FILTER (WHERE zi.id IS NOT NULL),
            '[]'
          ) as imagenes,
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object(
                'talla', t.numero_talla,
                'stock', zt.stock
              )
            ) FILTER (WHERE t.id IS NOT NULL),
            '[]'
          ) as tallas
        FROM zapatos z
        LEFT JOIN zapato_imagenes zi ON z.id = zi.zapato_id
        LEFT JOIN zapato_tallas zt ON z.id = zt.zapato_id
        LEFT JOIN tallas t ON zt.talla_id = t.id
        WHERE z.publicado = true
      `;

      const params = [];
      let paramCount = 1;

      // Filtro por tipo
      if (filters.tipo) {
        query += ` AND z.tipo = $${paramCount}`;
        params.push(filters.tipo);
        paramCount++;
      }

      // Búsqueda por nombre
      if (filters.search) {
        query += ` AND z.nombre ILIKE $${paramCount}`;
        params.push(`%${filters.search}%`);
        paramCount++;
      }

      // Filtro por precio
      if (filters.precioMin) {
        query += ` AND z.precio >= $${paramCount}`;
        params.push(filters.precioMin);
        paramCount++;
      }

      if (filters.precioMax) {
        query += ` AND z.precio <= $${paramCount}`;
        params.push(filters.precioMax);
        paramCount++;
      }

      query += `
        GROUP BY z.id
        ORDER BY z.id DESC
      `;

      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error al obtener productos:', error);
      throw error;
    }
  }

  // Obtener un producto por ID
  static async getById(id) {
    try {
      const query = `
        SELECT 
          z.id,
          z.nombre,
          z.tipo,
          z.precio,
          z.descripcion,
          z.a_pedido,
          z.publicado,
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object(
                'id', zi.id,
                'url', zi.ruta_imagen,
                'es_principal', zi.es_principal
              )
            ) FILTER (WHERE zi.id IS NOT NULL),
            '[]'
          ) as imagenes,
          COALESCE(
            json_agg(
              DISTINCT jsonb_build_object(
                'talla', t.numero_talla,
                'stock', zt.stock
              )
            ) FILTER (WHERE t.id IS NOT NULL),
            '[]'
          ) as tallas
        FROM zapatos z
        LEFT JOIN zapato_imagenes zi ON z.id = zi.zapato_id
        LEFT JOIN zapato_tallas zt ON z.id = zt.zapato_id
        LEFT JOIN tallas t ON zt.talla_id = t.id
        WHERE z.id = $1 AND z.publicado = true
        GROUP BY z.id
      `;

      const result = await db.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error al obtener producto:', error);
      throw error;
    }
  }

  // Obtener tipos únicos de productos
  static async getTypes() {
    try {
      const query = `
        SELECT DISTINCT tipo 
        FROM zapatos 
        WHERE publicado = true
        ORDER BY tipo
      `;
      const result = await db.query(query);
      return result.rows.map(row => row.tipo);
    } catch (error) {
      console.error('Error al obtener tipos:', error);
      throw error;
    }
  }

  // Obtener productos destacados (puedes personalizar la lógica)
  static async getFeatured(limit = 6) {
    try {
      const query = `
        SELECT 
          z.id,
          z.nombre,
          z.tipo,
          z.precio,
          z.descripcion,
          (SELECT ruta_imagen FROM zapato_imagenes WHERE zapato_id = z.id AND es_principal = true LIMIT 1) as imagen_principal
        FROM zapatos z
        WHERE z.publicado = true
        ORDER BY z.id DESC
        LIMIT $1
      `;
      const result = await db.query(query, [limit]);
      return result.rows;
    } catch (error) {
      console.error('Error al obtener productos destacados:', error);
      throw error;
    }
  }
}

module.exports = Product;
