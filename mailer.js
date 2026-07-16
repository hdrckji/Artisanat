// =====================================================================
//  mailer.js — Envoi des e-mails du Week-end Artisanal (bilingue FR/NL)
//  ---------------------------------------------------------------------
//  Les e-mails au CANDIDAT (accusé, validation, refus, facture) partent
//  dans la langue du formulaire (fr/nl). La notification à l'ORGANISATEUR
//  reste en français (usage interne).
//
//  Config SMTP uniquement via variables d'environnement (voir README).
// =====================================================================
const nodemailer = require('nodemailer');

const {
  SMTP_HOST,
  SMTP_PORT = '587',
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  MAIL_FROM,
  MAIL_TO,
  MAIL_BCC,
} = process.env;

const ORGANISATEUR = MAIL_TO || 'cyril.loiseau@famiflora.be';
const EXPEDITEUR = MAIL_FROM || SMTP_USER;

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

/** Choisit la variante selon la langue ('nl' → nl, sinon fr). */
function L(lang, fr, nl) { return lang === 'nl' ? nl : fr; }

// ---------------------------------------------------------------------
//  Libellés du récapitulatif (organisateur, FR)
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
//  Enveloppe HTML commune (bandeau + pied)
// ---------------------------------------------------------------------
function emailShell(lang, heading, innerHtml) {
  const marque = L(lang, 'Week-end Artisanal — Famiflora', 'Ambachtenweekend — Famiflora');
  const sous = L(lang, '2ᵉ édition · Mouscron', '2ᵉ editie · Moeskroen');
  return `<!DOCTYPE html>
<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#faf4e8;font-family:Arial,Helvetica,sans-serif;color:#3a2d1e;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf4e8;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 6px 24px rgba(70,51,31,.12);">
        <tr><td style="background:linear-gradient(180deg,#7a5a3a,#5f4630);border-bottom:6px solid #76b82a;padding:26px 30px;text-align:center;">
          <h1 style="margin:0;color:#faf4e8;font-family:Georgia,serif;font-size:21px;">${marque}</h1>
          <p style="margin:8px 0 0;color:#f0e6d6;font-size:14px;">${sous}</p>
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

function prenomDe(data) { return escapeHtml((data.nom || '').split(' ')[0] || ''); }
function signatureBloc(lang) {
  return `<p style="margin:18px 0 0;font-size:15px;line-height:1.6;">
    ${L(lang, 'Bien cordialement,', 'Met vriendelijke groeten,')}<br>
    <strong>${L(lang, "L'équipe d'organisation du Week-end Artisanal de Famiflora", 'Het organisatieteam van het Ambachtenweekend van Famiflora')}</strong>
  </p>`;
}
const P = 'margin:0 0 14px;font-size:15px;line-height:1.6;';

// ---------------------------------------------------------------------
//  1) Accusé de réception au CANDIDAT
// ---------------------------------------------------------------------
async function sendConfirmation(data, lang) {
  if (!data.email) return;
  const pr = prenomDe(data);
  const inner = L(lang,
    `<p style="${P}">Bonjour ${pr},</p>
     <p style="${P}">Nous vous confirmons la bonne réception de votre <strong>pré-inscription</strong> au Week-end Artisanal organisé par Famiflora. Votre demande a bien été enregistrée. 🎉</p>
     <p style="${P}">Votre dossier va maintenant être étudié par notre équipe. Le nombre de places étant limité, nous accordons une attention particulière à la diversité des exposants. Vous recevrez prochainement un e-mail vous informant de la décision concernant votre candidature.</p>
     <p style="${P}">Si votre candidature est retenue, la facture correspondant à la formule choisie vous sera envoyée par e-mail environ un mois avant l'événement.</p>
     <div style="background:#f3e8d6;border-left:5px solid #b9713f;border-radius:8px;padding:12px 16px;margin:18px 0;font-size:14px;"><strong style="color:#b9713f;">Important :</strong> ceci est une pré-inscription. Votre participation ne sera définitive qu'après validation par Famiflora.</div>
     ${signatureBloc(lang)}`,
    `<p style="${P}">Hallo ${pr},</p>
     <p style="${P}">Wij bevestigen de goede ontvangst van uw <strong>voorinschrijving</strong> voor het Ambachtenweekend georganiseerd door Famiflora. Uw aanvraag is goed geregistreerd. 🎉</p>
     <p style="${P}">Uw dossier wordt nu door ons team beoordeeld. Aangezien het aantal plaatsen beperkt is, besteden wij bijzondere aandacht aan de diversiteit van de exposanten. U ontvangt binnenkort een e-mail met de beslissing over uw kandidatuur.</p>
     <p style="${P}">Als uw kandidatuur wordt weerhouden, ontvangt u ongeveer één maand vóór het evenement per e-mail de factuur voor de gekozen formule.</p>
     <div style="background:#f3e8d6;border-left:5px solid #b9713f;border-radius:8px;padding:12px 16px;margin:18px 0;font-size:14px;"><strong style="color:#b9713f;">Belangrijk:</strong> dit is een voorinschrijving. Uw deelname is pas definitief na goedkeuring door Famiflora.</div>
     ${signatureBloc(lang)}`);
  const text = L(lang,
    `Bonjour ${(data.nom || '').split(' ')[0] || ''},\n\nVotre pré-inscription au Week-end Artisanal organisé par Famiflora est bien reçue. Votre demande a bien été enregistrée.\n\nVotre dossier va être étudié par notre équipe. Vous recevrez prochainement un e-mail vous informant de la décision.\n\nSi votre candidature est retenue, la facture vous sera envoyée environ un mois avant l'événement.\n\nImportant : ceci est une pré-inscription ; votre participation ne sera définitive qu'après validation par Famiflora.\n\nL'équipe d'organisation du Week-end Artisanal de Famiflora`,
    `Hallo ${(data.nom || '').split(' ')[0] || ''},\n\nUw voorinschrijving voor het Ambachtenweekend van Famiflora is goed ontvangen en geregistreerd.\n\nUw dossier wordt door ons team beoordeeld. U ontvangt binnenkort een e-mail met de beslissing.\n\nAls uw kandidatuur wordt weerhouden, ontvangt u ongeveer één maand vóór het evenement de factuur.\n\nBelangrijk: dit is een voorinschrijving; uw deelname is pas definitief na goedkeuring door Famiflora.\n\nHet organisatieteam van het Ambachtenweekend van Famiflora`);
  await getTransport().sendMail({
    from: EXPEDITEUR, to: data.email,
    subject: L(lang, 'Votre pré-inscription au Week-end Artisanal est bien reçue ✅', 'Uw voorinschrijving voor het Ambachtenweekend is goed ontvangen ✅'),
    text, html: emailShell(lang, L(lang, '✅ Votre pré-inscription est bien prise en compte', '✅ Uw voorinschrijving is goed geregistreerd'), inner),
  });
}

// ---------------------------------------------------------------------
//  Notification à l'ORGANISATEUR (toujours FR) + photos
// ---------------------------------------------------------------------
function organizerHtml(data) {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"></head>
<body style="font-family:Arial,Helvetica,sans-serif;color:#3a2d1e;background:#faf4e8;padding:20px;">
  <h2 style="color:#46331f;">📥 Nouvelle pré-inscription — Week-end Artisanal</h2>
  <p>Un artisan vient de soumettre une pré-inscription${data.langue === 'nl' ? ' (formulaire rempli en néerlandais)' : ''}. Les 3 photos sont jointes à cet e-mail.</p>
  ${recapHtml(data)}
  <p style="margin-top:16px;font-size:13px;color:#8a7a66;">Message généré automatiquement par le site de pré-inscription.</p>
</body></html>`;
}

async function sendOrganizerNotification(data, photos = []) {
  const attachments = photos.filter(Boolean).map((f, i) => ({
    filename: f.originalname || `photo_${i + 1}.jpg`,
    content: f.buffer, contentType: f.mimetype,
  }));
  await getTransport().sendMail({
    from: EXPEDITEUR, to: ORGANISATEUR, bcc: MAIL_BCC || undefined,
    replyTo: data.email || undefined,
    subject: `Nouvelle pré-inscription — ${data.entreprise || data.nom || 'artisan'}`,
    html: organizerHtml(data), attachments,
  });
}

async function sendPreinscription(data, photos, lang) {
  const results = await Promise.allSettled([
    sendOrganizerNotification(data, photos),
    sendConfirmation(data, lang),
  ]);
  if (results[0].status === 'rejected') throw results[0].reason;
  if (results[1].status === 'rejected') console.warn('Accusé candidat non envoyé :', results[1].reason);
}

// ---------------------------------------------------------------------
//  Validation (candidature retenue)
// ---------------------------------------------------------------------
async function sendValidation(data, lang) {
  if (!data.email) return;
  const pr = prenomDe(data);
  const inner = L(lang,
    `<p style="${P}">Bonjour ${pr},</p>
     <p style="${P}">Nous avons le plaisir de vous informer que votre candidature au <strong>Week-end Artisanal de Famiflora</strong> a été <strong>retenue</strong>. 🎉 Nous serons ravis de vous compter parmi nos exposants.</p>
     <p style="${P}">Vous recevrez prochainement, par e-mail, la <strong>facture</strong> correspondant à la formule de participation que vous avez choisie. Le règlement de celle-ci confirmera définitivement votre emplacement.</p>
     <p style="${P}">Nous restons à votre entière disposition pour toute question et vous remercions chaleureusement de votre confiance.</p>
     ${signatureBloc(lang)}`,
    `<p style="${P}">Hallo ${pr},</p>
     <p style="${P}">Wij hebben het genoegen u te melden dat uw kandidatuur voor het <strong>Ambachtenweekend van Famiflora</strong> werd <strong>weerhouden</strong>. 🎉 Wij zijn verheugd u als exposant te mogen verwelkomen.</p>
     <p style="${P}">U ontvangt binnenkort per e-mail de <strong>factuur</strong> voor de door u gekozen deelnameformule. De betaling ervan bevestigt definitief uw standplaats.</p>
     <p style="${P}">Wij blijven volledig ter beschikking voor al uw vragen en danken u van harte voor uw vertrouwen.</p>
     ${signatureBloc(lang)}`);
  const text = L(lang,
    `Bonjour ${(data.nom || '').split(' ')[0] || ''},\n\nVotre candidature au Week-end Artisanal de Famiflora a été retenue. Nous serons ravis de vous compter parmi nos exposants.\n\nVous recevrez prochainement la facture correspondant à la formule choisie. Son règlement confirmera votre emplacement.\n\nL'équipe d'organisation du Week-end Artisanal de Famiflora`,
    `Hallo ${(data.nom || '').split(' ')[0] || ''},\n\nUw kandidatuur voor het Ambachtenweekend van Famiflora werd weerhouden. Wij verwelkomen u graag als exposant.\n\nU ontvangt binnenkort de factuur voor de gekozen formule. De betaling bevestigt uw standplaats.\n\nHet organisatieteam van het Ambachtenweekend van Famiflora`);
  await getTransport().sendMail({
    from: EXPEDITEUR, to: data.email,
    subject: L(lang, 'Votre candidature au Week-end Artisanal est retenue ✅', 'Uw kandidatuur voor het Ambachtenweekend is weerhouden ✅'),
    text, html: emailShell(lang, L(lang, '✅ Votre candidature est retenue', '✅ Uw kandidatuur is weerhouden'), inner),
  });
}

// ---------------------------------------------------------------------
//  Refus (candidature non retenue)
// ---------------------------------------------------------------------
async function sendRejection(data, lang) {
  if (!data.email) return;
  const pr = prenomDe(data);
  const inner = L(lang,
    `<p style="${P}">Bonjour ${pr},</p>
     <p style="${P}">Nous vous remercions sincèrement de l'intérêt que vous portez au <strong>Week-end Artisanal de Famiflora</strong> et du temps consacré à votre pré-inscription.</p>
     <p style="${P}">Le nombre de places étant limité, nous veillons à préserver un équilibre et une diversité entre les exposants. Après une étude attentive de l'ensemble des candidatures, nous ne sommes malheureusement pas en mesure de retenir la vôtre pour cette édition.</p>
     <p style="${P}">Ce choix ne remet nullement en cause la qualité de votre travail. Nous serions heureux d'étudier à nouveau votre candidature lors d'une prochaine édition et vous encourageons vivement à vous représenter.</p>
     <p style="${P}">Nous vous remercions de votre compréhension et vous souhaitons une pleine réussite dans vos projets.</p>
     ${signatureBloc(lang)}`,
    `<p style="${P}">Hallo ${pr},</p>
     <p style="${P}">Wij danken u oprecht voor uw interesse in het <strong>Ambachtenweekend van Famiflora</strong> en voor de tijd die u aan uw voorinschrijving besteedde.</p>
     <p style="${P}">Aangezien het aantal plaatsen beperkt is, waken wij over een evenwicht en een diversiteit tussen de exposanten. Na een aandachtige beoordeling van alle kandidaturen kunnen wij de uwe voor deze editie jammer genoeg niet weerhouden.</p>
     <p style="${P}">Deze keuze doet geenszins afbreuk aan de kwaliteit van uw werk. Wij zouden uw kandidatuur graag opnieuw bekijken bij een volgende editie en moedigen u van harte aan u opnieuw kandidaat te stellen.</p>
     <p style="${P}">Wij danken u voor uw begrip en wensen u veel succes met uw projecten.</p>
     ${signatureBloc(lang)}`);
  const text = L(lang,
    `Bonjour ${(data.nom || '').split(' ')[0] || ''},\n\nMerci de l'intérêt porté au Week-end Artisanal de Famiflora. Le nombre de places étant limité, nous ne sommes malheureusement pas en mesure de retenir votre candidature pour cette édition.\n\nCe choix ne remet pas en cause la qualité de votre travail ; n'hésitez pas à vous représenter lors d'une prochaine édition.\n\nL'équipe d'organisation du Week-end Artisanal de Famiflora`,
    `Hallo ${(data.nom || '').split(' ')[0] || ''},\n\nBedankt voor uw interesse in het Ambachtenweekend van Famiflora. Aangezien het aantal plaatsen beperkt is, kunnen wij uw kandidatuur voor deze editie jammer genoeg niet weerhouden.\n\nDeze keuze doet geen afbreuk aan de kwaliteit van uw werk; stel u gerust opnieuw kandidaat bij een volgende editie.\n\nHet organisatieteam van het Ambachtenweekend van Famiflora`);
  await getTransport().sendMail({
    from: EXPEDITEUR, to: data.email,
    subject: L(lang, 'Votre candidature au Week-end Artisanal de Famiflora', 'Uw kandidatuur voor het Ambachtenweekend van Famiflora'),
    text, html: emailShell(lang, L(lang, 'Votre candidature au Week-end Artisanal', 'Uw kandidatuur voor het Ambachtenweekend'), inner),
  });
}

// ---------------------------------------------------------------------
//  Envoi de la facture
// ---------------------------------------------------------------------
async function sendFacture(data, attachment, lang) {
  if (!data.email) return;
  const pr = prenomDe(data);
  const inner = L(lang,
    `<p style="${P}">Bonjour ${pr},</p>
     <p style="${P}">Suite à la validation de votre participation au <strong>Week-end Artisanal de Famiflora</strong>, veuillez trouver ci-joint la <strong>facture</strong> correspondant à votre réservation.</p>
     <p style="${P}">Nous vous remercions de bien vouloir procéder à son règlement selon les modalités qui y sont indiquées. Le paiement confirmera définitivement votre emplacement pour l'événement.</p>
     <p style="${P}">Pour toute question relative à cette facture, n'hésitez pas à nous contacter.</p>
     ${signatureBloc(lang)}`,
    `<p style="${P}">Hallo ${pr},</p>
     <p style="${P}">Naar aanleiding van de goedkeuring van uw deelname aan het <strong>Ambachtenweekend van Famiflora</strong> vindt u hierbij de <strong>factuur</strong> voor uw reservering.</p>
     <p style="${P}">Gelieve de betaling uit te voeren volgens de vermelde voorwaarden. De betaling bevestigt definitief uw standplaats voor het evenement.</p>
     <p style="${P}">Voor elke vraag over deze factuur kunt u ons steeds contacteren.</p>
     ${signatureBloc(lang)}`);
  const text = L(lang,
    `Bonjour ${(data.nom || '').split(' ')[0] || ''},\n\nSuite à la validation de votre participation, veuillez trouver ci-joint la facture correspondant à votre réservation. Merci de procéder à son règlement selon les modalités indiquées.\n\nL'équipe d'organisation du Week-end Artisanal de Famiflora`,
    `Hallo ${(data.nom || '').split(' ')[0] || ''},\n\nNaar aanleiding van de goedkeuring van uw deelname vindt u hierbij de factuur voor uw reservering. Gelieve de betaling volgens de vermelde voorwaarden uit te voeren.\n\nHet organisatieteam van het Ambachtenweekend van Famiflora`);
  await getTransport().sendMail({
    from: EXPEDITEUR, to: data.email,
    subject: L(lang, 'Votre facture — Week-end Artisanal de Famiflora', 'Uw factuur — Ambachtenweekend van Famiflora'),
    text, html: emailShell(lang, L(lang, '🧾 Votre facture', '🧾 Uw factuur'), inner),
    attachments: attachment ? [attachment] : [],
  });
}

module.exports = {
  isConfigured, sendPreinscription, LABELS,
  sendValidation, sendRejection, sendFacture,
};
