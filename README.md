# Week-end Artisanal Famiflora — Pré-inscription (2ᵉ édition)

Page web de pré-inscription des artisans au Week-end Artisanal organisé par Famiflora (Mouscron).

## Contenu

- `public/index.html` — la page complète (design, formulaire, validation, photos, galerie, page de remerciement). Autonome : les logos sont intégrés au fichier.
- `public/confidentialite.html` — page d'information RGPD / protection des données.
- `public/reglement-week-end.pdf` — le règlement du week-end (téléchargeable depuis la page).
- `public/galerie/` — les photos de la galerie (`photo-01.jpg` … `photo-19.jpg`).
- `public/admin.html` — espace administrateur (connexion, consultation, validation, factures, export Excel).
- `server.js` — serveur Express : sert le site, reçoit **et stocke** les pré-inscriptions, expose l'API admin.
- `store.js` — stockage des pré-inscriptions (JSON + fichiers) dans `DATA_DIR`.
- `auth.js` — authentification de l'espace admin (cookie de session signé).
- `mailer.js` — e-mails : accusé candidat, notification organisateur, validation, refus, facture.
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
2. Renseigner **seulement ces 4 variables** (les identifiants de votre serveur SMTP) :
   ```
   SMTP_HOST=smtp.exemple.be
   SMTP_PORT=587
   SMTP_USER=no-reply@famiflora.be
   SMTP_PASS=•••••••••
   ```
3. Redéployer / relancer. Le serveur affiche au démarrage : `✅ Service e-mail (SMTP) configuré.`

> **Les autres variables sont facultatives** — elles ont déjà une valeur par défaut, inutile de les ajouter :
> - `SMTP_SECURE` → déduit du port (465 = SSL, sinon STARTTLS) ;
> - `MAIL_FROM` → par défaut = `SMTP_USER` ;
> - `MAIL_TO` (destinataire des pré-inscriptions) → par défaut = `cyril.loiseau@famiflora.be` ;
> - `MAIL_BCC` → copie cachée, aucune par défaut.

> Tant que le SMTP n'est pas configuré, le formulaire reste **fonctionnel en mode démonstration** :
> il valide tout et affiche la page de remerciement, mais aucun e-mail n'est envoyé (les soumissions
> sont journalisées dans les logs du serveur).

### Lancer en local

```bash
npm install
npm start          # http://localhost:3000
```

## 🔐 Espace administrateur

Accessible sur **`/admin`** (ex. `https://votre-domaine/admin`).

- **Identifiant** : `Famiartisanal` — **Mot de passe** : `Fami+2026*`
  (modifiables via les variables `ADMIN_USER` / `ADMIN_PASS`).
- L'organisateur y retrouve **toutes les pré-inscriptions**, réparties en 3 onglets :
  - **Pré-inscriptions** (en attente) : consulter le détail (infos + 3 photos) et **valider** ou **refuser** (un e-mail poli et professionnel est envoyé au candidat dans les deux cas) ;
  - **Validées** : les candidatures acceptées, séparées entre « facture à envoyer » et « facture envoyée ». Pour chaque inscrit, une zone d'**upload de facture** : à l'envoi, la facture part par e-mail au candidat et la colonne « facture envoyée » passe au vert. Une case **« facture payée »** se coche manuellement ;
  - **Non validées** : les candidatures refusées.
- **Export Excel** (onglet Validées) : cochez les informations à inclure (1 ligne = 1 artisan), avec des colonnes composites possibles (*Contact* = nom + tél + e-mail dans une cellule, *Taille du stand* = longueur × largeur) et les colonnes **Facture envoyée** / **Facture payée**.

## 💾 Persistance des données (IMPORTANT sur Railway)

Les pré-inscriptions et les fichiers (photos, factures) sont stockés sur disque dans le dossier
`DATA_DIR` (par défaut `./data`).

> ⚠️ Le système de fichiers de Railway est **éphémère** : sans volume, les données seraient perdues à
> chaque redéploiement. **Ajoutez un volume** :
> 1. Railway → votre service → **Variables** → `DATA_DIR=/data`
> 2. Railway → **Volumes** → *New Volume*, point de montage **`/data`**.
>
> (En local, aucune action : les données vont dans `./data`, ignoré par git.)

### Variables d'environnement — récapitulatif

| Variable | Rôle | Défaut |
|---|---|---|
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | envoi des e-mails | — (les 4 à renseigner) |
| `ADMIN_USER` / `ADMIN_PASS` | identifiants admin | `Famiartisanal` / `Fami+2026*` |
| `DATA_DIR` | dossier de stockage | `./data` (mettre `/data` + volume sur Railway) |
| `SESSION_SECRET` | secret de signature des sessions | dérivé des identifiants admin |

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
- Espace admin : consultation, validation/refus (avec e-mails), factures et export Excel
- Site entièrement bilingue FR / NL (sélecteur de langue ; e-mails envoyés dans la langue du formulaire ; règlement PDF FR ou NL). L'espace admin est bilingue également.
- Animation « fée Famiflora » pendant l'envoi du formulaire : elle fait apparaître un meuble différent toutes les 3 s (`public/fee.js`)

## Contact

Cyril Loiseau — cyril.loiseau@famiflora.be — 056 33 66 00
Famiflora, Rue Jules Vantieghem 14, 7711 Mouscron
