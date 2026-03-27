// =============================================
// backend/config/passport.js
// Estrategia Google OAuth 2.0 con Passport.js
// =============================================

const passport       = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db             = require('./database');

passport.use(new GoogleStrategy(
    {
        clientID:     process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:  process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            const email     = profile.emails[0].value;
            const nombre    = profile.name.givenName  || profile.displayName;
            const apellido  = profile.name.familyName || '';
            const avatarUrl = profile.photos[0]?.value || null;
            const googleId  = profile.id;

            // ── 1. ¿Ya existe un vínculo OAuth con este Google ID? ──
            const oauthResult = await db.query(
                `SELECT u.*, uo.id AS oauth_id
                 FROM usuarios_oauth uo
                 JOIN usuarios u ON u.id = uo.usuario_id
                 WHERE uo.proveedor = 'google' AND uo.proveedor_id = $1`,
                [googleId]
            );

            if (oauthResult.rows.length > 0) {
                // Usuario ya conocido → devolvemos el usuario directamente
                return done(null, oauthResult.rows[0]);
            }

            // ── 2. ¿Existe un usuario con ese email (cuenta clásica)? ──
            const userResult = await db.query(
                'SELECT * FROM usuarios WHERE email = $1',
                [email.toLowerCase()]
            );

            let usuario;

            if (userResult.rows.length > 0) {
                // Existe cuenta clásica → vinculamos Google a ella
                usuario = userResult.rows[0];
            } else {
                // ── 3. Crear usuario nuevo ──
                const nuevoUsuario = await db.query(
                    `INSERT INTO usuarios (nombre, apellido, email)
                     VALUES ($1, $2, $3)
                     RETURNING *`,
                    [nombre, apellido, email.toLowerCase()]
                );
                usuario = nuevoUsuario.rows[0];
            }

            // ── 4. Crear el vínculo en usuarios_oauth ──
            await db.query(
                `INSERT INTO usuarios_oauth (usuario_id, proveedor, proveedor_id, email_oauth, avatar_url)
                 VALUES ($1, 'google', $2, $3, $4)
                 ON CONFLICT (proveedor, proveedor_id) DO NOTHING`,
                [usuario.id, googleId, email.toLowerCase(), avatarUrl]
            );

            return done(null, usuario);

        } catch (error) {
            console.error('❌ Error en estrategia Google OAuth:', error);
            return done(error, null);
        }
    }
));

// Passport necesita serialize/deserialize aunque usemos JWT
// (solo para el flujo de redirección OAuth)
passport.serializeUser((user, done)   => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const result = await db.query('SELECT * FROM usuarios WHERE id = $1', [id]);
        done(null, result.rows[0] || null);
    } catch (err) {
        done(err, null);
    }
});

module.exports = passport;