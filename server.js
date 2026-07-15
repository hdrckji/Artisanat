// Serveur du Week-end Artisanal Famiflora
// - Sert le contenu du dossier /public.
// - Reçoit les pré-inscriptions (données + 3 photos) sur /api/preinscription,
//   envoie l'accusé de réception au candidat et la notification à l'organisateur.
try { require('dotenv').config(); } catch (_) { /* dotenv facultatif en production */ }
const express = require('express');
const multer = require('multer');
const path = require('path');
const mailer = require('./mailer');

const app = express();
const PORT = process.env.PORT || 3000;

// Photos gardées en mémoire (max 10 Mo chacune) pour être jointes aux e-mails.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 3 },
});

app.use(express.static(path.join(__dirname, 'public')));

// ---------------------------------------------------------------------
//  Réception d'une pré-inscription
// ---------------------------------------------------------------------
app.post(
  '/api/preinscription',
  upload.fields([{ name: 'photo_1' }, { name: 'photo_2' }, { name: 'photo_3' }]),
  async (req, res) => {
    const data = req.body || {};
    const files = req.files || {};
    const photos = ['photo_1', 'photo_2', 'photo_3']
      .map(k => (files[k] && files[k][0]) || null);

    // Trace serveur (utile en cas de souci d'envoi — visible dans les logs).
    console.log(`[pré-inscription] ${data.entreprise || data.nom || '???'} <${data.email || 'sans e-mail'}>`);

    if (!mailer.isConfigured()) {
      // SMTP pas encore configuré : on ne bloque pas le candidat, mais on prévient dans les logs.
      console.warn('⚠️  SMTP non configuré (voir .env.example) — aucun e-mail envoyé.');
      return res.status(200).json({ ok: true, mailed: false });
    }

    try {
      await mailer.sendPreinscription(data, photos);
      return res.status(200).json({ ok: true, mailed: true });
    } catch (err) {
      console.error("Échec de l'envoi des e-mails :", err);
      return res.status(500).json({ ok: false, error: 'mail_failed' });
    }
  }
);

// Toute autre route renvoie la page de pré-inscription.
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Week-end Artisanal — serveur démarré sur le port ${PORT}`);
  console.log(mailer.isConfigured()
    ? '✅ Service e-mail (SMTP) configuré.'
    : '⚠️  Service e-mail NON configuré : renseignez les variables SMTP (voir .env.example).');
});
