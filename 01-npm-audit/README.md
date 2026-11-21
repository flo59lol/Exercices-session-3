# 01 : une dépendance vulnérable (npm audit)

L'API utilise `lodash` pour trier les tâches (`GET /tasks`) et pour
fabriquer un résumé en texte avec un gabarit (`GET /tasks/resume`).

Le `package.json` fixe `lodash` à la version 4.17.20, sortie en 2020.
Le code de l'application est correct, mais il embarque des failles
connues et publiées. L'OWASP Top 10 2025 range ce risque dans
« Software Supply Chain Failures » (« Vulnerable and Outdated
Components » dans l'édition 2021). Personne ne lit le code de ses
dépendances : on fait vérifier leurs versions par un outil.

Cet exercice a son propre `package.json` : travaillez dans ce dossier.

```bash
cd 01-npm-audit
npm install
```

## Ce que vous devez faire

1. Lancez `npm audit` et lisez le rapport. Pour chaque paquet signalé,
   relevez : sa gravité (low, moderate, high, critical), les failles
   (chaque lien `GHSA-...` mène à la fiche, avec son numéro CVE), la
   version qui corrige, et si le paquet est utilisé par l'application
   ou seulement par les outils de développement.
2. Lancez `npm audit --omit=dev` : que reste-t-il ?
3. Mettez `lodash` à jour vers une version corrigée, avec npm et non à
   la main dans `package.json`.
4. Relancez `npm audit` et les tests.

Vous ne modifiez pas `app.js` : la mise à jour ne doit rien casser, et
les tests fonctionnels le vérifient.

Attention : le rapport propose `npm audit fix --force`. Lisez ce qu'il
ferait pour chaque paquet avant de le lancer.

## Au départ : 1 test rouge sur 4

- `lodash installé est en 4.18.0 ou plus récent`

Le test lit la version réellement installée dans `node_modules`, pas
celle écrite dans `package.json`. Les 3 tests fonctionnels passent déjà
et doivent rester verts.

```bash
npx jest
```
