# ADR-003 · Quelle persistance locale ?

**Statut :** acceptée
**Date :** 2026-11-23

## Contexte et contraintes

- Les achats doivent être conservés après la fermeture et le redémarrage de l'application.
- Il n'y a ni serveur ni compte utilisateur : tout reste sur le téléphone.
- Le volume est faible : quelques dizaines d'achats, avec peu de champs chacun.
- La solution doit fonctionner dans Expo Go (voir [ADR-001](001-react-native-expo.md)) et être simple à tester.
- Les achats de démonstration ne doivent apparaître qu'au premier lancement, sans jamais écraser les données de l'utilisateur.

## Décision et alternatives

Nous utilisons **AsyncStorage** (`@react-native-async-storage/async-storage`). La liste complète des achats est enregistrée en JSON sous une seule clé, `garantigo.purchases.v1`.

Les écrans ne connaissent pas AsyncStorage : ils passent par l'interface `PurchaseStorage` (lire, ajouter, modifier, supprimer). Une version en mémoire de cette interface sert aux tests.

Alternatives écartées :

- **SQLite** (`expo-sqlite`) : adapté aux gros volumes et aux requêtes, mais demande un schéma et du SQL pour un besoin qui n'en a pas.
- **Un fichier JSON écrit avec `expo-file-system`** : équivalent, mais sans simulation de test officielle.
- **MMKV** : plus rapide, mais c'est un module natif absent d'Expo Go.

## Conséquences et limites

- **+** Très peu de code : une lecture, une écriture, et la liste est manipulée comme un tableau.
- **+** Changer de solution plus tard ne touche qu'un fichier, grâce à l'interface `PurchaseStorage`.
- **+** Les tests utilisent la simulation officielle d'AsyncStorage et vérifient la persistance « après redémarrage ».
- **+** La clé absente (premier lancement) est distinguée de la liste vide (tout a été supprimé) : les achats de démonstration ne reviennent pas.
- **−** Chaque modification réécrit toute la liste : acceptable pour quelques dizaines d'achats, pas pour des milliers.
- **−** Les données ne sont ni chiffrées ni synchronisées : désinstaller l'application les supprime.
- **−** Les photos des tickets ne sont pas stockées ici : elles sont des fichiers, et l'achat n'en garde que le nom.
- **−** Les erreurs de lecture et d'écriture sont signalées par une `StorageError`, que l'interface doit expliquer à l'utilisateur.
