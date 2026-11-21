# Sécurité applicative avancée : session 3

Auditer et corriger, avec l'OWASP Top 10 pour guide. Quatre exercices
sur l'API de tâches de la session 1, dont l'authentification JWT, les
rôles et le contrôle d'accès sont déjà en place : une dépendance
vulnérable, une injection SQL, des données client acceptées sans
contrôle, puis l'audit automatique dans la CI.

## Installer

Il vous faut Node 22.13 ou plus récent : l'exercice 02 utilise SQLite,
intégré à Node depuis cette version (`node:sqlite`, rien à installer).
Sous Node 22, un avertissement `ExperimentalWarning` s'affiche au
lancement des tests de l'exercice 02 : il est sans conséquence. Dans ce
dossier :

```bash
npm install
```

L'exercice 01 a ses propres dépendances, il s'installe à part :

```bash
cd 01-npm-audit
npm install
```

`npm install` affiche des alertes, dont une sur `deepmerge`, une
dépendance de Jest : elle ne concerne que l'outil de test. L'exercice
01 vous apprend à lire ces alertes. Ne lancez pas `npm audit fix
--force`, qui rétrograderait Jest.

## Lancer un exercice

```bash
cd 01-npm-audit && npx jest
npx jest 02-injection-sql
npx jest 03-validation
```

Depuis ce dossier, `npm test` lance les exercices 02 et 03. L'exercice
04 n'a pas de test Jest : il se vérifie sur GitHub.

Les applications utilisent une clé JWT aléatoire en développement.
En production, définissez `JWT_SECRET` dans l'environnement avec une
valeur secrète et stable ; l'application refuse de démarrer si elle
est absente.

## Le principe

Les exercices 01 à 03 contiennent deux fichiers de code :

- `app.js` : l'application, volontairement vulnérable ;
- `app.test.js` : ses tests, déjà écrits.

Au départ, les tests fonctionnels passent et les tests de sécurité
échouent : ils sont rouges. Votre travail est de modifier le fichier
indiqué dans le `README.md` de l'exercice, et seulement celui-là,
jusqu'à ce que tous les tests passent au vert. Ne touchez pas aux
tests : ils sont le cahier des charges.

Lisez le message d'erreur de chaque test rouge : il dit ce que
l'application renvoie et ce qui était attendu.

| Exercice | Vous modifiez | Tests | Rouges au départ |
|---|---|---|---|
| `01-npm-audit` | `package.json` (par npm) | 4 | 1 |
| `02-injection-sql` | `app.js` | 7 | 3 |
| `03-validation` | `app.js` | 13 | 8 |
| `04-audit-ci` | `securite.yml` | aucun | pipeline |
