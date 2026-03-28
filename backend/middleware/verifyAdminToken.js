// =============================================
// backend/middleware/verifyAdminToken.js
// Verifica que la petición viene del admin
// El admin usa sessionStorage en el frontend,
// pero el token que se envía es el adminToken
// de sessionStorage como Bearer header
// =============================================

function verifyAdminToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token      = authHeader && authHeader.split(' ')[1];

    // El panel admin usa sessionStorage.adminToken = 'active'
    // Para las rutas protegidas el frontend envía ese valor como Bearer
    if (!token || token !== 'active') {
        return res.status(401).json({
            success: false,
            message: 'Acceso restringido. Solo administradores.'
        });
    }

    next();
}

module.exports = verifyAdminToken;