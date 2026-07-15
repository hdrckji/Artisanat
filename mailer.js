// =====================================================================
//  mailer.js — Envoi des e-mails du Week-end Artisanal
//  ---------------------------------------------------------------------
//  - Accusé de réception automatique au candidat (« votre pré-inscription
//    est bien prise en compte »).
//  - Notification à l'organisateur avec toutes les données + les photos.
//
//  La configuration SMTP se fait uniquement via les variables
//  d'environnement (voir .env.example). Aucun identifiant en dur ici.
// =====================================================================
const nodemailer = require('nodemailer');

const {
  SMTP_HOST,
  SMTP_PORT = '587',
  SMTP_SECURE,            // "true" pour le port 465, sinon STARTTLS
  SMTP_USER,
  SMTP_PASS,
  MAIL_FROM,              // ex. "Week-end Artisanal Famiflora <no-reply@famiflora.be>"
  MAIL_TO,                // destinataire organisateur (défaut ci-dessous)
  MAIL_BCC,               // copie cachée éventuelle
} = process.env;

const ORGANISATEUR = MAIL_TO || 'cyril.loiseau@famiflora.be';
const EXPEDITEUR = MAIL_FROM || SMTP_USER;

/** Le service d'e-mail est-il configuré ? */
function isConfigured() {
  return Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);
}

let _transport = null;
function getTransport() {
  if (_transport) return _transport;
  _transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE === 'true' || Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return _transport;
}

// ---------------------------------------------------------------------
//  Libellés lisibles pour le récapitulatif
// ---------------------------------------------------------------------
const LABELS = {
  nom: 'Nom & prénom', entreprise: 'Entreprise', telephone: 'Téléphone',
  email: 'E-mail', instagram: 'Instagram', facebook: 'Facebook',
  adresse: 'Adresse', tva: 'N° TVA',
  autorisation_reseaux: 'Autorisation réseaux sociaux',
  nb_personnes: 'Personnes présentes', heure_arrivee: 'Arrivée samedi',
  longueur: 'Longueur stand (m)', largeur: 'Largeur stand (m)',
  mobilier: 'Mobilier apporté', mobilier_autre: 'Mobilier — autre',
  electricite: 'Électricité', type_appareils: "Type d'appareils",
  puissance_watts: 'Puissance (W)', produits: 'Produits exposés',
  produits_autre: 'Produits — autre', formule: 'Formule choisie',
  besoins: 'Besoins particuliers', date: 'Date', signature: 'Signature',
};

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** Construit un tableau HTML de récapitulatif à partir des données du formulaire. */
function recapHtml(data) {
  const rows = Object.keys(LABELS)
    .filter(k => data[k] != null && String(data[k]).trim() !== '')
    .map(k => `
      <tr>
        <td style="padding:6px 12px;font-weight:700;color:#46331f;background:#f3e8d6;border:1px solid #ead9c0;">${escapeHtml(LABELS[k])}</td>
        <td style="padding:6px 12px;border:1px solid #ead9c0;">${escapeHtml([].concat(data[k]).join(', '))}</td>
      </tr>`).join('');
  return `<table style="border-collapse:collapse;width:100%;font-size:14px;">${rows}</table>`;
}

// ---------------------------------------------------------------------
//  1) Accusé de réception envoyé au CANDIDAT
// ---------------------------------------------------------------------
function confirmationHtml(data) {
  const prenom = escapeHtml((data.nom || '').split(' ')[0] || '');
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#faf4e8;font-family:Arial,Helvetica,sans-serif;color:#3a2d1e;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf4e8;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 6px 24px rgba(70,51,31,.12);">
        <tr><td style="background:linear-gradient(180deg,#7a5a3a,#5f4630);border-bottom:6px solid #76b82a;padding:28px 30px;text-align:center;">
          <h1 style="margin:0;color:#faf4e8;font-family:Georgia,serif;font-size:22px;">Week-end Artisanal — Famiflora</h1>
          <p style="margin:8px 0 0;color:#f0e6d6;font-size:14px;">2ᵉ édition · Mouscron</p>
        </td></tr>
        <tr><td style="padding:30px;">
          <h2 style="margin:0 0 14px;color:#46331f;font-family:Georgia,serif;font-size:20px;">✅ Votre pré-inscription est bien prise en compte</h2>
          <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">Bonjour ${prenom || ''},</p>
          <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">
            Nous vous confirmons la bonne réception de votre <strong>pré-inscription</strong> au Week-end Artisanal
            organisé par Famiflora. Votre demande a bien été enregistrée. 🎉
          </p>
          <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">
            Votre dossier va maintenant être étudié par notre équipe. Le nombre de places étant limité, nous accordons
            une attention particulière à la diversité des exposants. Vous recevrez prochainement un e-mail vous informant
            de la décision concernant votre candidature.
          </p>
          <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">
            Si votre candidature est retenue, la facture correspondant à la formule choisie vous sera envoyée par e-mail
            environ un mois avant l'événement.
          </p>
          <div style="background:#f3e8d6;border-left:5px solid #b9713f;border-radius:8px;padding:12px 16px;margin:18px 0;font-size:14px;">
            <strong style="color:#b9713f;">Important :</strong> ceci est une pré-inscription. Votre participation ne
            sera définitive qu'après validation par Famiflora.
          </div>
          <p style="margin:0 0 6px;font-size:15px;line-height:1.6;">Une question ? Contactez-nous :</p>
          <p style="margin:0 0 18px;font-size:15px;line-height:1.6;">
            📞 <a href="tel:+3256336600" style="color:#5e9420;">056 33 66 00</a><br>
            ✉️ <a href="mailto:cyril.loiseau@famiflora.be" style="color:#5e9420;">cyril.loiseau@famiflora.be</a>
          </p>
          <p style="margin:0;font-size:15px;line-height:1.6;">
            Nous vous remercions de votre confiance,<br>
            <strong>L'équipe d'organisation du Week-end Artisanal de Famiflora</strong>
          </p>
        </td></tr>
        <tr><td style="background:#46331f;color:#cbb99f;text-align:center;padding:16px;font-size:12px;">
          Famiflora · Rue Jules Vantieghem 14 · 7711 Mouscron<br>
          © Famiflora – Week-end Artisanal
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function confirmationText(data) {
  const prenom = (data.nom || '').split(' ')[0] || '';
  return [
    `Week-end Artisanal — Famiflora (2e édition, Mouscron)`,
    ``,
    `Bonjour ${prenom},`,
    ``,
    `Votre pré-inscription au Week-end Artisanal organisé par Famiflora est bien prise en compte. Votre demande a bien été enregistrée.`,
    ``,
    `Votre dossier va être étudié par notre équipe. Le nombre de places étant limité, nous veillons à la diversité des exposants. Vous recevrez prochainement un e-mail vous informant de la décision.`,
    ``,
    `Si votre candidature est retenue, la facture correspondant à la formule choisie vous sera envoyée environ un mois avant l'événement.`,
    ``,
    `Important : ceci est une pré-inscription. Votre participation ne sera définitive qu'après validation par Famiflora.`,
    ``,
    `Une question ? 056 33 66 00 — cyril.loiseau@famiflora.be`,
    ``,
    `L'équipe d'organisation du Week-end Artisanal de Famiflora`,
  ].join('\n');
}

// ---------------------------------------------------------------------
//  2) Notification envoyée à l'ORGANISATEUR
// ---------------------------------------------------------------------
function organizerHtml(data) {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head>
<body style="font-family:Arial,Helvetica,sans-serif;color:#3a2d1e;background:#faf4e8;padding:20px;">
  <h2 style="color:#46331f;">📥 Nouvelle pré-inscription — Week-end Artisanal</h2>
  <p>Un artisan vient de soumettre une pré-inscription. Les 3 photos sont jointes à cet e-mail.</p>
  ${recapHtml(data)}
  <p style="margin-top:16px;font-size:13px;color:#8a7a66;">Message généré automatiquement par le site de pré-inscription.</p>
</body></html>`;
}

// ---------------------------------------------------------------------
//  Envoi
// ---------------------------------------------------------------------
async function sendConfirmation(data) {
  if (!data.email) return;
  await getTransport().sendMail({
    from: EXPEDITEUR,
    to: data.email,
    subject: 'Votre pré-inscription au Week-end Artisanal est bien reçue ✅',
    text: confirmationText(data),
    html: confirmationHtml(data),
  });
}

async function sendOrganizerNotification(data, photos = []) {
  const attachments = photos
    .filter(Boolean)
    .map((f, i) => ({
      filename: f.originalname || `photo_${i + 1}.jpg`,
      content: f.buffer,
      contentType: f.mimetype,
    }));
  await getTransport().sendMail({
    from: EXPEDITEUR,
    to: ORGANISATEUR,
    bcc: MAIL_BCC || undefined,
    replyTo: data.email || undefined,
    subject: `Nouvelle pré-inscription — ${data.entreprise || data.nom || 'artisan'}`,
    html: organizerHtml(data),
    attachments,
  });
}

/** Envoie les deux e-mails. Ne rejette pas si l'un des deux échoue isolément. */
async function sendPreinscription(data, photos) {
  const results = await Promise.allSettled([
    sendOrganizerNotification(data, photos),
    sendConfirmation(data),
  ]);
  const errors = results.filter(r => r.status === 'rejected').map(r => r.reason);
  if (errors.length) {
    // L'organisateur est prioritaire : si sa notification échoue, on remonte l'erreur.
    if (results[0].status === 'rejected') throw results[0].reason;
    // Sinon, l'accusé candidat a échoué : on log sans bloquer.
    console.warn("Accusé de réception candidat non envoyé :", errors);
  }
}

// ---------------------------------------------------------------------
//  E-mails de décision (validation / refus / facture)
// ---------------------------------------------------------------------
function emailShell(heading, innerHtml) {
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#faf4e8;font-family:Arial,Helvetica,sans-serif;color:#3a2d1e;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf4e8;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 6px 24px rgba(70,51,31,.12);">
        <tr><td style="background:linear-gradient(180deg,#7a5a3a,#5f4630);border-bottom:6px solid #76b82a;padding:26px 30px;text-align:center;">
          <h1 style="margin:0;color:#faf4e8;font-family:Georgia,serif;font-size:21px;">Week-end Artisanal — Famiflora</h1>
          <p style="margin:8px 0 0;color:#f0e6d6;font-size:14px;">2ᵉ édition · Mouscron</p>
        </td></tr>
        <tr><td style="padding:30px;">
          <h2 style="margin:0 0 16px;color:#46331f;font-family:Georgia,serif;font-size:20px;">${heading}</h2>
          ${innerHtml}
        </td></tr>
        <tr><td style="background:#46331f;color:#cbb99f;text-align:center;padding:16px;font-size:12px;">
          Famiflora · Rue Jules Vantieghem 14 · 7711 Mouscron<br>
          📞 056 33 66 00 · ✉️ cyril.loiseau@famiflora.be
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

const signatureHtml = `<p style="margin:18px 0 0;font-size:15px;line-height:1.6;">
  Bien cordialement,<br><strong>L'équipe d'organisation du Week-end Artisanal de Famiflora</strong>
</p>`;

// --- Validation (candidature retenue) --------------------------------
async function sendValidation(data) {
  if (!data.email) return;
  const prenom = escapeHtml((data.nom || '').split(' ')[0] || '');
  const inner = `
    <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">Bonjour ${prenom},</p>
    <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">
      Nous avons le plaisir de vous informer que votre candidature au <strong>Week-end Artisanal de Famiflora</strong>
      a été <strong>retenue</strong>. 🎉 Nous serons ravis de vous compter parmi nos exposants.
    </p>
    <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">
      Vous recevrez prochainement, par e-mail, la <strong>facture</strong> correspondant à la formule de participation
      que vous avez choisie. Le règlement de celle-ci confirmera définitivement votre emplacement.
    </p>
    <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">
      Nous restons à votre entière disposition pour toute question et vous remercions chaleureusement de votre confiance.
    </p>
    ${signatureHtml}`;
  const text = `Bonjour ${(data.nom || '').split(' ')[0] || ''},\n\n`
    + `Nous avons le plaisir de vous informer que votre candidature au Week-end Artisanal de Famiflora a été retenue. `
    + `Nous serons ravis de vous compter parmi nos exposants.\n\n`
    + `Vous recevrez prochainement, par e-mail, la facture correspondant à la formule choisie. Son règlement confirmera définitivement votre emplacement.\n\n`
    + `Nous restons à votre disposition pour toute question et vous remercions de votre confiance.\n\n`
    + `L'équipe d'organisation du Week-end Artisanal de Famiflora`;
  await getTransport().sendMail({
    from: EXPEDITEUR, to: data.email,
    subject: 'Votre candidature au Week-end Artisanal est retenue ✅',
    text, html: emailShell('✅ Votre candidature est retenue', inner),
  });
}

// --- Refus (candidature non retenue) ---------------------------------
async function sendRejection(data) {
  if (!data.email) return;
  const prenom = escapeHtml((data.nom || '').split(' ')[0] || '');
  const inner = `
    <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">Bonjour ${prenom},</p>
    <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">
      Nous vous remercions sincèrement de l'intérêt que vous portez au <strong>Week-end Artisanal de Famiflora</strong>
      et du temps consacré à votre pré-inscription.
    </p>
    <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">
      Le nombre de places étant limité, nous veillons à préserver un équilibre et une diversité entre les exposants.
      Après une étude attentive de l'ensemble des candidatures, nous ne sommes malheureusement pas en mesure de retenir
      la vôtre pour cette édition.
    </p>
    <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">
      Ce choix ne remet nullement en cause la qualité de votre travail. Nous serions heureux de pouvoir étudier à nouveau
      votre candidature lors d'une prochaine édition et vous encourageons vivement à vous représenter.
    </p>
    <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">
      Nous vous remercions de votre compréhension et vous souhaitons une pleine réussite dans vos projets.
    </p>
    ${signatureHtml}`;
  const text = `Bonjour ${(data.nom || '').split(' ')[0] || ''},\n\n`
    + `Nous vous remercions sincèrement de l'intérêt porté au Week-end Artisanal de Famiflora et du temps consacré à votre pré-inscription.\n\n`
    + `Le nombre de places étant limité, nous veillons à préserver un équilibre et une diversité entre les exposants. Après une étude attentive de l'ensemble des candidatures, nous ne sommes malheureusement pas en mesure de retenir la vôtre pour cette édition.\n\n`
    + `Ce choix ne remet nullement en cause la qualité de votre travail : nous serions heureux d'étudier à nouveau votre candidature lors d'une prochaine édition.\n\n`
    + `Nous vous remercions de votre compréhension et vous souhaitons une pleine réussite dans vos projets.\n\n`
    + `L'équipe d'organisation du Week-end Artisanal de Famiflora`;
  await getTransport().sendMail({
    from: EXPEDITEUR, to: data.email,
    subject: 'Votre candidature au Week-end Artisanal de Famiflora',
    text, html: emailShell('Votre candidature au Week-end Artisanal', inner),
  });
}

// --- Envoi de la facture ---------------------------------------------
async function sendFacture(data, attachment) {
  if (!data.email) return;
  const prenom = escapeHtml((data.nom || '').split(' ')[0] || '');
  const inner = `
    <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">Bonjour ${prenom},</p>
    <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">
      Suite à la validation de votre participation au <strong>Week-end Artisanal de Famiflora</strong>, veuillez trouver
      ci-joint la <strong>facture</strong> correspondant à votre réservation.
    </p>
    <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">
      Nous vous remercions de bien vouloir procéder à son règlement selon les modalités qui y sont indiquées. Le paiement
      confirmera définitivement votre emplacement pour l'événement.
    </p>
    <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">
      Pour toute question relative à cette facture, n'hésitez pas à nous contacter.
    </p>
    ${signatureHtml}`;
  const text = `Bonjour ${(data.nom || '').split(' ')[0] || ''},\n\n`
    + `Suite à la validation de votre participation au Week-end Artisanal de Famiflora, veuillez trouver ci-joint la facture correspondant à votre réservation.\n\n`
    + `Merci de procéder à son règlement selon les modalités indiquées ; le paiement confirmera définitivement votre emplacement.\n\n`
    + `Pour toute question, n'hésitez pas à nous contacter.\n\n`
    + `L'équipe d'organisation du Week-end Artisanal de Famiflora`;
  await getTransport().sendMail({
    from: EXPEDITEUR, to: data.email,
    subject: 'Votre facture — Week-end Artisanal de Famiflora',
    text, html: emailShell('🧾 Votre facture', inner),
    attachments: attachment ? [attachment] : [],
  });
}

module.exports = {
  isConfigured, sendPreinscription, LABELS,
  sendValidation, sendRejection, sendFacture,
};
