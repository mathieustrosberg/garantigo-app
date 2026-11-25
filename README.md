# GarantiGo

Application mobile qui centralise les achats, conserve les tickets de caisse pris en photo et suit les dates de fin de garantie.

Projet réalisé en binôme dans le cadre du Master 2 Lead Developer Front End.

## Fonctionnalités

L'application compte quatre écrans, reliés par une barre d'onglets (Mes achats, Mes garanties) qui porte aussi le bouton d'ajout. Le détail et le formulaire s'ouvrent par-dessus.

- **Mes achats** : liste des achats avec leur statut de garantie, recherche par nom, tri par date d'achat ou par date de fin de garantie, bouton « Ajouter un achat ». Un état vide distingue « aucun achat » et « aucun résultat ».
- **Ajouter / modifier** : nom, date d'achat (sélecteur natif) et durée de garantie en mois sont obligatoires ; prix, catégorie et photo du ticket sont facultatifs. Un message d'erreur s'affiche sous chaque champ invalide. La photo est prise avec la caméra uniquement, avec un aperçu, « Reprendre » et « Retirer ».
- **Détail** : statut, date de fin de garantie, jours restants (toujours affichés), informations de l'achat, photo du ticket, modification, suppression confirmée.
- **Mes garanties** : achats regroupés par statut (active, expire bientôt, expirée), avec un état vide.

Règles de garantie :

- fin de garantie = date d'achat + durée en mois ; si le jour n'existe pas dans le mois d'arrivée, on prend le dernier jour de ce mois ;
- **active** : plus de 30 jours restants ; **expire bientôt** : de 0 à 30 jours, bornes incluses ; **expirée** : date de fin dépassée.

Un retour haptique confirme l'enregistrement et la suppression d'un achat.

L'application fonctionne sans compte et sans serveur : les données restent sur le téléphone. Au tout premier lancement, cinq achats de démonstration sont enregistrés ; ils ne reviennent jamais une fois supprimés.

## Stack

| Outil                                  | Rôle                                      |
| -------------------------------------- | ----------------------------------------- |
| React Native 0.88, Expo SDK 58         | Socle de l'application                    |
| TypeScript (mode strict)               | Typage                                    |
| Expo Router                            | Navigation par fichiers (`src/app`)       |
| HeroUI Native, Uniwind                 | Composants d'interface et styles Tailwind |
| AsyncStorage                           | Persistance locale des achats             |
| expo-image-picker                      | Photo du ticket prise avec la caméra      |
| expo-file-system                       | Conservation des photos sur le téléphone  |
| expo-haptics                           | Retour haptique                           |
| @react-native-community/datetimepicker | Sélecteur de date natif                   |
| Jest, jest-expo, Testing Library       | Tests                                     |
| ESLint, Prettier                       | Qualité et formatage du code              |
| GitHub Actions                         | Intégration continue                      |

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

Une classe Tailwind utilisée pour la première fois n'est pas prise en compte par un serveur déjà lancé, même après un rechargement avec `r`. Dans ce cas, arrêter le serveur (`Ctrl+C`) et le relancer en vidant le cache :

```bash
pnpm start -c
```

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
src/native/     accès aux fonctions natives du téléphone (caméra, photos, retour haptique)
src/__tests__/  tests des écrans (ils ne peuvent pas être placés dans src/app)
src/data/       achats de démonstration
docs/adr/       décisions d'architecture
docs/           checklist de tests manuels sur iPhone
.github/        intégration continue et modèle de Pull Request
```

## Données

- **Achats** : enregistrés en JSON sous une seule clé AsyncStorage (`garantigo.purchases.v1`). Les écrans passent par l'interface `PurchaseStorage` et ne connaissent pas AsyncStorage ([ADR-003](docs/adr/003-local-persistence.md)).
- **Photos des tickets** : copiées dans le dossier permanent `receipts/` de l'application. L'achat ne garde que le nom du fichier, et la suppression d'un achat supprime sa photo ([ADR-004](docs/adr/004-receipt-photos.md)).
- **Dates** : les dates d'achat sont stockées sans heure (`AAAA-MM-JJ`) et les calculs se font en UTC, pour ne jamais changer de jour selon le fuseau horaire.

## Tests

Les tests automatiques (Jest, Testing Library) couvrent en priorité :

- le calcul des dates de fin (fins de mois, années bissextiles), les jours restants et le seuil exact des 30 jours ;
- la validation du formulaire ;
- l'ajout, la modification, la suppression et la persistance « après redémarrage » ;
- la recherche et le tri ;
- la prise de photo (permission refusée, prise annulée, copie impossible) et la suppression de la photo ;
- les erreurs de lecture et d'écriture du stockage.

Les tests utilisent une date de référence fixe : ils ne dépendent jamais du jour où ils sont lancés.

## Intégration continue

À chaque Pull Request vers `main`, GitHub Actions installe les dépendances avec `pnpm install --frozen-lockfile`, puis exécute le typage, le lint, la vérification du formatage et les tests. Aucun secret ni build native n'est nécessaire.

La caméra, les permissions, le retour haptique et la persistance des photos se vérifient à la main sur iPhone, avec la [checklist de tests manuels](docs/manual-test-checklist.md).

## Limites connues

- L'application se lance dans Expo Go : elle a besoin du serveur de développement pour démarrer. Une fois chargée, elle fonctionne sans connexion.
- Dans Expo Go, la demande d'accès à la caméra est celle d'Expo Go, avec son propre texte. Le texte en français prévu dans `app.json` ne s'appliquerait que dans une application compilée (development build).
- Après un refus de la caméra, « Ouvrir les Réglages » mène aux réglages d'Expo Go, pas à ceux de GarantiGo.
- Une photo remplacée avec « Reprendre », retirée avec « Retirer », ou prise puis abandonnée avec « Annuler » reste dans le dossier `receipts/` sans être utilisée. Seule la photo d'un achat supprimé est effacée.
- Chaque modification réécrit toute la liste des achats : adapté à quelques dizaines d'achats, pas à des milliers.
- Les données ne sont ni chiffrées ni sauvegardées ailleurs : désinstaller Expo Go ou l'application les supprime.
- La durée de garantie est saisie par l'utilisateur : l'application ne détermine pas la garantie légale.
- Les composants qui s'appuient sur une feuille native (`BottomSheet`) ne sont pas disponibles dans Expo Go et ne sont pas utilisés.

## Pistes d'évolution

Hors du périmètre du projet, mais envisageables :

- un development build, pour une application installée de façon autonome, avec sa propre demande de permission ;
- le nettoyage des photos inutilisées dans `receipts/` ;
- des rappels avant la fin d'une garantie (notifications locales) ;
- une sauvegarde ou une synchronisation des données ;
- la lecture automatique des informations du ticket (OCR).

## Contribuer

Les règles de branches, de commits et de Pull Requests sont décrites dans [`CONTRIBUTING.md`](CONTRIBUTING.md).
