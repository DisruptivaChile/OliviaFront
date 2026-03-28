// =============================================
// backend/config/passport.js
// Estrategias OAuth: Google + Facebook
// =============================================

const passport         = require('passport');
const GoogleStrategy   = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const db               = require('./database');


// ── Helper compartido: buscar o crear usuario OAuth ───────────────────
async function buscarOCrearUsuarioOAuth({ proveedor, proveedorId, email, nombre, apellido, avatarUrl }) {
    // 1. Ya existe vinculo OAuth con este ID?
    const oauthResult = await db.query(
        `SELECT u.*
         FROM usuarios_oauth uo
         JOIN usuarios u ON u.id = uo.usuario_id
         WHERE uo.proveedor = $1 AND uo.proveedor_id = $2`,
        [proveedor, proveedorId]
    );

    if (oauthResult.rows.length > 0) {
        return oauthResult.rows[0];
    }

    // 2. Existe cuenta clasica con ese email?
    let usuario;

    if (email) {
        const userResult = await db.query(
            'SELECT * FROM usuarios WHERE email = $1',
            [email.toLowerCase()]
        );
        if (userResult.rows.length > 0) {
            usuario = userResult.rows[0];
        }
    }

    // 3. Crear usuario nuevo si no existe
    if (!usuario) {
        const nuevoUsuario = await db.query(
            `INSERT INTO usuarios (nombre, apellido, email)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [nombre, apellido || '', email ? email.toLowerCase() : null]
        );
        usuario = nuevoUsuario.rows[0];
    }

    // 4. Crear vinculo en usuarios_oauth
    await db.query(
        `INSERT INTO usuarios_oauth (usuario_id, proveedor, proveedor_id, email_oauth, avatar_url)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (proveedor, proveedor_id) DO NOTHING`,
        [usuario.id, proveedor, proveedorId, email ? email.toLowerCase() : null, avatarUrl || null]
    );

    return usuario;
}


// ══════════════════════════════════════════
// ESTRATEGIA GOOGLE
// ══════════════════════════════════════════
passport.use(new GoogleStrategy(
    {
        clientID:     process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:  process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            const usuario = await buscarOCrearUsuarioOAuth({
                proveedor:   'google',
                proveedorId: profile.id,
                email:       profile.emails?.[0]?.value,
                nombre:      profile.name?.givenName  || profile.displayName,
                apellido:    profile.name?.familyName || '',
                avatarUrl:   profile.photos?.[0]?.value || null,
            });
            return done(null, usuario);
        } catch (error) {
            console.error('Error en estrategia Google:', error);
            return done(error, null);
        }
    }
));


// ══════════════════════════════════════════
// ESTRATEGIA FACEBOOK
// ══════════════════════════════════════════
passport.use(new FacebookStrategy(
    {
        clientID:      process.env.FACEBOOK_APP_ID,
        clientSecret:  process.env.FACEBOOK_APP_SECRET,
        callbackURL:   process.env.FACEBOOK_CALLBACK_URL,
        profileFields: ['id', 'emails', 'name', 'photos'],
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            const email    = profile.emails?.[0]?.value || null;
            const nombre   = profile.name?.givenName  || profile.displayName || 'Usuario';
            const apellido = profile.name?.familyName || '';
            const avatar   = profile.photos?.[0]?.value || null;

            const usuario = await buscarOCrearUsuarioOAuth({
                proveedor:   'facebook',
                proveedorId: profile.id,
                email,
                nombre,
                apellido,
                avatarUrl:   avatar,
            });
            return done(null, usuario);
        } catch (error) {
            console.error('Error en estrategia Facebook:', error);
            return done(error, null);
        }
    }
));


// ── Serialize/Deserialize ──
passport.serializeUser((user, done)       => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const result = await db.query('SELECT * FROM usuarios WHERE id = $1', [id]);
        done(null, result.rows[0] || null);
    } catch (err) {
        done(err, null);
    }
});

module.exports = passport;