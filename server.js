// Serveur statique minimal pour Railway
// Sert le contenu du dossier /public sur le port fourni par Railway.
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// Toute route inconnue renvoie la page de pré-inscription
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Week-end Artisanal — serveur démarré sur le port ${PORT}`);
});
