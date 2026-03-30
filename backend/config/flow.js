/**
 * Flow.cl — módulo de integración de pagos
 * Documentación: https://www.flow.cl/docs/api.html
 */
const crypto = require('crypto');
const https  = require('https');
const qs     = require('querystring');

const FLOW_SANDBOX = 'https://sandbox.flow.cl/api';
const FLOW_PROD    = 'https://www.flow.cl/api';

function getBaseUrl() {
    return process.env.FLOW_ENV === 'production' ? FLOW_PROD : FLOW_SANDBOX;
}

/**
 * Firma HMAC-SHA256 de los parámetros según spec de Flow:
 * 1. Ordenar claves alfabéticamente
 * 2. Concatenar key+value sin separadores
 * 3. HMAC-SHA256 con la secretKey
 */
function sign(params) {
    const secret = process.env.FLOW_SECRET_KEY;
    const keys   = Object.keys(params).sort();
    const str    = keys.map(k => k + params[k]).join('');
    return crypto.createHmac('sha256', secret).update(str).digest('hex');
}

/**
 * Hace un POST a la API de Flow con los parámetros dados.
 * Devuelve el body JSON parseado.
 */
function flowPost(endpoint, params) {
    return new Promise((resolve, reject) => {
        const apiKey = process.env.FLOW_API_KEY;
        const body   = { ...params, apiKey };
        body.s       = sign(body);

        const postData  = qs.stringify(body);
        const baseUrl   = getBaseUrl();
        const urlParsed = new URL(baseUrl + endpoint);

        const options = {
            hostname: urlParsed.hostname,
            path:     urlParsed.pathname,
            method:   'POST',
            headers: {
                'Content-Type':   'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData),
            },
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (_) {
                    reject(new Error('Respuesta inválida de Flow: ' + data));
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

/**
 * Hace un GET a la API de Flow con los parámetros dados.
 * Devuelve el body JSON parseado.
 */
function flowGet(endpoint, params) {
    return new Promise((resolve, reject) => {
        const apiKey = process.env.FLOW_API_KEY;
        const body   = { ...params, apiKey };
        body.s       = sign(body);

        const baseUrl   = getBaseUrl();
        const urlParsed = new URL(baseUrl + endpoint + '?' + qs.stringify(body));

        https.get(urlParsed, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (_) {
                    reject(new Error('Respuesta inválida de Flow: ' + data));
                }
            });
        }).on('error', reject);
    });
}

/**
 * Crea un pago en Flow.
 * @param {Object} opts
 * @param {string} opts.commerceOrder  - Código único de la orden
 * @param {string} opts.subject        - Descripción del pago
 * @param {number} opts.amount         - Monto entero en CLP
 * @param {string} opts.email          - Email del pagador
 * @param {string} opts.urlConfirmation - URL del webhook de confirmación (backend)
 * @param {string} opts.urlReturn      - URL a la que Flow redirige al usuario
 * @returns {{ url: string, token: string }} URL + token de redirección
 */
async function createPayment(opts) {
    const params = {
        commerceOrder:   opts.commerceOrder,
        subject:         opts.subject,
        amount:          String(Math.round(opts.amount)),
        email:           opts.email,
        urlConfirmation: opts.urlConfirmation,
        urlReturn:       opts.urlReturn,
    };

    if (opts.paymentMethod) params.paymentMethod = String(opts.paymentMethod);

    const response = await flowPost('/payment/create', params);
    if (!response.url || !response.token) {
        throw new Error('Flow error al crear pago: ' + JSON.stringify(response));
    }

    return {
        redirectUrl: `${response.url}?token=${response.token}`,
        token:       response.token,
        flowUrl:     response.url,
    };
}

/**
 * Consulta el estado de un pago por token.
 * @param {string} token
 * @returns {Object} Objeto de estado de Flow con campos: status, amount, subject, etc.
 */
async function getPaymentStatus(token) {
    return flowGet('/payment/getStatus', { token });
}

/**
 * Mapea el status numérico de Flow a nuestro estado interno.
 * Flow: 1=pendiente, 2=pagado, 3=rechazado, 4=cancelado
 */
function mapFlowStatus(flowStatus) {
    const map = { 1: 'pendiente', 2: 'pagado', 3: 'cancelado', 4: 'cancelado' };
    return map[flowStatus] || 'pendiente';
}

module.exports = { createPayment, getPaymentStatus, mapFlowStatus, sign };
