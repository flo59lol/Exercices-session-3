// Exercice 02 : injection SQL
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// SQLite est intégré à Node depuis la version 22.13
const { DatabaseSync } = require('node:sqlite');

// Clé de signature des jetons. En dur pour l'instant :
// la session 4 la sortira du code (variable d'environnement).
const JWT_SECRET = 'cle-de-dev-ilaria-a-ne-pas-garder';

const app = express();
app.use(express.json());

// Base en mémoire : elle est recréée à chaque démarrage
const db = new DatabaseSync(':memory:');
db.exec(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL,
    password TEXT NOT NULL
  );
  CREATE TABLE tasks (
    id INTEGER PRIMARY KEY,
    owner_id INTEGER NOT NULL REFERENCES users(id),
    title TEXT NOT NULL
  );
`);

// Comptes pré-enregistrés (password contient le hash bcrypt)
const ajouterUser = db.prepare(
  'INSERT INTO users (id, email, role, password) VALUES (?, ?, ?, ?)'
);
// mots de passe : alice123, bob123, admin123
ajouterUser.run(
  1,
  'alice@ilaria.test',
  'user',
  '$2b$10$geEr9Zc64xkKj1wxt/.FMu5rpcLHsElh48JvjYn.O8e4mxBo3r2hm'
);
ajouterUser.run(
  2,
  'bob@ilaria.test',
  'user',
  '$2b$10$qCP71I9K9mxSa/g.7XhZ1uc5gZFDesJfnQhIPj22Asv7RxnDpCESa'
);
ajouterUser.run(
  3,
  'admin@ilaria.test',
  'admin',
  '$2b$10$XXXs/Zn9D/o6MXf8LJQmGuJ1MNYngoPfNzP.vkD3.kktznBcKpr3.'
);

const ajouterTache = db.prepare(
  'INSERT INTO tasks (id, owner_id, title) VALUES (?, ?, ?)'
);
ajouterTache.run(1, 1, 'Réviser le hachage');
ajouterTache.run(2, 1, 'Lire la RFC 7519');
ajouterTache.run(3, 1, "Documenter l'API");
ajouterTache.run(4, 2, 'Écrire les tests');
ajouterTache.run(5, 3, 'Préparer la démo');

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

const trouverUserParEmail = db.prepare(
  'SELECT id, role, password FROM users WHERE email = ?'
);

app.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  const user = trouverUserParEmail.get(String(email));
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

const listerTaches = db.prepare(
  'SELECT id, owner_id AS ownerId, title FROM tasks WHERE owner_id = ?'
);
const rechercherTaches = db.prepare(
  'SELECT id, owner_id AS ownerId, title FROM tasks ' +
    'WHERE title LIKE ? AND owner_id = ?'
);

app.get('/tasks', authentifier, (req, res) => {
  res.json(listerTaches.all(req.user.id));
});

// Recherche dans les titres de ses tâches : GET /tasks/search?q=RFC
// Placée avant /tasks/:id, sinon Express y verrait l'id « search »
app.get('/tasks/search', authentifier, (req, res) => {
  const q = String(req.query.q || '');
  try {
    res.json(rechercherTaches.all(`%${q}%`, req.user.id));
  } catch {
    res.status(500).json({ error: 'Erreur interne' });
  }
});

// La tâche est cherchée parmi celles de l'utilisateur
const trouverTache = db.prepare(
  'SELECT id, owner_id AS ownerId, title FROM tasks ' +
    'WHERE id = ? AND owner_id = ?'
);

app.get('/tasks/:id', authentifier, (req, res) => {
  const task = trouverTache.get(Number(req.params.id), req.user.id);
  if (!task) {
    return res.status(404).json({ error: 'Tâche introuvable' });
  }
  res.json(task);
});

module.exports = { app, db, JWT_SECRET };
