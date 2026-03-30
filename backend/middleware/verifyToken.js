// =============================================
// backend/middleware/verifyToken.js
// Middleware que verifica el JWT en cada
// petici+好 protegida de usuarios normales
// =============================================

const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    // El token llega en el header: Authorization: Bearer <token>
    const authHeader = req.headers['authorization'];
    const token      = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            code:    'TOKEN_REQUERIDO',
            message: 'Acceso denegado. Inicia sesi+好 para continuar.'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario   = decoded; // { id, email, nombre } disponible en la ruta
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                code:    'TOKEN_EXPIRADO',
                message: 'Tu sesi+好 ha expirado. Inicia sesi+好 nuevamente.'
            });
        }
        return res.status(401).json({
            success: false,
            code:    'TOKEN_INVALIDO',
            message: 'Token inv+璱ido.'
        });
    }
}

module.exports = verifyToken;
