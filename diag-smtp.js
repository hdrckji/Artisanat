// =====================================================================
//  diag-smtp.js — Diagnostic de la connexion SMTP
//  ---------------------------------------------------------------------
//  À exécuter LÀ OÙ le problème se pose (sur Railway), pas depuis un
//  poste du réseau interne : c'est le chemin réseau qui est testé, pas
//  la configuration.
//
//      npm run diag:smtp
//
//  Teste séparément chaque étape pour isoler celle qui casse :
//    1. lecture des variables      4. connexion SMTP (verify)
//    2. résolution DNS             5. envoi réel (si DIAG_TO est fourni)
//    3. ouverture du port TCP
// =====================================================================
require('dotenv').config();
const dns = require('dns').promises;
const net = require('net');
const nodemailer = require('nodemailer');

const {
  SMTP_HOST, SMTP_PORT = '587', SMTP_SECURE,
  SMTP_USER, SMTP_PASS, MAIL_FROM, MAIL_TO, DIAG_TO,
} = process.env;

const PORT = Number(SMTP_PORT);
const ok = s => console.log(`  \x1b[32m✅ ${s}\x1b[0m`);
const ko = s => console.log(`  \x1b[31m❌ ${s}\x1b[0m`);
const info = s => console.log(`     ${s}`);
const titre = s => console.log(`\n\x1b[1m${s}\x1b[0m`);

const PRIVEE = /^(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.)/;

/** Ouvre une simple connexion TCP pour voir si le port répond. */
function testTcp(host, port, timeout = 10000) {
  return new Promise(resolve => {
    const t0 = Date.now();
    const sock = new net.Socket();
    const fin = (etat, detail) => {
      sock.destroy();
      resolve({ etat, detail, ms: Date.now() - t0 });
    };
    sock.setTimeout(timeout);
    sock.once('connect', () => fin('ouvert'));
    sock.once('timeout', () => fin('timeout'));
    sock.once('error', err => fin('erreur', err.code || String(err)));
    sock.connect(port, host);
  });
}

(async () => {
  console.log('\n══════════════════════════════════════════════════');
  console.log('  Diagnostic SMTP — Week-end Artisanal');
  console.log('══════════════════════════════════════════════════');

  // --- 1. Variables ------------------------------------------------
  titre('1. Variables d\'environnement');
  if (!SMTP_HOST) {
    ko('SMTP_HOST absent — le service e-mail est désactivé.');
    process.exit(1);
  }
  ok(`SMTP_HOST = ${SMTP_HOST}`);
  ok(`SMTP_PORT = ${PORT}`);
  info(`SMTP_SECURE = ${SMTP_SECURE || '(déduit du port)'}`);
  info(`SMTP_USER = ${SMTP_USER || '(aucun — relais sans authentification)'}`);
  info(`SMTP_PASS = ${SMTP_PASS ? '(défini)' : '(aucun)'}`);
  info(`MAIL_FROM = ${MAIL_FROM || '(non défini → repli)'}`);
  info(`MAIL_TO   = ${MAIL_TO || '(défaut : cyril.loiseau@famiflora.be)'}`);
  if (PORT === 25) {
    console.log('  \x1b[33m⚠️  Port 25 : bloqué en SORTIE par la plupart des hébergeurs\x1b[0m');
    console.log('  \x1b[33m     cloud. L\'étape 3 le confirmera ou l\'infirmera.\x1b[0m');
  }

  // --- 2. DNS ------------------------------------------------------
  titre('2. Résolution DNS');
  let ips = [];
  try {
    const r = await dns.lookup(SMTP_HOST, { all: true });
    ips = r.map(x => x.address);
    ok(`${SMTP_HOST} → ${ips.join(', ')}`);
    const privees = ips.filter(ip => PRIVEE.test(ip));
    if (privees.length) {
      console.log(`  \x1b[33m⚠️  Adresse PRIVÉE (${privees.join(', ')}) : ce serveur n'est\x1b[0m`);
      console.log('  \x1b[33m     joignable QUE depuis le réseau interne. Depuis Railway,\x1b[0m');
      console.log('  \x1b[33m     il est inatteignable — aucune whitelist n\'y changera rien.\x1b[0m');
    }
  } catch (err) {
    ko(`Échec DNS : ${err.code || err.message}`);
    info('Le nom n\'existe pas sur Internet (DNS interne uniquement ?).');
    process.exit(1);
  }

  // --- 3. TCP ------------------------------------------------------
  titre(`3. Ouverture du port ${PORT}`);
  const tcp = await testTcp(SMTP_HOST, PORT);
  if (tcp.etat === 'ouvert') {
    ok(`Port ${PORT} joignable (${tcp.ms} ms)`);
  } else if (tcp.etat === 'timeout') {
    ko(`TIMEOUT après ${tcp.ms} ms — aucune réponse.`);
    info('→ Sortie bloquée par l\'hébergeur, ou paquets filtrés par le');
    info('  pare-feu du relais. Depuis Railway sur le port 25, c\'est');
    info('  le symptôme classique du blocage en sortie.');
  } else {
    ko(`${tcp.detail} après ${tcp.ms} ms`);
    if (tcp.detail === 'ECONNREFUSED') info('→ Le serveur répond mais rien n\'écoute sur ce port.');
  }

  // --- 4. SMTP -----------------------------------------------------
  titre('4. Poignée de main SMTP');
  const opts = {
    host: SMTP_HOST, port: PORT,
    secure: SMTP_SECURE === 'true' || PORT === 465,
    tls: { rejectUnauthorized: false },
    connectionTimeout: 15000, greetingTimeout: 15000,
  };
  if (SMTP_USER && SMTP_PASS) opts.auth = { user: SMTP_USER, pass: SMTP_PASS };
  const transport = nodemailer.createTransport(opts);
  let smtpOk = false;
  try {
    await transport.verify();
    ok('Le relais accepte la connexion.');
    smtpOk = true;
  } catch (err) {
    ko(`${err.code || 'ERREUR'} — ${err.message}`);
    if (err.responseCode) info(`Réponse du serveur : ${err.responseCode} ${err.response || ''}`);
    if (err.code === 'EAUTH') info('→ Le relais EXIGE des identifiants (SMTP_USER / SMTP_PASS).');
    if (err.code === 'ETIMEDOUT' || err.code === 'ESOCKET') info('→ Chemin réseau bloqué (voir étape 3).');
  }

  // --- 5. Envoi réel -----------------------------------------------
  titre('5. Envoi réel');
  if (!smtpOk) {
    info('Ignoré : la connexion a échoué à l\'étape 4.');
  } else if (!DIAG_TO) {
    info('Ignoré : aucun destinataire fourni.');
    info('Pour tester un envoi : DIAG_TO=vous@famiflora.be npm run diag:smtp');
    info('⚠️  Un VRAI e-mail sera envoyé à cette adresse.');
  } else {
    const from = MAIL_FROM || SMTP_USER || 'no-reply@famiflora.be';
    try {
      const r = await transport.sendMail({
        from, to: DIAG_TO,
        subject: 'Test SMTP — Week-end Artisanal',
        text: `Diagnostic réussi.\n\nRelais : ${SMTP_HOST}:${PORT}\nExpéditeur : ${from}`,
      });
      ok(`Accepté par le relais pour ${DIAG_TO}`);
      info(`Réponse : ${r.response || '(vide)'}`);
      if (r.rejected && r.rejected.length) ko(`Rejetés : ${r.rejected.join(', ')}`);
      info('Vérifiez la boîte de réception (et les indésirables).');
    } catch (err) {
      ko(`${err.code || 'ERREUR'} — ${err.message}`);
      if (err.responseCode) info(`Réponse du serveur : ${err.responseCode} ${err.response || ''}`);
      if (String(err.responseCode).startsWith('55')) {
        info('→ Connexion OK mais envoi REFUSÉ. Causes habituelles :');
        info('  • le relais n\'accepte que les destinataires internes');
        info(`    (${DIAG_TO} est-il externe ?) ;`);
        info(`  • l'expéditeur « ${from} » n'est pas autorisé pour cette IP.`);
      }
    }
  }

  console.log('\n══════════════════════════════════════════════════');
  console.log('  Diagnostic terminé');
  console.log('══════════════════════════════════════════════════\n');
  process.exit(0);
})();
