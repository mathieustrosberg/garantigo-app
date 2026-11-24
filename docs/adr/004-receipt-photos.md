# ADR-004 · Où conserver les photos des tickets ?

**Statut :** acceptée
**Date :** 2026-11-24

## Contexte et contraintes

- Chaque achat peut avoir une photo de son ticket de caisse, prise avec la caméra du téléphone.
- La photo doit rester disponible après la fermeture et le redémarrage de l'application, sans connexion.
- La caméra range la photo dans un cache temporaire, que le système peut vider à tout moment.
- Les achats sont enregistrés en JSON dans AsyncStorage (voir [ADR-003](003-local-persistence.md)) : une image y prendrait beaucoup de place.
- La solution doit fonctionner dans Expo Go (voir [ADR-001](001-react-native-expo.md)).
- La suppression d'un achat doit aussi supprimer sa photo.

## Décision et alternatives

- **Prise de vue** : `expo-image-picker`, avec `launchCameraAsync` uniquement. L'import depuis la photothèque n'est pas proposé.
- **Conservation** : `expo-file-system` (API `File`, `Directory`, `Paths`). Juste après la prise, la photo est copiée du cache vers le dossier permanent `receipts/`, dans `Paths.document`.
- **Lien avec l'achat** : l'achat enregistre seulement le nom du fichier (`receiptFileName`), jamais un chemin absolu. L'adresse complète est recalculée à l'affichage.
- **Suppression** : `PurchaseStorage.remove` enregistre d'abord la liste sans l'achat, puis efface la photo. Si l'enregistrement échoue, l'achat et sa photo restent tous les deux.
- **Erreurs** : `takeReceiptPhoto` ne lève jamais d'erreur. Elle renvoie un statut (`taken`, `cancelled`, `permissionDenied`, `failed`) que l'écran traduit en message.

Alternatives écartées :

- **Garder l'adresse du cache de la caméra** : aucune copie, mais la photo peut disparaître quand le système vide le cache.
- **Enregistrer l'image en base64 dans AsyncStorage** : un seul stockage, mais chaque modification réécrirait toutes les images, et la liste deviendrait très lourde.
- **Enregistrer la photo dans la photothèque du téléphone** (`expo-media-library`) : visible hors de l'application, mais demande une permission de plus et mélange les tickets aux photos personnelles.
- **Enregistrer le chemin absolu** : plus direct, mais le chemin du dossier de l'application peut changer, par exemple après une mise à jour.

## Conséquences et limites

- **+** Les photos survivent au redémarrage et ne dépendent pas du cache.
- **+** La liste des achats reste légère : elle ne contient qu'un nom de fichier par achat.
- **+** La logique de la caméra et des fichiers est isolée dans `src/native/receipt-photos.ts` et testée avec une fausse caméra et de faux fichiers.
- **−** Une photo remplacée (« Reprendre »), retirée (« Retirer ») ou prise dans un formulaire abandonné reste dans `receipts/` sans être utilisée.
- **−** Si le fichier disparaît malgré tout, le détail affiche « La photo du ticket est introuvable sur ce téléphone. » au lieu de l'image.
- **−** Dans Expo Go, la demande d'accès à la caméra est celle d'Expo Go. Le texte en français prévu dans `app.json` ne s'applique qu'à un development build.
- **−** La caméra ne peut pas être testée dans le simulateur iOS : ce parcours se vérifie sur iPhone, avec la [checklist de tests manuels](../manual-test-checklist.md).
