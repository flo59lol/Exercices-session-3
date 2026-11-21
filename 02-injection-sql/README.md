# 02 : injection SQL

Les tâches sont maintenant rangées dans une base SQLite, créée en
mémoire au démarrage (`node:sqlite`, intégré à Node 22.13 et plus).
Une nouvelle route cherche dans les titres de ses tâches :
`GET /tasks/search?q=RFC`.

Aujourd'hui, elle fabrique sa requête SQL en collant le texte reçu
dans `q` au milieu de la requête. Ce que tape l'utilisateur devient du
code SQL : c'est une injection, la famille « Injection » de l'OWASP
Top 10. Avec `q=' OR '1'='1`, alice lit les tâches de tout le monde ;
avec un `UNION SELECT`, elle lit la table des utilisateurs, hash
compris. Et une simple apostrophe, dans « l'API », fait planter la
recherche.

Les autres routes (`/login`, `GET /tasks`, `GET /tasks/:id`) font déjà
ce qu'il faut : lisez-les, elles vous montrent la bonne écriture.

## Ce que vous devez obtenir

- la recherche passe par une requête paramétrée : le texte SQL est
  fixe, les valeurs arrivent à part, à la place des `?` ;
- elle reste filtrée sur l'utilisateur connecté, `req.user.id` ;
- elle ne renvoie jamais une erreur 500 pour une apostrophe.

Vous ne modifiez que `app.js`.

## Au départ : 3 tests rouges sur 7

- `« l'API » : une apostrophe ne plante pas`
- `' OR '1'='1 : pas de tâches des autres`
- `UNION SELECT : aucun hash de mot de passe`

Les 4 tests fonctionnels passent déjà et doivent rester verts, dont
`bob ne trouve pas les tâches d'alice` : attention à ne pas perdre le
filtre sur l'utilisateur en réécrivant la requête.

```bash
npx jest 02-injection-sql
```

Indice : `db.prepare(sql)` prépare une requête qui peut contenir des
`?`, et `.all(valeur1, valeur2)` l'exécute avec ces valeurs. Le `%` de
`LIKE` fait partie de la valeur, pas du texte SQL.
