# GarantiGo

Application mobile qui centralise les achats, conserve les tickets de caisse pris en photo et suit les dates de fin de garantie.

Projet réalisé en binôme dans le cadre du Master 2 Lead Developer Front End.

## Fonctionnalités

Le périmètre prévu compte quatre écrans. Cette liste est mise à jour à chaque fonctionnalité fusionnée.

- [ ] **Mes achats** : liste, recherche par nom, tri, statut de garantie.
- [ ] **Ajouter / modifier** : formulaire validé, photo du ticket prise avec la caméra.
- [ ] **Détail** : informations de l'achat, date de fin de garantie, jours restants, suppression.
- [ ] **Mes garanties** : achats regroupés par statut.

L'application fonctionne sans compte et sans serveur : les données restent sur le téléphone.

## Stack

| Outil                            | Rôle                                      |
| -------------------------------- | ----------------------------------------- |
| React Native 0.88, Expo SDK 58   | Socle de l'application                    |
| TypeScript (mode strict)         | Typage                                    |
| Expo Router                      | Navigation par fichiers (`src/app`)       |
| HeroUI Native, Uniwind           | Composants d'interface et styles Tailwind |
| AsyncStorage                     | Persistance locale des achats             |
| Jest, jest-expo, Testing Library | Tests                                     |
| ESLint, Prettier                 | Qualité et formatage du code              |
| GitHub Actions                   | Intégration continue                      |

Les choix techniques sont justifiés dans [`docs/adr`](docs/adr).

## Prérequis

- Node 22 (la version est fixée dans `.nvmrc`).
- pnpm 10 (la version est fixée dans `package.json`, champ `packageManager`).
- Un iPhone sous iOS 16.4 ou plus, avec l'application **Expo Go** installée depuis l'App Store.
- Un compte Expo, connecté à la fois dans le terminal et dans Expo Go.

## Installation

```bash
git clone https://github.com/mathieustrosberg/garantigo-app.git garantigo
cd garantigo
pnpm install
```

## Démarrage

```bash
pnpm exec expo login   # une seule fois
pnpm start
```

Scanner ensuite le QR code affiché dans le terminal avec l'appareil photo de l'iPhone. Le téléphone et l'ordinateur doivent être sur le même réseau Wi-Fi. Si le réseau bloque la connexion, utiliser `pnpm start --tunnel`.

## Commandes

| Commande            | Effet                                 |
| ------------------- | ------------------------------------- |
| `pnpm start`        | Lance le serveur de développement     |
| `pnpm typecheck`    | Vérifie le typage TypeScript          |
| `pnpm lint`         | Analyse le code avec ESLint           |
| `pnpm format`       | Formate le code avec Prettier         |
| `pnpm format:check` | Vérifie le formatage sans rien écrire |
| `pnpm test`         | Exécute les tests                     |

## Organisation

```text
src/app/        routes et écrans (Expo Router)
src/components/ composants partagés entre les écrans
src/purchases/  modèle et logique métier des achats
src/storage/    accès au stockage et liste partagée entre les écrans
src/native/     accès aux fonctions natives du téléphone (retour haptique)
src/data/       achats de démonstration
docs/adr/       décisions d'architecture
docs/           checklist de tests manuels sur iPhone
.github/        intégration continue et modèle de Pull Request
```

## Intégration continue

À chaque Pull Request vers `main`, GitHub Actions installe les dépendances avec `pnpm install --frozen-lockfile`, puis exécute le typage, le lint, la vérification du formatage et les tests. Aucun secret ni build native n'est nécessaire.

La caméra, les permissions, le retour haptique et la persistance des photos se vérifient à la main sur iPhone, avec la [checklist de tests manuels](docs/manual-test-checklist.md).

## Limites connues

- L'application se lance dans Expo Go : elle a besoin du serveur de développement pour démarrer. Une fois chargée, elle fonctionne sans connexion.
- Les composants qui s'appuient sur une feuille native (`BottomSheet`) ne sont pas disponibles dans Expo Go et ne sont pas utilisés.

## Contribuer

Les règles de branches, de commits et de Pull Requests sont décrites dans [`CONTRIBUTING.md`](CONTRIBUTING.md).
