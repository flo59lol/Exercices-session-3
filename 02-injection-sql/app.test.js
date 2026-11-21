const request = require('supertest');
const jwt = require('jsonwebtoken');
const { app, JWT_SECRET } = require('./app');

// Fabrique un jeton valide, sans passer par /login
function jeton(id, role) {
  return jwt.sign({ sub: String(id), role }, JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '15m',
  });
}
const alice = `Bearer ${jeton(1, 'user')}`;
const bob = `Bearer ${jeton(2, 'user')}`;

// Tâches 1, 2 et 3 : à alice. Tâche 4 : à bob. 5 : à l'admin.
function rechercher(q, auth = alice) {
  return request(app)
    .get('/tasks/search')
    .query({ q })
    .set('Authorization', auth);
}

describe('Fonctionnel', () => {
  test('GET /tasks/search sans jeton : 401', async () => {
    const res = await request(app).get('/tasks/search?q=RFC');
    expect(res.status).toBe(401);
  });

  test('alice cherche « RFC » et trouve sa tâche', async () => {
    const res = await rechercher('RFC');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { id: 2, ownerId: 1, title: 'Lire la RFC 7519' },
    ]);
  });

  test('une recherche vide renvoie toutes ses tâches', async () => {
    const res = await rechercher('');
    expect(res.status).toBe(200);
    expect(res.body.map((t) => t.id)).toEqual([1, 2, 3]);
  });

  test('bob ne trouve pas les tâches d\'alice', async () => {
    const res = await rechercher('RFC', bob);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('Sécurité', () => {
  test('« l\'API » : une apostrophe ne plante pas', async () => {
    const res = await rechercher("l'API");
    expect(res.status).toBe(200);
    const titres = res.body.map((t) => t.title);
    expect(titres).toEqual(["Documenter l'API"]);
  });

  test("' OR '1'='1 : pas de tâches des autres", async () => {
    const res = await rechercher("' OR '1'='1");
    expect(res.status).toBe(200);
    const proprietaires = res.body.map((t) => t.ownerId);
    expect(proprietaires.filter((id) => id !== 1)).toEqual([]);
  });

  test('UNION SELECT : aucun hash de mot de passe', async () => {
    const res = await rechercher(
      "' UNION SELECT id, email, password FROM users --"
    );
    // Un hash bcrypt commence par $2a$, $2b$ ou $2y$
    expect(res.text).not.toMatch(/\$2[aby]\$/);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});
