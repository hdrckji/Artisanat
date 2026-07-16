// Serveur du Week-end Artisanal Famiflora
// - Sert le site public (/public) et l'espace admin (/admin).
// - Reçoit et STOCKE les pré-inscriptions, envoie les e-mails.
// - Fournit l'API d'administration (consultation, validation, facture, export Excel).
try { require('dotenv').config(); } catch (_) { /* dotenv facultatif en production */ }
const express = require('express');
const multer = require('multer');
const path = require('path');
const ExcelJS = require('exceljs');
const mailer = require('./mailer');
const store = require('./store');
const auth = require('./auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Fichiers gardés en mémoire (photos 10 Mo, facture 20 Mo).
const uploadPhotos = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 3 } });
const uploadFacture = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

app.use(express.static(path.join(__dirname, 'public')));

// =====================================================================
//  1) Réception d'une pré-inscription (public)
// =====================================================================
app.post(
  '/api/preinscription',
  uploadPhotos.fields([{ name: 'photo_1' }, { name: 'photo_2' }, { name: 'photo_3' }]),
  async (req, res) => {
    const data = req.body || {};
    const files = req.files || {};
    const photos = ['photo_1', 'photo_2', 'photo_3'].map(k => (files[k] && files[k][0]) || null);

    // Enregistrement (toujours, même sans SMTP configuré).
    let record;
    try {
      record = store.create(data, photos);
      console.log(`[pré-inscription] #${record.id} — ${data.entreprise || data.nom || '???'} <${data.email || 'sans e-mail'}>`);
    } catch (err) {
      console.error('Échec de l\'enregistrement de la pré-inscription :', err);
      return res.status(500).json({ ok: false, error: 'store_failed' });
    }

    // Envoi des e-mails (accusé candidat + notification organisateur).
    let mailed = false;   // l'accusé de réception au candidat est-il parti ?
    if (mailer.isConfigured()) {
      try {
        const r = await mailer.sendPreinscription(data, photos, record.langue);
        mailed = r.applicant;
        if (!r.organizer || !r.applicant) {
          const parts = [];
          if (!r.organizer) parts.push('notification organisateur');
          if (!r.applicant) parts.push('accusé candidat');
          store.addEmailWarning(record.id, { type: 'preinscription', echec: parts.join(' + '), error: r.errors.join(' | ') });
          console.error(`⚠️  E-mail pré-inscription non envoyé (${parts.join(' + ')}) :`, r.errors.join(' | '));
        }
      } catch (err) {
        store.addEmailWarning(record.id, { type: 'preinscription', echec: 'e-mails', error: String(err) });
        console.error('Envoi e-mail pré-inscription échoué (soumission conservée) :', err);
      }
    } else {
      console.warn('⚠️  SMTP non configuré — aucun e-mail envoyé (soumission conservée).');
    }
    return res.status(200).json({ ok: true, id: record.id, mailed });
  }
);

// =====================================================================
//  2) Authentification admin
// =====================================================================
app.post('/api/admin/login', (req, res) => {
  const { user, pass } = req.body || {};
  if (!auth.checkCredentials(user, pass)) {
    return res.status(401).json({ ok: false, error: 'bad_credentials' });
  }
  res.setHeader('Set-Cookie', auth.cookieHeader(auth.makeToken()));
  res.json({ ok: true });
});

app.post('/api/admin/logout', (req, res) => {
  res.setHeader('Set-Cookie', auth.clearCookieHeader());
  res.json({ ok: true });
});

app.get('/api/admin/me', (req, res) => {
  const token = auth.parseCookies(req)[auth.COOKIE];
  res.json({ ok: true, authenticated: auth.verifyToken(token), smtp: mailer.isConfigured() });
});

// --- Tout ce qui suit exige d'être authentifié -----------------------
app.use('/api/admin', auth.requireAuth);

// Colonnes exportables (catalogue pour l'UI et pour l'export).
const L = mailer.LABELS;
const FIELD_COLS = store.FIELD_KEYS.map(k => ({ key: k, label: L[k] || k, get: r => r.fields[k] || '' }));
const COMPOSITE_COLS = [
  { key: 'contact', label: 'Contact (nom + tél + e-mail)', get: r => [r.fields.nom, r.fields.telephone, r.fields.email].filter(Boolean).join('\n') },
  { key: 'stand', label: 'Taille du stand (L × l)', get: r => (r.fields.longueur || r.fields.largeur) ? `${r.fields.longueur || '?'} × ${r.fields.largeur || '?'} m` : '' },
];
const META_COLS = [
  { key: 'createdAt', label: 'Date de pré-inscription', get: r => r.createdAt ? new Date(r.createdAt).toLocaleString('fr-BE') : '' },
  { key: 'statut', label: 'Statut', get: r => ({ pending: 'En attente', valide: 'Validé', refuse: 'Non validé' }[r.status] || r.status) },
  { key: 'facture_envoyee', label: 'Facture envoyée', get: r => (r.facture && r.facture.envoyeeAt) ? 'Oui' : 'Non' },
  { key: 'facture_payee', label: 'Facture payée', get: r => r.facturePayee ? 'Oui' : 'Non' },
];
const ALL_COLS = [...COMPOSITE_COLS, ...FIELD_COLS, ...META_COLS];
const COL_BY_KEY = Object.fromEntries(ALL_COLS.map(c => [c.key, c]));

app.get('/api/admin/columns', (_req, res) => {
  res.json({ ok: true, columns: ALL_COLS.map(c => ({ key: c.key, label: c.label })) });
});

// Liste de toutes les pré-inscriptions.
app.get('/api/admin/submissions', (_req, res) => {
  res.json({ ok: true, submissions: store.list() });
});

// Détail.
app.get('/api/admin/submissions/:id', (req, res) => {
  const rec = store.get(req.params.id);
  if (!rec) return res.status(404).json({ ok: false, error: 'not_found' });
  res.json({ ok: true, submission: rec });
});

// Photos / facture (fichiers protégés).
app.get('/api/admin/submissions/:id/photo/:name', (req, res) => {
  const p = store.photoPath(req.params.id, req.params.name);
  if (!p) return res.status(404).end();
  res.sendFile(p);
});
app.get('/api/admin/submissions/:id/facture', (req, res) => {
  const p = store.facturePath(req.params.id);
  if (!p) return res.status(404).end();
  res.sendFile(p);
});

// Valider une candidature (+ e-mail de validation).
app.post('/api/admin/submissions/:id/validate', async (req, res) => {
  const rec = store.get(req.params.id);
  if (!rec) return res.status(404).json({ ok: false, error: 'not_found' });
  store.setStatus(rec.id, 'valide');
  let mailed = false, mailError = false;
  if (mailer.isConfigured()) {
    try { await mailer.sendValidation(rec.fields, rec.langue); mailed = true; }
    catch (err) {
      mailError = true;
      store.addEmailWarning(rec.id, { type: 'validation', echec: 'e-mail de validation', error: String(err) });
      console.error('E-mail de validation échoué :', err);
    }
  }
  res.json({ ok: true, submission: store.get(rec.id), mailed, mailError });
});

// Refuser une candidature (+ e-mail de refus).
app.post('/api/admin/submissions/:id/reject', async (req, res) => {
  const rec = store.get(req.params.id);
  if (!rec) return res.status(404).json({ ok: false, error: 'not_found' });
  store.setStatus(rec.id, 'refuse');
  let mailed = false, mailError = false;
  if (mailer.isConfigured()) {
    try { await mailer.sendRejection(rec.fields, rec.langue); mailed = true; }
    catch (err) {
      mailError = true;
      store.addEmailWarning(rec.id, { type: 'refus', echec: 'e-mail de refus', error: String(err) });
      console.error('E-mail de refus échoué :', err);
    }
  }
  res.json({ ok: true, submission: store.get(rec.id), mailed, mailError });
});

// Upload + envoi de la facture (marque « facture envoyée »).
app.post('/api/admin/submissions/:id/facture', uploadFacture.single('facture'), async (req, res) => {
  const rec = store.get(req.params.id);
  if (!rec) return res.status(404).json({ ok: false, error: 'not_found' });
  if (!req.file) return res.status(400).json({ ok: false, error: 'no_file' });
  store.saveFacture(rec.id, req.file);

  if (!mailer.isConfigured()) {
    // Fichier conservé mais non envoyé faute de SMTP.
    return res.status(200).json({ ok: true, submission: store.get(rec.id), mailed: false });
  }
  try {
    await mailer.sendFacture(rec.fields, {
      filename: req.file.originalname || 'facture.pdf',
      content: req.file.buffer,
      contentType: req.file.mimetype,
    }, rec.langue);
    const updated = store.markFactureEnvoyee(rec.id);
    res.json({ ok: true, submission: updated, mailed: true });
  } catch (err) {
    store.addEmailWarning(rec.id, { type: 'facture', echec: 'envoi de la facture', error: String(err) });
    console.error('Envoi de la facture échoué :', err);
    res.status(500).json({ ok: false, error: 'mail_failed', submission: store.get(rec.id) });
  }
});

// Marquer les avertissements e-mail comme traités (les effacer).
app.post('/api/admin/submissions/:id/clear-warnings', (req, res) => {
  const rec = store.get(req.params.id);
  if (!rec) return res.status(404).json({ ok: false, error: 'not_found' });
  res.json({ ok: true, submission: store.clearEmailWarnings(rec.id) });
});

// Basculer « facture payée ».
app.post('/api/admin/submissions/:id/facture-payee', (req, res) => {
  const rec = store.get(req.params.id);
  if (!rec) return res.status(404).json({ ok: false, error: 'not_found' });
  const updated = store.update(rec.id, { facturePayee: Boolean(req.body && req.body.value) });
  res.json({ ok: true, submission: updated });
});

// Export Excel des colonnes choisies.
app.post('/api/admin/export', async (req, res) => {
  const { columns, ids, status } = req.body || {};
  const keys = (Array.isArray(columns) && columns.length ? columns : ALL_COLS.map(c => c.key))
    .filter(k => COL_BY_KEY[k]);

  let rows = store.list();
  if (Array.isArray(ids) && ids.length) rows = rows.filter(r => ids.includes(r.id));
  else if (status) rows = rows.filter(r => r.status === status);

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Inscriptions');
  ws.columns = keys.map(k => ({ header: COL_BY_KEY[k].label, key: k, width: 26 }));
  rows.forEach(r => {
    const line = {};
    keys.forEach(k => { line[k] = COL_BY_KEY[k].get(r); });
    ws.addRow(line);
  });
  ws.getRow(1).font = { bold: true };
  ws.getRow(1).alignment = { vertical: 'middle', wrapText: true };
  ws.eachRow(row => { row.alignment = { vertical: 'top', wrapText: true }; });

  const buf = await wb.xlsx.writeBuffer();
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="inscriptions-weekend-artisanal.xlsx"');
  res.send(Buffer.from(buf));
});

// =====================================================================
//  3) Pages
// =====================================================================
app.get('/admin', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

// Toute autre route renvoie la page publique de pré-inscription.
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => {
  console.log(`Week-end Artisanal — serveur démarré sur le port ${PORT}`);
  console.log(`Données : ${store.DATA_DIR}`);
  console.log(mailer.isConfigured()
    ? '✅ Service e-mail (SMTP) configuré.'
    : '⚠️  Service e-mail NON configuré : renseignez les variables SMTP (voir README).');
});
