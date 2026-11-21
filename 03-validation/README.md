# 03 : valider ce que le client envoie

Retour au tableau de tâches en mémoire, pour se concentrer sur une
seule route : `POST /tasks` crée une tâche pour l'utilisateur connecté.
Le corps attendu est `{ title, done }`, `done` valant `false` s'il est
absent.

Aujourd'hui, la route range dans la tâche tout ce que le client
envoie. Un titre de 10 000 caractères, un titre vide, `done: "oui"`,
des champs inventés : tout passe. Pire, un client qui envoie
`ownerId: 2` crée une tâche au nom de bob, et `ownerId` du client
écrase celui du jeton. C'est l'affectation de masse (mass assignment) :
le client écrit un champ qu'il n'a pas le droit de toucher. L'OWASP
API Security Top 10 la range dans « Broken Object Property Level
Authorization ».

## Ce que vous devez obtenir

- `title` est obligatoire, c'est un texte, de 1 à 120 caractères une
  fois les espaces du début et de la fin retirés, et il est enregistré
  sans ces espaces ;
- `done`, s'il est présent, vaut `true` ou `false`, rien d'autre ;
- sinon : 400 et `{ error: '...' }` avec un message qui dit ce qui ne
  va pas, et rien n'est enregistré ;
- `ownerId` est toujours celui du jeton, `id` est toujours fixé par le
  serveur ;
- les champs inconnus ne sont pas enregistrés : la tâche n'a que `id`,
  `ownerId`, `title` et `done`.

Écrivez la validation dans une fonction à part, `validerTache`, qui
reçoit le corps de la requête et ne garde que les champs autorisés.
Vous ne modifiez que `app.js`, sans ajouter de bibliothèque.

## Au départ : 8 tests rouges sur 13

- `sans titre : 400 avec un message`
- `titre fait d'espaces : 400`
- `titre de 121 ou 10 000 caractères : 400`
- `titre qui n'est pas du texte : 400`
- `le titre est enregistré sans les espaces autour`
- `done en chaîne : 400`
- `ownerId envoyé par le client est ignoré`
- `les champs inconnus ne sont pas enregistrés`

Les 5 tests fonctionnels passent déjà et doivent rester verts, dont
`un titre de 120 caractères est accepté` : la borne est incluse.

```bash
npx jest 03-validation
```

Indice : partez d'une liste blanche. On ne retire pas les champs
interdits, on choisit ceux qu'on garde.
