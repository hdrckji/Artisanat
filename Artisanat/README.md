# Week-end Artisanal Famiflora — Pré-inscription (2ᵉ édition)

Page web de pré-inscription des artisans au Week-end Artisanal organisé par Famiflora (Mouscron).

## Contenu

- `public/index.html` — la page complète (design, formulaire, validation, photos, page de remerciement). Autonome : les logos sont intégrés au fichier.
- `server.js` — mini serveur Express qui sert la page.
- `package.json` — configuration Node détectée automatiquement par Railway.

## Déploiement sur Railway

1. Sur [railway.app](https://railway.app) : **New Project → Deploy from GitHub repo** → choisir `hdrckji/Artisanat`.
2. Railway détecte Node.js et lance `npm start` automatiquement. Rien d'autre à configurer.
3. Dans l'onglet **Settings → Networking**, cliquer sur **Generate Domain** pour obtenir l'URL publique.

## ⚠️ Configuration de l'envoi du formulaire (à faire)

La page seule ne peut pas envoyer d'e-mails : il faut un service de réception de formulaires.

1. Créer un compte gratuit sur [Formspree](https://formspree.io) (ou [FormSubmit](https://formsubmit.co)).
2. Créer un formulaire pointant vers `cyril.loiseau@famiflora.be` et copier l'URL fournie (ex. `https://formspree.io/f/xxxxxxx`).
3. Dans `public/index.html`, chercher la ligne :
   ```js
   const ENDPOINT = "";
   ```
   et y coller l'URL :
   ```js
   const ENDPOINT = "https://formspree.io/f/xxxxxxx";
   ```
4. Commit + push : Railway redéploie automatiquement.

Ces services gèrent : réception des données + 3 photos en pièces jointes, archivage des soumissions (base de données), e-mail automatique de confirmation au candidat et notification à l'équipe Famiflora.

Tant que `ENDPOINT` est vide, le formulaire fonctionne en **mode démonstration** (validation complète + page de remerciement, sans envoi réel).

## Fonctionnalités

- Design bois / beige / crème / vert Famiflora, responsive (PC, tablette, smartphone)
- Barre de progression (Étape 1/5 → 5/5)
- Validation en temps réel des champs obligatoires
- Sauvegarde automatique du brouillon sur l'appareil (photos exclues)
- Glisser-déposer des 3 photos obligatoires avec prévisualisation (JPG/PNG/WEBP, max 10 Mo)
- Champs électricité conditionnels
- Cases d'engagement + RGPD obligatoires
- Page de remerciement avec récapitulatif + impression de la fiche d'inscription

## Contact

Cyril Loiseau — cyril.loiseau@famiflora.be — 056 33 66 00
Famiflora, Rue Jules Vantieghem 14, 7711 Mouscron
