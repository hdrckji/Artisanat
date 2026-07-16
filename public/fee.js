/* =====================================================================
   fee.js — LA FÉE FAMIFLORA (animation d'attente) pour le Week-end Artisanal
   ---------------------------------------------------------------------
   La fée agite sa baguette et fait apparaître un MEUBLE différent toutes
   les 3 s (chaise, table, fauteuil, étagère, armoire, commode, horloge,
   lampadaire). Comme le serveur ne renvoie aucun avancement mesurable
   (envoi des photos + e-mails), on occupe l'attente avec ce petit atelier
   qui se remplit, plutôt qu'un faux pourcentage.

   API : window.feeShow()  → affiche la fée
         window.feeHide()  → la retire
   Langue : lit window.WA_LANG ('fr'|'nl'), sinon <html lang>, défaut 'fr'.
   Autonome : SVG + CSS + JS injectés ici. Inclure via <script src="fee.js" defer>.
   ===================================================================== */
(function () {
  'use strict';

  function lang() {
    var l = window.WA_LANG || document.documentElement.getAttribute('data-lang') || document.documentElement.lang || 'fr';
    return String(l).toLowerCase().indexOf('nl') === 0 ? 'nl' : 'fr';
  }

  /* --- Messages qui défilent (artisanat), FR / NL --- */
  var MESSAGES = [
    ['Le saviez-vous ? Un bon artisan mesure deux fois et coupe une seule fois. 📏', 'Wist je dat? Een goede vakman meet twee keer en zaagt één keer. 📏'],
    ['Fait main, c’est fait avec le cœur. ❤️', 'Handgemaakt is met het hart gemaakt. ❤️'],
    ['Le chêne grandit plus de 100 ans avant de devenir un meuble. 🌳', 'Een eik groeit meer dan 100 jaar voordat hij een meubel wordt. 🌳'],
    ['Chaque création artisanale est unique, comme la tienne. ✨', 'Elk ambachtelijk stuk is uniek, net als het jouwe. ✨'],
    ['Patience et savoir-faire : la recette d’un bel ouvrage. 🔨', 'Geduld en vakmanschap: het recept voor mooi werk. 🔨'],
    ['La fée donne un dernier coup de baguette… 🪄', 'De fee geeft nog een laatste toverslag… 🪄'],
    ['Un bel objet raconte l’histoire des mains qui l’ont fait. 👐', 'Een mooi voorwerp vertelt het verhaal van de handen die het maakten. 👐'],
    ['Encore un instant, la magie opère… ✨', 'Nog een ogenblik, de magie werkt… ✨'],
  ];

  /* --- La fée (branding Famiflora : ailes = feuilles du logo) --- */
  var FEE_SVG = '' +
    '<svg class="fee-perso" viewBox="130 20 360 490" xmlns="http://www.w3.org/2000/svg">' +
    '<defs>' +
    '<linearGradient id="feeSkin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBE1C4"/><stop offset="1" stop-color="#F3CBA3"/></linearGradient>' +
    '<linearGradient id="feeHair" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#94512F"/><stop offset="1" stop-color="#6E3A22"/></linearGradient>' +
    '<linearGradient id="feeDress" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A9D454"/><stop offset="1" stop-color="#84BD3C"/></linearGradient>' +
    '<radialGradient id="feeGlow"><stop offset="0" stop-color="#EAF6CE" stop-opacity="0.85"/><stop offset="0.5" stop-color="#C9E58B" stop-opacity="0.4"/><stop offset="1" stop-color="#8DC63F" stop-opacity="0"/></radialGradient>' +
    '</defs>' +
    '<g class="fee-ailes">' +
    '<path d="M298 318 Q 156 330 140 160 Q 270 152 298 318 Z" fill="#1E6B33"/><path d="M280 296 Q 186 306 176 192 Q 256 186 280 296 Z" fill="#8DC63F"/>' +
    '<path d="M302 318 Q 444 330 460 160 Q 330 152 302 318 Z" fill="#1E6B33"/><path d="M320 296 Q 414 306 424 192 Q 344 186 320 296 Z" fill="#8DC63F"/>' +
    '<path d="M298 330 Q 178 322 170 456 Q 262 466 298 330 Z" fill="#1E6B33"/><path d="M290 340 Q 210 334 206 416 Q 258 424 290 340 Z" fill="#8DC63F"/>' +
    '<path d="M302 330 Q 422 322 430 456 Q 338 466 302 330 Z" fill="#1E6B33"/><path d="M310 340 Q 390 334 394 416 Q 342 424 310 340 Z" fill="#8DC63F"/>' +
    '</g>' +
    '<path d="M282 436 Q 279 462 277 484" stroke="url(#feeSkin)" stroke-width="14" stroke-linecap="round" fill="none"/>' +
    '<path d="M318 436 Q 321 462 323 484" stroke="url(#feeSkin)" stroke-width="14" stroke-linecap="round" fill="none"/>' +
    '<ellipse cx="274" cy="492" rx="16" ry="9" fill="#1E6B33"/><ellipse cx="326" cy="492" rx="16" ry="9" fill="#1E6B33"/>' +
    '<path d="M288 298 L 312 298 L 311 336 L 289 336 Z" fill="#F3CBA3"/>' +
    '<path d="M258 330 Q 300 318 342 330 L 352 422 Q 300 438 248 422 Z" fill="url(#feeDress)"/>' +
    '<path d="M260 342 Q 240 360 246 384 Q 252 396 264 396" stroke="url(#feeSkin)" stroke-width="12" stroke-linecap="round" fill="none"/>' +
    '<circle cx="300" cy="220" r="92" fill="url(#feeSkin)"/>' +
    '<circle cx="300" cy="72" r="37" fill="url(#feeHair)"/>' +
    '<path d="M326 52 Q 342 34 364 36 Q 356 58 334 64 Z" fill="#8DC63F"/>' +
    '<path d="M204 258 Q 184 112 300 88 Q 416 112 396 258 Q 386 262 380 252 Q 386 202 356 178 Q 336 158 300 152 Q 264 158 244 178 Q 214 202 220 252 Q 214 262 204 258 Z" fill="url(#feeHair)"/>' +
    '<g class="fee-yeux"><circle cx="262" cy="232" r="20" fill="#1E4020"/><circle cx="338" cy="232" r="20" fill="#1E4020"/><circle cx="269" cy="224" r="7" fill="#FFFFFF"/><circle cx="345" cy="224" r="7" fill="#FFFFFF"/></g>' +
    '<ellipse cx="230" cy="268" rx="17" ry="10.5" fill="#F0A96B" opacity="0.6"/><ellipse cx="370" cy="268" rx="17" ry="10.5" fill="#F0A96B" opacity="0.6"/>' +
    '<path d="M280 270 Q 300 292 320 270 Q 312 286 300 286 Q 288 286 280 270 Z" fill="#1A1A1A"/>' +
    '<g class="fee-bras">' +
    '<path d="M340 342 Q 366 330 380 306" stroke="url(#feeSkin)" stroke-width="12" stroke-linecap="round" fill="none"/>' +
    '<circle cx="381" cy="303" r="9" fill="#F3CBA3"/><line x1="382" y1="300" x2="402" y2="254" stroke="#8A5B36" stroke-width="6" stroke-linecap="round"/>' +
    '<circle class="fee-halo" cx="405" cy="247" r="42" fill="url(#feeGlow)"/>' +
    '<path d="M405 218 l8 21 21 8 -21 8 -8 21 -8 -21 -21 -8 21 -8 Z" fill="#8DC63F"/><circle cx="405" cy="247" r="6.5" fill="#1E6B33"/>' +
    '<path d="M442 214 l3.5 9 9 3.5 -9 3.5 -3.5 9 -3.5 -9 -9 -3.5 9 -3.5 Z" fill="#B5D95A"/>' +
    '</g>' +
    '</svg>';

  /* --- L'atelier : 8 meubles empilés, révélés un à la fois --- */
  var MEUBLES_SVG = '' +
    '<svg class="fee-meuble-svg" viewBox="0 0 220 240" xmlns="http://www.w3.org/2000/svg">' +
    '<ellipse cx="110" cy="216" rx="82" ry="10" fill="rgba(0,0,0,.28)"/>' +
    // 1. CHAISE
    '<g class="fee-meuble">' +
    '<rect x="72" y="150" width="8" height="58" rx="2" fill="#7a5230"/><rect x="140" y="150" width="8" height="58" rx="2" fill="#7a5230"/>' +
    '<rect x="66" y="140" width="90" height="14" rx="4" fill="#b9713f"/>' +
    '<rect x="72" y="86" width="12" height="60" rx="3" fill="#8a5b36"/><rect x="136" y="86" width="12" height="60" rx="3" fill="#8a5b36"/>' +
    '<rect x="80" y="94" width="60" height="10" rx="3" fill="#c8894f"/><rect x="80" y="114" width="60" height="10" rx="3" fill="#c8894f"/>' +
    '</g>' +
    // 2. TABLE
    '<g class="fee-meuble">' +
    '<rect x="56" y="118" width="108" height="14" rx="4" fill="#b9713f"/><rect x="56" y="132" width="108" height="6" fill="#9c5730"/>' +
    '<rect x="66" y="138" width="10" height="70" fill="#7a5230"/><rect x="144" y="138" width="10" height="70" fill="#7a5230"/>' +
    '</g>' +
    // 3. FAUTEUIL
    '<g class="fee-meuble">' +
    '<rect x="72" y="94" width="76" height="62" rx="9" fill="#9c6a3f"/>' +
    '<rect x="58" y="120" width="20" height="46" rx="7" fill="#8a5b36"/><rect x="142" y="120" width="20" height="46" rx="7" fill="#8a5b36"/>' +
    '<rect x="60" y="150" width="100" height="16" rx="5" fill="#7a5230"/>' +
    '<rect x="80" y="102" width="60" height="30" rx="6" fill="#a9d454"/><rect x="76" y="132" width="68" height="24" rx="6" fill="#8DC63F"/>' +
    '<rect x="70" y="164" width="10" height="44" fill="#7a5230"/><rect x="140" y="164" width="10" height="44" fill="#7a5230"/>' +
    '</g>' +
    // 4. ÉTAGÈRE
    '<g class="fee-meuble">' +
    '<rect x="70" y="66" width="80" height="142" rx="4" fill="#9c5730"/><rect x="76" y="72" width="68" height="130" fill="#c8894f"/>' +
    '<rect x="76" y="110" width="68" height="6" fill="#9c5730"/><rect x="76" y="150" width="68" height="6" fill="#9c5730"/>' +
    '<rect x="80" y="82" width="8" height="26" fill="#b9473f"/><rect x="90" y="78" width="8" height="30" fill="#3c7d47"/><rect x="100" y="84" width="8" height="24" fill="#2b6cb0"/><rect x="112" y="80" width="8" height="28" fill="#e8a53a"/>' +
    '<rect x="84" y="122" width="8" height="26" fill="#3c7d47"/><rect x="94" y="120" width="8" height="28" fill="#b9473f"/><rect x="106" y="124" width="8" height="24" fill="#7a5230"/><rect x="118" y="122" width="8" height="26" fill="#2b6cb0"/>' +
    '<rect x="82" y="160" width="56" height="18" rx="2" fill="#a9663a"/>' +
    '</g>' +
    // 5. ARMOIRE
    '<g class="fee-meuble">' +
    '<rect x="72" y="62" width="76" height="146" rx="4" fill="#8a5b36"/>' +
    '<rect x="78" y="68" width="32" height="134" rx="2" fill="#b9713f"/><rect x="112" y="68" width="32" height="134" rx="2" fill="#b9713f"/>' +
    '<rect x="82" y="78" width="24" height="42" rx="2" fill="#a9663a"/><rect x="116" y="78" width="24" height="42" rx="2" fill="#a9663a"/>' +
    '<circle cx="108" cy="138" r="3" fill="#d9b26a"/><circle cx="116" cy="138" r="3" fill="#d9b26a"/>' +
    '</g>' +
    // 6. COMMODE
    '<g class="fee-meuble">' +
    '<rect x="62" y="118" width="96" height="90" rx="4" fill="#9c5730"/>' +
    '<rect x="70" y="126" width="80" height="22" rx="3" fill="#c8894f"/><rect x="70" y="152" width="80" height="22" rx="3" fill="#c8894f"/><rect x="70" y="178" width="80" height="22" rx="3" fill="#c8894f"/>' +
    '<circle cx="110" cy="137" r="3.5" fill="#7a5230"/><circle cx="110" cy="163" r="3.5" fill="#7a5230"/><circle cx="110" cy="189" r="3.5" fill="#7a5230"/>' +
    '<rect x="64" y="204" width="8" height="8" fill="#7a5230"/><rect x="148" y="204" width="8" height="8" fill="#7a5230"/>' +
    '</g>' +
    // 7. HORLOGE
    '<g class="fee-meuble">' +
    '<rect x="86" y="54" width="48" height="154" rx="6" fill="#7a5230"/>' +
    '<rect x="92" y="60" width="36" height="40" rx="4" fill="#f3e8d6"/>' +
    '<circle cx="110" cy="80" r="15" fill="#faf4e8" stroke="#9c5730" stroke-width="2"/>' +
    '<line x1="110" y1="80" x2="110" y2="70" stroke="#46331f" stroke-width="2"/><line x1="110" y1="80" x2="118" y2="84" stroke="#46331f" stroke-width="2"/>' +
    '<rect x="96" y="110" width="28" height="74" rx="3" fill="#b9713f"/>' +
    '<line x1="110" y1="114" x2="110" y2="168" stroke="#d9b26a" stroke-width="3"/><circle cx="110" cy="170" r="8" fill="#e8a53a"/>' +
    '</g>' +
    // 8. LAMPADAIRE
    '<g class="fee-meuble">' +
    '<ellipse cx="110" cy="206" rx="26" ry="7" fill="#7a5230"/>' +
    '<rect x="106" y="96" width="8" height="110" fill="#8a5b36"/>' +
    '<path d="M82 96 L138 96 L127 58 L93 58 Z" fill="#e8c46b"/><path d="M82 96 L138 96 L127 58 L93 58 Z" fill="#f4d989" opacity="0.55"/>' +
    '<ellipse cx="110" cy="96" rx="28" ry="4" fill="#d9b26a"/>' +
    '</g>' +
    '</svg>';

  var OVERLAY_HTML = '' +
    '<div class="fee-scene">' +
    '<div class="fee-duo">' + FEE_SVG + '<div class="fee-etincelles" id="feeEtincelles"></div>' + MEUBLES_SVG + '</div>' +
    '<div class="fee-barre"><span></span></div>' +
    '<div class="fee-txt" id="feeTxt"></div>' +
    '</div>';

  var CSS = '' +
    '.fee-back{position:fixed;inset:0;z-index:200000;background:radial-gradient(circle at 50% 40%,#3a2618,#140b06);display:none;align-items:center;justify-content:center;opacity:0;transition:opacity .25s}' +
    '.fee-back.on{display:flex;opacity:1}' +
    '.fee-scene{text-align:center;width:min(560px,92vw)}' +
    '.fee-duo{display:flex;align-items:flex-end;justify-content:center;gap:4px;position:relative}' +
    '.fee-perso{width:min(200px,36vw);height:auto;display:block;animation:feeFlotte 3s ease-in-out infinite;transform-origin:50% 70%}' +
    '@keyframes feeFlotte{0%,100%{transform:translateY(0) rotate(-1deg)}50%{transform:translateY(-9px) rotate(1deg)}}' +
    '.fee-ailes{animation:feeAiles 1.5s ease-in-out infinite;transform-origin:300px 300px}' +
    '@keyframes feeAiles{0%,100%{transform:scaleX(1)}50%{transform:scaleX(.9)}}' +
    '.fee-bras{animation:feeCoup 2s cubic-bezier(.36,.07,.3,1) infinite;transform-origin:340px 342px}' +
    '@keyframes feeCoup{0%,40%{transform:rotate(0)}52%{transform:rotate(-26deg)}62%{transform:rotate(22deg)}72%{transform:rotate(-6deg)}82%,100%{transform:rotate(0)}}' +
    '.fee-halo{animation:feeHalo 2s ease-in-out infinite;transform-origin:405px 247px}' +
    '@keyframes feeHalo{0%,45%,100%{opacity:.5;transform:scale(.85)}62%{opacity:1;transform:scale(1.35)}}' +
    '.fee-yeux{animation:feeCligne 4.5s infinite;transform-origin:300px 232px}' +
    '@keyframes feeCligne{0%,94%,100%{transform:scaleY(1)}97%{transform:scaleY(.1)}}' +
    '.fee-meuble-svg{width:min(180px,32vw);height:auto;display:block}' +
    '.fee-meuble{display:none;transform-origin:110px 210px}' +
    '.fee-meuble.on{display:block;animation:feePop .55s cubic-bezier(.2,1.6,.4,1),feeBalance 3.2s ease-in-out .55s infinite}' +
    '@keyframes feePop{from{transform:scale(.1) translateY(24px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}' +
    '@keyframes feeBalance{0%,100%{transform:rotate(-1.2deg)}50%{transform:rotate(1.2deg)}}' +
    '.fee-etincelles{position:absolute;left:52%;top:34%;width:1px;height:1px}' +
    '.fee-et{position:absolute;width:9px;height:9px;background:#e8c46b;border-radius:2px;box-shadow:0 0 8px rgba(232,196,107,.9);animation:feeVole 1.4s ease-in forwards}' +
    '@keyframes feeVole{0%{transform:translate(0,0) scale(.4) rotate(0);opacity:0}20%{opacity:1}100%{transform:translate(var(--dx),var(--dy)) scale(1.1) rotate(220deg);opacity:0}}' +
    '.fee-barre{width:min(340px,80%);height:10px;margin:18px auto 0;background:rgba(255,255,255,.14);border-radius:999px;overflow:hidden}' +
    '.fee-barre span{display:block;height:100%;width:35%;border-radius:999px;background:linear-gradient(90deg,#8DC63F,#1E6B33);animation:feeIndef 1.15s ease-in-out infinite}' +
    '@keyframes feeIndef{0%{transform:translateX(-115%)}100%{transform:translateX(320%)}}' +
    '.fee-txt{margin-top:14px;color:#f3e8d6;font-weight:700;font-size:1rem;font-family:inherit;min-height:2.4em;padding:0 1rem}' +
    '@media (prefers-reduced-motion:reduce){.fee-perso,.fee-ailes,.fee-bras,.fee-halo,.fee-yeux,.fee-meuble.on,.fee-barre span{animation:none}}';

  var back, txtEl, etEl, meubleTimer = null, sparkTimer = null, meubleIdx = -1, msgIdx = -1, built = false;

  function build() {
    if (built) return;
    var style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    back = document.createElement('div');
    back.className = 'fee-back';
    back.id = 'feeBack';
    back.setAttribute('aria-hidden', 'true');
    back.innerHTML = OVERLAY_HTML;
    document.body.appendChild(back);
    txtEl = document.getElementById('feeTxt');
    etEl = document.getElementById('feeEtincelles');
    built = true;
  }

  function nextMessage() {
    if (!txtEl) return;
    var i = msgIdx;
    while (i === msgIdx && MESSAGES.length > 1) i = Math.floor(Math.random() * MESSAGES.length);
    msgIdx = i < 0 ? 0 : i;
    txtEl.textContent = MESSAGES[msgIdx][lang() === 'nl' ? 1 : 0];
  }

  function nextMeuble() {
    var all = back.querySelectorAll('.fee-meuble');
    if (!all.length) return;
    all.forEach(function (g) { g.classList.remove('on'); });
    meubleIdx = (meubleIdx + 1) % all.length;
    all[meubleIdx].classList.add('on');
    nextMessage();
  }

  function spark() {
    if (!etEl || !back.classList.contains('on')) return;
    var s = document.createElement('span');
    s.className = 'fee-et';
    s.style.setProperty('--dx', (60 + Math.random() * 70) + 'px');
    s.style.setProperty('--dy', (40 + Math.random() * 60) + 'px');
    s.style.left = (Math.random() * 14 - 7) + 'px';
    etEl.appendChild(s);
    setTimeout(function () { s.remove(); }, 1500);
  }

  window.feeShow = function () {
    build();
    if (back.classList.contains('on')) return;
    back.classList.add('on');
    back.setAttribute('aria-hidden', 'false');
    meubleIdx = -1;
    nextMeuble();                                  // le premier meuble tout de suite
    meubleTimer = setInterval(nextMeuble, 3000);   // puis un nouveau toutes les 3 s
    sparkTimer = setInterval(spark, 700);
  };

  window.feeHide = function () {
    if (!built || !back) return;
    back.classList.remove('on');
    back.setAttribute('aria-hidden', 'true');
    if (meubleTimer) { clearInterval(meubleTimer); meubleTimer = null; }
    if (sparkTimer) { clearInterval(sparkTimer); sparkTimer = null; }
    back.querySelectorAll('.fee-meuble').forEach(function (g) { g.classList.remove('on'); });
  };

  // Retour arrière navigateur (page depuis le cache) : on retire la fée.
  window.addEventListener('pageshow', function () { window.feeHide(); });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
