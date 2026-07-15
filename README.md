# Week-end Artisanal Famiflora — Pré-inscription (2ᵉ édition)

Page web de pré-inscription des artisans au Week-end Artisanal organisé par Famiflora (Mouscron).

## Contenu

- `public/index.html` — la page complète (design, formulaire, validation, photos, galerie, page de remerciement). Autonome : les logos sont intégrés au fichier.
- `public/confidentialite.html` — page d'information RGPD / protection des données.
- `public/reglement-week-end.pdf` — le règlement du week-end (téléchargeable depuis la page).
- `public/galerie/` — les photos de la galerie (`photo-01.jpg` … `photo-19.jpg`).
- `server.js` — serveur Express : sert la page **et** reçoit les pré-inscriptions (`/api/preinscription`).
- `mailer.js` — envoi des e-mails (accusé de réception au candidat + notification à l'organisateur).
- `.env.example` — modèle de configuration SMTP.
- `package.json` — configuration Node détectée automatiquement par Railway.

## Déploiement sur Railway

1. Sur [railway.app](https://railway.app) : **New Project → Deploy from GitHub repo** → choisir `hdrckji/Artisanat`.
2. Railway détecte Node.js et lance `npm start` automatiquement.
3. Dans l'onglet **Settings → Networking**, cliquer sur **Generate Domain** pour obtenir l'URL publique.
4. Configurer l'envoi d'e-mails (voir ci-dessous) dans **Variables**.

## ✉️ Configuration de l'envoi (SMTP)

Le serveur envoie lui-même les e-mails via votre serveur SMTP :

- **au candidat** : un accusé de réception (« votre pré-inscription est bien prise en compte ») ;
- **à l'organisateur** (`cyril.loiseau@famiflora.be`) : toutes les données + les 3 photos en pièces jointes.

### Étapes

1. Copier `.env.example` en `.env` (en local) **ou** ajouter les variables dans l'onglet **Variables** de Railway.
2. Renseigner les identifiants de votre serveur SMTP :
   ```
   SMTP_HOST=smtp.exemple.be
   SMTP_PORT=587
   SMTP_SECURE=false          # true uniquement pour le port 465
   SMTP_USER=no-reply@famiflora.be
   SMTP_PASS=•••••••••
   MAIL_FROM=Week-end Artisanal Famiflora <no-reply@famiflora.be>
   MAIL_TO=cyril.loiseau@famiflora.be
   ```
3. Redéployer / relancer. Le serveur affiche au démarrage : `✅ Service e-mail (SMTP) configuré.`

> Tant que le SMTP n'est pas configuré, le formulaire reste **fonctionnel en mode démonstration** :
> il valide tout et affiche la page de remerciement, mais aucun e-mail n'est envoyé (les soumissions
> sont journalisées dans les logs du serveur).

### Lancer en local

```bash
npm install
npm start          # http://localhost:3000
```

## Fonctionnalités

- Design bois / beige / crème / vert Famiflora, responsive (PC, tablette, smartphone)
- Barre de progression (Étape 1/5 → 5/5)
- Validation en temps réel des champs obligatoires
- Sauvegarde automatique du brouillon sur l'appareil (photos exclues)
- Glisser-déposer des 3 photos obligatoires avec prévisualisation (JPG/PNG/WEBP, max 10 Mo)
- Galerie photos latérale (aperçu + galerie plein écran)
- Liens vers le règlement (PDF) et la page de confidentialité (RGPD)
- Champs électricité conditionnels
- Cases d'engagement + RGPD obligatoires
- Page de remerciement avec récapitulatif + impression de la fiche d'inscription
- Envoi automatique des e-mails (accusé candidat + notification organisateur avec photos)

## Contact

Cyril Loiseau — cyril.loiseau@famiflora.be — 056 33 66 00
Famiflora, Rue Jules Vantieghem 14, 7711 Mouscron
