/* =====================================================================
   i18n.js — Bascule FR / NL du site public (Week-end Artisanal)
   ---------------------------------------------------------------------
   Traduit les textes affichés sans modifier le HTML source : on parcourt
   les nœuds de texte et les placeholders et on remplace via un dictionnaire.
   Les VALEURS soumises (value des radios/checkbox) restent en français,
   pour que l'admin (en FR) reçoive des données cohérentes.
   La langue choisie est mémorisée et transmise au serveur (champ « langue »)
   pour que les e-mails partent dans la bonne langue.
   ===================================================================== */
(function () {
  'use strict';

  // Dictionnaire FR → NL (clé = texte français EXACT tel qu'affiché).
  var FWD = {
    // En-tête
    'Artisans, créateurs, producteurs : rejoignez un week-end chaleureux dédié au savoir-faire, aux matières naturelles et aux créations faites main.':
      'Ambachtslieden, makers en producenten: sluit je aan bij een warm weekend gewijd aan vakmanschap, natuurlijke materialen en handgemaakte creaties.',
    '2ᵉ édition — Famiflora Mouscron · Date à définir': '2ᵉ editie — Famiflora Moeskroen · Datum te bepalen',
    'PRÉ-INSCRIPTION': 'VOORINSCHRIJVING',
    // Encadré
    'Pré-inscription': 'Voorinschrijving',
    'Ceci est une pré-inscription.': 'Dit is een voorinschrijving.',
    "Votre demande sera étudiée par notre équipe. Votre participation ne sera confirmée qu'après validation.":
      'Uw aanvraag wordt door ons team bekeken. Uw deelname wordt pas na goedkeuring bevestigd.',
    'Vous recevrez ensuite :': 'U ontvangt vervolgens:',
    'un e-mail de confirmation': 'een bevestigingsmail',
    'la validation de votre inscription': 'de goedkeuring van uw inschrijving',
    "la facture correspondant à votre réservation, 1 mois avant l'évènement":
      'de factuur voor uw reservering, 1 maand vóór het evenement',
    // Section 1
    'Informations générales': 'Algemene informatie',
    "Nom & prénom de l'artisan": 'Naam & voornaam van de ambachtsman',
    'Veuillez indiquer votre nom et prénom.': 'Gelieve uw naam en voornaam in te vullen.',
    "Nom de l'entreprise": 'Naam van het bedrijf',
    'Veuillez indiquer le nom de votre entreprise.': 'Gelieve de naam van uw bedrijf in te vullen.',
    'Téléphone': 'Telefoon',
    'Veuillez indiquer un numéro de téléphone valide.': 'Gelieve een geldig telefoonnummer in te vullen.',
    'ex. 056 33 66 00': 'bv. 056 33 66 00',
    'Adresse e-mail': 'E-mailadres',
    'Veuillez indiquer une adresse e-mail valide.': 'Gelieve een geldig e-mailadres in te vullen.',
    'vous@exemple.be': 'u@voorbeeld.be',
    'Instagram — lien': 'Instagram — link',
    'Facebook — lien': 'Facebook — link',
    'Adresse complète': 'Volledig adres',
    'Veuillez indiquer votre adresse complète.': 'Gelieve uw volledig adres in te vullen.',
    'Rue, numéro, code postal, ville': 'Straat, nummer, postcode, stad',
    'Numéro de TVA': 'Btw-nummer',
    'Veuillez indiquer votre numéro de TVA.': 'Gelieve uw btw-nummer in te vullen.',
    'ex. BE 0123.456.789': 'bv. BE 0123.456.789',
    "J'autorise Famiflora à utiliser le nom de mon compte Facebook ou Instagram dans ses publications afin de promouvoir l'événement.":
      'Ik geef Famiflora toestemming om de naam van mijn Facebook- of Instagram-account in haar publicaties te gebruiken om het evenement te promoten.',
    'Oui': 'Ja',
    'Non': 'Nee',
    'Veuillez faire un choix.': 'Gelieve een keuze te maken.',
    // Section 2
    'Présence sur site': 'Aanwezigheid ter plaatse',
    'Nombre de personnes présentes pendant le week-end': 'Aantal aanwezige personen tijdens het weekend',
    'Veuillez indiquer le nombre de personnes.': 'Gelieve het aantal personen in te vullen.',
    "Heure d'arrivée prévue le samedi": 'Verwacht aankomstuur op zaterdag',
    'Montage des stands dès 7h00 — ouverture au public à 9h00.': 'Opbouw van de stands vanaf 7u00 — opening voor het publiek om 9u00.',
    "Veuillez indiquer votre heure d'arrivée.": 'Gelieve uw aankomstuur in te vullen.',
    // Section 3
    'Stand': 'Stand',
    'Dimensions souhaitées': 'Gewenste afmetingen',
    'Longueur (m)': 'Lengte (m)',
    'Veuillez indiquer la longueur.': 'Gelieve de lengte in te vullen.',
    'Largeur (m)': 'Breedte (m)',
    'Veuillez indiquer la largeur.': 'Gelieve de breedte in te vullen.',
    'Mobilier apporté': 'Meegebracht meubilair',
    'Tables': 'Tafels',
    'Chaises': 'Stoelen',
    'Barnum': 'Partytent',
    'Autre :': 'Andere:',
    'Précisez le mobilier que vous apportez…': 'Preciseer welk meubilair u meebrengt…',
    // Section 4
    'Électricité': 'Elektriciteit',
    "Avez-vous besoin d'électricité ?": 'Heeft u elektriciteit nodig?',
    "Type d'appareils": 'Type toestellen',
    'ex. four, frigo, machine à coudre…': 'bv. oven, koelkast, naaimachine…',
    'Puissance estimée (Watts)': 'Geschat vermogen (Watt)',
    'ex. 1500': 'bv. 1500',
    // Section 5
    'Produits exposés': 'Tentoongestelde producten',
    'Alimentaire': 'Voeding',
    'Artisanat non alimentaire': 'Niet-voedingsambacht',
    'Précisez les produits que vous exposez…': 'Preciseer welke producten u tentoonstelt…',
    'Veuillez cocher au moins une catégorie.': 'Gelieve minstens één categorie aan te vinken.',
    // Section 6
    "Photos de votre activité": "Foto's van uw activiteit",
    '(obligatoire)': '(verplicht)',
    'Merci de joindre': 'Voeg alstublieft',
    "3 photos obligatoires": "3 verplichte foto's",
    'représentant :': 'toe die het volgende voorstellen:',
    'vos créations': 'uw creaties',
    'votre stand': 'uw stand',
    'votre activité artisanale': 'uw ambachtelijke activiteit',
    "Ces photos permettront au comité d'organisation d'étudier votre candidature.":
      "Deze foto's laten het organisatiecomité toe uw kandidatuur te beoordelen.",
    'Image 1 — Joindre une photo': 'Afbeelding 1 — Voeg een foto toe',
    'Image 2 — Joindre une photo': 'Afbeelding 2 — Voeg een foto toe',
    'Image 3 — Joindre une photo': 'Afbeelding 3 — Voeg een foto toe',
    'Glissez-déposez ou cliquez': 'Sleep en plaats of klik',
    'JPG · PNG · WEBP — max 10 Mo': 'JPG · PNG · WEBP — max 10 MB',
    "L'envoi des trois photos est obligatoire.": "Het versturen van de drie foto's is verplicht.",
    // Section 7
    'Tarifs': 'Tarieven',
    'Formule de participation': 'Deelnameformule',
    'Week-end complet + électricité': 'Volledig weekend + elektriciteit',
    'Démonstration artisanale sur place': 'Ambachtelijke demonstratie ter plaatse',
    'Vente uniquement': 'Enkel verkoop',
    'Samedi uniquement — sans électricité': 'Enkel zaterdag — zonder elektriciteit',
    'Table 2 mètres': 'Tafel 2 meter',
    'Dimanche uniquement — sans électricité': 'Enkel zondag — zonder elektriciteit',
    'Veuillez choisir une formule de participation.': 'Gelieve een deelnameformule te kiezen.',
    // Section 8
    'Besoins particuliers': 'Bijzondere behoeften',
    'Expliquez ici vos besoins particuliers...': 'Leg hier uw bijzondere behoeften uit...',
    // Section 9
    'Engagement': 'Verbintenis',
    "Je certifie que les informations fournies sont exactes et je m'engage à respecter le":
      'Ik verklaar dat de verstrekte informatie juist is en ik verbind mij ertoe het',
    'règlement du Week-end Artisanal de Famiflora': 'reglement van het Ambachtenweekend van Famiflora',
    "J'accepte le règlement de l'événement ainsi que la": 'Ik aanvaard het reglement van het evenement evenals het',
    'politique de confidentialité (RGPD)': 'privacybeleid (AVG)',
    'concernant le traitement de mes données personnelles.': 'betreffende de verwerking van mijn persoonsgegevens.',
    'Veuillez cocher les deux cases pour continuer.': 'Gelieve beide vakjes aan te vinken om verder te gaan.',
    'Date': 'Datum',
    'Veuillez indiquer la date.': 'Gelieve de datum in te vullen.',
    'Signature électronique (nom complet)': 'Elektronische handtekening (volledige naam)',
    'Tapez votre nom complet': 'Typ uw volledige naam',
    'Veuillez signer en tapant votre nom complet.': 'Gelieve te ondertekenen door uw volledige naam te typen.',
    "⚠️ Votre inscription n'est définitive qu'après validation par Famiflora.":
      '⚠️ Uw inschrijving is pas definitief na goedkeuring door Famiflora.',
    'ENVOYER MA PRÉ-INSCRIPTION': 'MIJN VOORINSCHRIJVING VERSTUREN',
    '💾 Vos réponses sont sauvegardées automatiquement sur cet appareil : vous pouvez quitter la page et revenir plus tard (photos non comprises).':
      "💾 Uw antwoorden worden automatisch op dit toestel opgeslagen: u kunt de pagina verlaten en later terugkomen (foto's niet inbegrepen).",
    // Page de remerciement
    '✅ Reçu de votre pré-inscription': '✅ Ontvangst van uw voorinschrijving',
    'Bonjour,': 'Hallo,',
    'Nous vous remercions pour votre pré-inscription.': 'Bedankt voor uw voorinschrijving.',
    "Votre dossier va être étudié par notre équipe. Le nombre de places étant limité, nous accordons une attention particulière à la diversité des exposants. C'est pourquoi nous évitons les doublons ainsi que la présence d'artisans proposant des activités ou des produits similaires, afin de préserver un équilibre bénéfique pour l'ensemble des participants. Vous recevrez prochainement un e-mail vous informant de la décision concernant votre candidature.":
      'Uw dossier wordt door ons team beoordeeld. Aangezien het aantal plaatsen beperkt is, besteden wij bijzondere aandacht aan de diversiteit van de exposanten. Daarom vermijden wij dubbels en de aanwezigheid van ambachtslieden met gelijkaardige activiteiten of producten, om een evenwicht te bewaren dat voor alle deelnemers voordelig is. U ontvangt binnenkort een e-mail met de beslissing over uw kandidatuur.',
    'Si votre candidature est retenue, la facture correspondant à la formule de participation choisie vous sera envoyée par e-mail un mois avant l\'événement.':
      'Als uw kandidatuur wordt weerhouden, ontvangt u ongeveer één maand vóór het evenement per e-mail de factuur voor de gekozen deelnameformule.',
    'Nous vous remercions de votre confiance et restons à votre disposition pour toute question.':
      'Wij danken u voor uw vertrouwen en blijven ter beschikking voor al uw vragen.',
    'Cordialement,': 'Met vriendelijke groeten,',
    "L'équipe d'organisation du Week-end Artisanal de Famiflora.": 'Het organisatieteam van het Ambachtenweekend van Famiflora.',
    '📋 Récapitulatif de votre pré-inscription': '📋 Overzicht van uw voorinschrijving',
    "🖨️ Imprimer ma fiche d'inscription": '🖨️ Mijn inschrijvingsfiche afdrukken',
    '↩️ Nouvelle pré-inscription': '↩️ Nieuwe voorinschrijving',
    // Colonne latérale
    '📸 En images': '📸 In beeld',
    "Retour sur la 1ʳᵉ édition du Week-end Artisanal.": 'Terugblik op de 1ᵉ editie van het Ambachtenweekend.',
    'Voir toute la galerie →': 'Bekijk de volledige galerij →',
    '📄 Documents': '📄 Documenten',
    'Règlement du week-end (PDF)': 'Reglement van het weekend (PDF)',
    'Confidentialité & RGPD': 'Privacy & AVG',
    'Informations pratiques': 'Praktische informatie',
    '📍 Lieu': '📍 Locatie',
    'Personne de contact :': 'Contactpersoon:',
    'Téléphone :': 'Telefoon:',
    '✉️ Email :': '✉️ E-mail:',
    '🗓️ Horaires': '🗓️ Openingsuren',
    'Samedi': 'Zaterdag',
    'Montage des stands': 'Opbouw stands',
    'Ouverture au public': 'Opening voor publiek',
    'Dimanche': 'Zondag',
    'Démontage': 'Afbraak',
    'Fermeture': 'Sluiting',
    // Galerie plein écran
    '📸 Galerie — Week-end Artisanal': '📸 Galerij — Ambachtenweekend',
    // Pied de page
    'Règlement du week-end': 'Reglement van het weekend',
    '© Famiflora – Week-end Artisanal': '© Famiflora – Ambachtenweekend',
    // Chaînes JavaScript (via waT)
    'Envoi en cours…': 'Bezig met verzenden…',
    "L'envoi a échoué. Vérifiez votre connexion et réessayez, ou contactez-nous : cyril.loiseau@famiflora.be":
      'Het versturen is mislukt. Controleer uw verbinding en probeer opnieuw, of neem contact op: cyril.loiseau@famiflora.be',
    'Format non accepté. Utilisez JPG, PNG ou WEBP.': 'Formaat niet toegestaan. Gebruik JPG, PNG of WEBP.',
    'Photo trop lourde (maximum 10 Mo).': 'Foto te zwaar (maximum 10 MB).',
    'Étape': 'Stap',
    'Photos jointes': "Bijgevoegde foto's",
    'photos': "foto's",
    // Libellés du récapitulatif (page de remerciement)
    'Nom & prénom': 'Naam & voornaam',
    'Entreprise': 'Bedrijf',
    'E-mail': 'E-mail',
    'Adresse': 'Adres',
    'N° TVA': 'Btw-nr',
    'Autorisation réseaux sociaux': 'Toestemming sociale media',
    'Personnes présentes': 'Aanwezige personen',
    'Arrivée samedi': 'Aankomst zaterdag',
    'Longueur stand (m)': 'Lengte stand (m)',
    'Largeur stand (m)': 'Breedte stand (m)',
    'Mobilier apporté ': 'Meegebracht meubilair ',
    'Mobilier — autre': 'Meubilair — andere',
    "Type d'appareils": 'Type toestellen',
    'Puissance (W)': 'Vermogen (W)',
    'Produits — autre': 'Producten — andere',
    'Formule choisie': 'Gekozen formule',
    'Signature': 'Handtekening'
  };

  // Dictionnaire inverse NL → FR (pour rebasculer en français).
  var REV = {};
  for (var k in FWD) { if (FWD.hasOwnProperty(k) && !REV[FWD[k]]) REV[FWD[k]] = k; }

  var PDF_FR = 'reglement-week-end.pdf', PDF_NL = 'Reglement_van_het_weekend.pdf';

  // Langue courante (mémorisée), disponible dès le chargement du <head>.
  var saved = 'fr';
  try { saved = localStorage.getItem('wa_lang') || 'fr'; } catch (e) {}
  window.waLang = (saved === 'nl') ? 'nl' : 'fr';

  // Traduction d'une chaîne (pour le JavaScript du formulaire).
  window.waT = function (fr) { return (window.waLang === 'nl' && FWD[fr]) ? FWD[fr] : fr; };

  function collectTextNodes() {
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentNode;
        if (!p) return NodeFilter.FILTER_REJECT;
        var tag = p.nodeName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA') return NodeFilter.FILTER_REJECT;
        if (p.closest && p.closest('#feeBack')) return NodeFilter.FILTER_REJECT;
        return n.nodeValue && n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var nodes = [], n;
    while ((n = walker.nextNode())) nodes.push(n);
    return nodes;
  }

  function applyLang(l) {
    window.waLang = (l === 'nl') ? 'nl' : 'fr';
    var MAP = (window.waLang === 'nl') ? FWD : REV;

    // 1) Nœuds de texte
    collectTextNodes().forEach(function (n) {
      var raw = n.nodeValue, key = raw.trim();
      if (MAP[key]) n.nodeValue = raw.replace(key, MAP[key]);
    });
    // 2) Placeholders
    document.querySelectorAll('[placeholder]').forEach(function (el) {
      var key = el.getAttribute('placeholder').trim();
      if (MAP[key]) el.setAttribute('placeholder', MAP[key]);
    });
    // 3) Liens vers le règlement (PDF selon la langue)
    document.querySelectorAll('a[href]').forEach(function (a) {
      var h = a.getAttribute('href');
      if (h === PDF_FR || h === PDF_NL) a.setAttribute('href', window.waLang === 'nl' ? PDF_NL : PDF_FR);
    });
    // 4) Attributs divers
    document.documentElement.setAttribute('lang', window.waLang);
    var lf = document.getElementById('waLangField');
    if (lf) lf.value = window.waLang;
    document.querySelectorAll('.lang-switch button').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-lang') === window.waLang);
    });
    try { localStorage.setItem('wa_lang', window.waLang); } catch (e) {}
    // Rafraîchir l'indicateur d'étape si présent
    if (window.updateProgress) { try { window.updateProgress(); } catch (e) {} }
  }
  window.waApply = applyLang;

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.lang-switch button').forEach(function (b) {
      b.addEventListener('click', function () { applyLang(b.getAttribute('data-lang')); });
    });
    // Applique la langue mémorisée (si NL, traduit la page).
    applyLang(window.waLang);
  });
})();
