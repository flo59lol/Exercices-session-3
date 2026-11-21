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

// Compare deux versions « 4.17.20 » : négatif si a < b
function comparerVersions(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i];
  }
  return 0;
}

describe('Fonctionnel', () => {
  test('GET /tasks sans jeton : 401', async () => {
    const res = await request(app).get('/tasks');
    expect(res.status).toBe(401);
  });

  test('alice voit ses tâches, triées par titre', async () => {
    const res = await request(app)
      .get('/tasks')
      .set('Authorization', alice);
    expect(res.status).toBe(200);
    expect(res.body.map((t) => t.title)).toEqual([
      'Lire la RFC 7519',
      'Réviser le hachage',
    ]);
  });

  test('alice lit son résumé', async () => {
    const res = await request(app)
      .get('/tasks/resume')
      .set('Authorization', alice);
    expect(res.status).toBe(200);
    expect(res.text).toBe(
      'alice@ilaria.test : 2 tâche(s), dont 1 faite(s)'
    );
  });
});

describe('Sécurité', () => {
  // La version réellement installée dans node_modules,
  // pas celle écrite dans package.json
  test('lodash installé est en 4.18.0 ou plus récent', () => {
    const { version } = require('lodash/package.json');
    const vulnerable = comparerVersions(version, '4.18.0') < 0;
    // En cas d'échec, Jest affiche la version trouvée
    expect({ version, vulnerable }).toEqual({
      version,
      vulnerable: false,
    });
  });
});
