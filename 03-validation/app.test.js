const request = require('supertest');
const jwt = require('jsonwebtoken');
const { app, tasks, JWT_SECRET } = require('./app');

// Fabrique un jeton valide, sans passer par /login
function jeton(id, role) {
  return jwt.sign({ sub: String(id), role }, JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '15m',
  });
}
const alice = `Bearer ${jeton(1, 'user')}`;
const bob = `Bearer ${jeton(2, 'user')}`;

// Chaque test repart des 4 tâches de départ
const tachesDeDepart = tasks.map((t) => ({ ...t }));
beforeEach(() => {
  const copie = tachesDeDepart.map((t) => ({ ...t }));
  tasks.splice(0, tasks.length, ...copie);
});

function creer(corps, auth = alice) {
  return request(app)
    .post('/tasks')
    .set('Authorization', auth)
    .send(corps);
}

// Vérifie un refus : 400, un message, et rien d'enregistré
async function attendreRefus(corps) {
  const res = await creer(corps);
  expect(res.status).toBe(400);
  expect(typeof res.body.error).toBe('string');
  expect(res.body.error.length).toBeGreaterThan(0);
  expect(tasks).toHaveLength(4);
}

describe('Fonctionnel', () => {
  test('POST /tasks sans jeton : 401', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: 'Sans jeton' });
    expect(res.status).toBe(401);
  });

  test('alice crée une tâche : 201, done à false', async () => {
    const res = await creer({ title: 'Lire le Top 10' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      ownerId: 1,
      title: 'Lire le Top 10',
      done: false,
    });
  });

  test('alice crée une tâche déjà faite', async () => {
    const res = await creer({ title: 'Installer Node', done: true });
    expect(res.status).toBe(201);
    expect(res.body.done).toBe(true);
  });

  test('un titre de 120 caractères est accepté', async () => {
    const res = await creer({ title: 'a'.repeat(120) });
    expect(res.status).toBe(201);
  });

  test('la tâche créée apparaît dans GET /tasks', async () => {
    await creer({ title: 'Lire le Top 10' });
    const res = await request(app)
      .get('/tasks')
      .set('Authorization', alice);
    const titres = res.body.map((t) => t.title);
    expect(titres).toContain('Lire le Top 10');
  });
});

describe('Sécurité', () => {
  test('sans titre : 400 avec un message', async () => {
    await attendreRefus({ done: true });
  });

  test('titre fait d\'espaces : 400', async () => {
    await attendreRefus({ title: '    ' });
  });

  test('titre de 121 ou 10 000 caractères : 400', async () => {
    await attendreRefus({ title: 'a'.repeat(121) });
    await attendreRefus({ title: 'a'.repeat(10000) });
  });

  test('titre qui n\'est pas du texte : 400', async () => {
    await attendreRefus({ title: 42 });
    await attendreRefus({ title: ['Lire', 'le', 'Top 10'] });
  });

  test('le titre est enregistré sans les espaces autour', async () => {
    const res = await creer({ title: '  Lire le Top 10  ' });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Lire le Top 10');
  });

  test('done en chaîne : 400', async () => {
    await attendreRefus({ title: 'Lire le Top 10', done: 'oui' });
    await attendreRefus({ title: 'Lire le Top 10', done: 'false' });
  });

  // Mass assignment : le client choisit le propriétaire
  test('ownerId envoyé par le client est ignoré', async () => {
    const res = await creer({ title: 'Pour bob', ownerId: 2 });
    expect(res.status).toBe(201);
    expect(res.body.ownerId).toBe(1);
    const deBob = await request(app)
      .get('/tasks')
      .set('Authorization', bob);
    const titres = deBob.body.map((t) => t.title);
    expect(titres).not.toContain('Pour bob');
  });

  test('les champs inconnus ne sont pas enregistrés', async () => {
    const res = await creer({
      title: 'Lire le Top 10',
      id: 1,
      role: 'admin',
      priorite: 'haute',
    });
    expect(res.status).toBe(201);
    const creee = tasks[tasks.length - 1];
    expect(Object.keys(creee).sort()).toEqual(
      ['done', 'id', 'ownerId', 'title']
    );
    expect(creee.id).not.toBe(1);
  });
});
