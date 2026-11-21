# 04 : l'audit de sécurité dans la CI

Les exercices 01 et 02 ont montré deux contrôles : `npm audit` pour les
dépendances, la relecture du code pour l'injection. Faits à la main, on
les oublie. On les confie à la CI, qui les lance à chaque push et à
chaque pull request, et qui bloque si elle trouve quelque chose.

`securite.yml` est un workflow GitHub Actions de départ : il installe
les dépendances (`npm ci`) et lance les tests (`npm test`), rien de
plus.

## Ce que vous devez faire

Complétez `securite.yml`, et seulement ce fichier, pour qu'il :

- lance `npm audit --audit-level=high` : le pipeline échoue dès
  qu'une dépendance a une faille de gravité high ou critical ;
- lance une analyse Semgrep avec les règles JavaScript
  (`semgrep scan --config p/javascript`), dans un conteneur
  `semgrep/semgrep`, et fait échouer le pipeline si Semgrep trouve
  quelque chose ;
- garde les tests.

Semgrep est un outil d'analyse statique : il lit le code sans le
lancer et cherche des motifs dangereux connus. Lisez `semgrep scan
--help` pour trouver l'option qui change le code de sortie.

## L'essayer sur votre projet

1. À la racine de votre projet (là où sont `package.json` et
   `package-lock.json`), créez le dossier `.github/workflows/`.
2. Copiez-y `securite.yml`.
3. Commitez et poussez. L'onglet « Actions » du dépôt GitHub montre
   le pipeline et le détail de chaque étape.

```bash
mkdir -p .github/workflows
cp chemin/vers/04-audit-ci/securite.yml .github/workflows/
git add .github/workflows/securite.yml
git commit -m "CI : audit des dépendances et analyse Semgrep"
git push
```

## Au départ

Pas de test Jest. Le pipeline de départ passe, mais il ne contrôle
rien côté sécurité. Pour vérifier votre version :

- poussez un projet qui contient le `lodash` 4.17.20 de l'exercice 01 :
  l'étape `npm audit` doit échouer ;
- regardez ce que l'étape Semgrep trouve sur l'API de cette session.
  Une trouvaille ne veut pas dire que le workflow est faux : lisez ce
  qu'elle signale et corrigez le problème plutôt que d'ignorer le scan.
