// =====================================================================
//  auth.js — Authentification de l'espace administrateur
//  ---------------------------------------------------------------------
//  Un seul compte administrateur. Identifiants configurables via les
//  variables d'environnement ADMIN_USER / ADMIN_PASS (valeurs par
//  défaut fournies ci-dessous). La session repose sur un cookie signé
//  (HMAC), sans base de sessions.
// =====================================================================
const crypto = require('crypto');

const ADMIN_USER = process.env.ADMIN_USER || 'Famiartisanal';
const ADMIN_PASS = process.env.ADMIN_PASS || 'Fami+2026*';
// Secret de signature : si non fourni, dérivé (stable) des identifiants
// pour que les sessions survivent aux redémarrages sans config supplémentaire.
const SECRET = process.env.SESSION_SECRET ||
  crypto.createHash('sha256').update('wa|' + ADMIN_USER + '|' + ADMIN_PASS).digest('hex');

const COOKIE = 'wa_admin';
const TTL_MS = 12 * 60 * 60 * 1000; // 12 h

function sha(s) { return crypto.createHash('sha256').update(String(s)).digest(); }
function safeEqual(a, b) {
  const ba = sha(a), bb = sha(b);
  return crypto.timingSafeEqual(ba, bb);
}

/** Vérifie identifiant + mot de passe (comparaison à temps constant). */
function checkCredentials(user, pass) {
  return safeEqual(user || '', ADMIN_USER) && safeEqual(pass || '', ADMIN_PASS);
}

function sign(payloadB64) {
  return crypto.createHmac('sha256', SECRET).update(payloadB64).digest('hex');
}

/** Crée un jeton de session signé. */
function makeToken() {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + TTL_MS }))
    .toString('base64url');
  return payload + '.' + sign(payload);
}

/** Valide un jeton de session (signature + expiration). */
function verifyToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return false;
  const [payload, sig] = token.split('.');
  const expected = sign(payload);
  if (sig.length !== expected.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return typeof exp === 'number' && exp > Date.now();
  } catch (e) { return false; }
}

function parseCookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach(part => {
    const i = part.indexOf('=');
    if (i > -1) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

function cookieHeader(token) {
  const base = `${COOKIE}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${TTL_MS / 1000}`;
  // En production (HTTPS Railway) on ajoute Secure.
  return process.env.NODE_ENV === 'production' ? base + '; Secure' : base;
}

function clearCookieHeader() {
  return `${COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`;
}

/** Middleware Express : bloque si non authentifié. */
function requireAuth(req, res, next) {
  const token = parseCookies(req)[COOKIE];
  if (verifyToken(token)) return next();
  return res.status(401).json({ ok: false, error: 'unauthorized' });
}

module.exports = {
  ADMIN_USER, COOKIE,
  checkCredentials, makeToken, verifyToken, parseCookies,
  cookieHeader, clearCookieHeader, requireAuth,
};
