// =====================================================================
//  store.js — Stockage des pré-inscriptions (JSON + fichiers)
//  ---------------------------------------------------------------------
//  Les données sont conservées dans DATA_DIR (défaut ./data) :
//    - submissions.json          → toutes les pré-inscriptions
//    - uploads/<id>/photo_*.jpg  → les 3 photos
//    - uploads/<id>/facture.*    → la facture envoyée par l'organisateur
//
//  ⚠️ Sur Railway, montez un VOLUME sur ce dossier (variable DATA_DIR)
//     pour que les données survivent aux redéploiements.
// =====================================================================
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'submissions.json');

function ensureDirs() {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, '[]');
}
ensureDirs();

function readAll() {
  try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
  catch (e) { return []; }
}

function writeAll(list) {
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(list, null, 2));
  fs.renameSync(tmp, DB_FILE); // écriture atomique
}

function extFromFile(file, fallback) {
  const fromName = file && file.originalname && path.extname(file.originalname);
  if (fromName) return fromName.toLowerCase();
  const map = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'application/pdf': '.pdf' };
  return (file && map[file.mimetype]) || fallback || '';
}

/** Champs du formulaire conservés (dans l'ordre d'affichage). */
const FIELD_KEYS = [
  'nom', 'entreprise', 'telephone', 'email', 'instagram', 'facebook', 'adresse', 'tva',
  'autorisation_reseaux', 'nb_personnes', 'heure_arrivee', 'longueur', 'largeur',
  'mobilier', 'mobilier_autre', 'electricite', 'type_appareils', 'puissance_watts',
  'produits', 'produits_autre', 'formule', 'besoins', 'date', 'signature',
];

/** Crée une pré-inscription : écrit les photos et l'enregistre. */
function create(body, photoFiles) {
  const id = Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
  const dir = path.join(UPLOADS_DIR, id);
  fs.mkdirSync(dir, { recursive: true });

  const photos = [];
  (photoFiles || []).filter(Boolean).forEach((f, i) => {
    const name = `photo_${i + 1}${extFromFile(f, '.jpg')}`;
    fs.writeFileSync(path.join(dir, name), f.buffer);
    photos.push(name);
  });

  const fields = {};
  FIELD_KEYS.forEach(k => {
    if (body[k] == null) return;
    fields[k] = Array.isArray(body[k]) ? body[k].join(', ') : String(body[k]);
  });

  const record = {
    id,
    createdAt: new Date().toISOString(),
    status: 'pending',            // pending | valide | refuse
    decidedAt: null,
    fields,
    photos,
    facture: null,                // { file, envoyeeAt }
    facturePayee: false,
  };

  const list = readAll();
  list.push(record);
  writeAll(list);
  return record;
}

function list() {
  return readAll().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

function get(id) {
  return readAll().find(r => r.id === id) || null;
}

function update(id, patch) {
  const all = readAll();
  const i = all.findIndex(r => r.id === id);
  if (i === -1) return null;
  all[i] = { ...all[i], ...patch };
  writeAll(all);
  return all[i];
}

function setStatus(id, status) {
  return update(id, { status, decidedAt: new Date().toISOString() });
}

/** Enregistre le fichier de facture et renvoie le chemin absolu. */
function saveFacture(id, file) {
  const rec = get(id);
  if (!rec) return null;
  const dir = path.join(UPLOADS_DIR, id);
  fs.mkdirSync(dir, { recursive: true });
  const name = `facture${extFromFile(file, '.pdf')}`;
  fs.writeFileSync(path.join(dir, name), file.buffer);
  update(id, { facture: { file: name, envoyeeAt: null } });
  return path.join(dir, name);
}

function markFactureEnvoyee(id) {
  const rec = get(id);
  if (!rec || !rec.facture) return null;
  return update(id, { facture: { ...rec.facture, envoyeeAt: new Date().toISOString() } });
}

function photoPath(id, name) {
  const rec = get(id);
  if (!rec || !rec.photos.includes(name)) return null;
  return path.join(UPLOADS_DIR, id, name);
}

function facturePath(id) {
  const rec = get(id);
  if (!rec || !rec.facture) return null;
  return path.join(UPLOADS_DIR, id, rec.facture.file);
}

module.exports = {
  DATA_DIR, FIELD_KEYS,
  create, list, get, update, setStatus,
  saveFacture, markFactureEnvoyee, photoPath, facturePath,
};
