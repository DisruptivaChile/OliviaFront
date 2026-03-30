// =============================================
// backend/routes/clientes.js
// Endpoint de lookup para autocompletar checkout
// =============================================

const express = require('express');
const router  = express.Router();
const db      = require('../config/database');

// -----------------------------------------------
// GET /api/clientes/lookup?email=X
// Busca un cliente histórico por email.
// Devuelve solo los datos de contacto/envío — sin información sensible.
// No requiere autenticación (necesario para el checkout anónimo).
// -----------------------------------------------
router.get('/lookup', async (req, res) => {
  const email = (req.query.email || '').trim().toLowerCase();

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email requerido' });
  }

  // Validación básica de formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: 'Email inválido' });
  }

  try {
    const { rows } = await db.query(
      `SELECT
         nombre,
         apellido,
         telefono,
         direccion,
         direccion_apt,
         ciudad,
         codigo_postal,
         region,
         pais
       FROM clientes_historial
       WHERE email = $1
       LIMIT 1`,
      [email]
    );

    if (rows.length === 0) {
      return res.json({ success: true, encontrado: false });
    }

    return res.json({
      success:    true,
      encontrado: true,
      datos: rows[0]
    });

  } catch (err) {
    console.error('Error en lookup de cliente:', err.message);
    return res.status(500).json({ success: false, message: 'Error interno' });
  }
});

module.exports = router;
