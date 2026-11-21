// Exercice 01 : une dépendance vulnérable (npm audit)
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const _ = require('lodash');

// Clé de signature des jetons. En dur pour l'instant :
// la session 4 la sortira du code (variable d'environnement).
const JWT_SECRET = 'cle-de-dev-ilaria-a-ne-pas-garder';

const app = express();
app.use(express.json());

// Comptes pré-enregistrés (password contient le hash bcrypt)
const users = [
  {
    id: 1,
    email: 'alice@ilaria.test',
    role: 'user',
    // mot de passe : alice123
    password:
      '$2b$10$geEr9Zc64xkKj1wxt/.FMu5rpcLHsElh48JvjYn.O8e4mxBo3r2hm',
  },
  {
    id: 2,
    email: 'bob@ilaria.test',
    role: 'user',
    // mot de passe : bob123
    password:
      '$2b$10$qCP71I9K9mxSa/g.7XhZ1uc5gZFDesJfnQhIPj22Asv7RxnDpCESa',
  },
  {
    id: 3,
    email: 'admin@ilaria.test',
    role: 'admin',
    // mot de passe : admin123
    password:
      '$2b$10$XXXs/Zn9D/o6MXf8LJQmGuJ1MNYngoPfNzP.vkD3.kktznBcKpr3.',
  },
];

const tasks = [
  { id: 1, ownerId: 1, title: 'Réviser le hachage', done: true },
  { id: 2, ownerId: 1, title: 'Lire la RFC 7519', done: false },
  { id: 3, ownerId: 2, title: 'Écrire les tests', done: false },
  { id: 4, ownerId: 3, title: 'Préparer la démo', done: false },
];

// Vérifie le jeton et range l'utilisateur dans req.user
function authentifier(req, res, next) {
  const entete = req.headers.authorization || '';
  const [type, token] = entete.split(' ');
  if (type !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Jeton manquant' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    });
    req.user = { id: Number(payload.sub), role: payload.role };
    next();
  } catch {
    res.status(401).json({ error: 'Jeton invalide' });
  }
}

app.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  const user = users.find((u) => u.email === email);
  const ok = user && (await bcrypt.compare(password, user.password));
  if (!ok) {
    return res.status(401).json({ error: 'Identifiants invalides' });
  }
  const token = jwt.sign(
    { sub: String(user.id), role: user.role },
    JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '15m' }
  );
  res.json({ token });
});

// Les tâches de l'utilisateur, triées par titre (lodash)
app.get('/tasks', authentifier, (req, res) => {
  const siennes = tasks.filter((t) => t.ownerId === req.user.id);
  res.json(_.sortBy(siennes, 'title'));
});

// Un résumé en texte, fabriqué avec un gabarit lodash
const gabaritResume = _.template(
  '<%= email %> : <%= total %> tâche(s), dont <%= faites %> faite(s)'
);

app.get('/tasks/resume', authentifier, (req, res) => {
  const user = users.find((u) => u.id === req.user.id);
  const siennes = tasks.filter((t) => t.ownerId === req.user.id);
  const texte = gabaritResume({
    email: user.email,
    total: siennes.length,
    faites: siennes.filter((t) => t.done).length,
  });
  res.type('text').send(texte);
});

module.exports = { app, users, tasks, JWT_SECRET };
