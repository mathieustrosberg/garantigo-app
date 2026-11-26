# Checklist de tests manuels sur iPhone

Ces vérifications ne peuvent pas être automatisées : elles dépendent du matériel du téléphone. Elles se déroulent dans Expo Go, sur un vrai iPhone, avant la fusion de toute Pull Request qui touche la caméra, les permissions, l'haptique, le stockage, le compte ou la synchronisation.

Noter pour chaque passage : la date, le modèle d'iPhone et la version d'iOS.

| Date | Testé par | iPhone | iOS | Résultat |
| ---- | --------- | ------ | --- | -------- |
|      |           |        |     |          |

## Démarrage

- [ ] `pnpm start`, puis scan du QR code : l'application s'ouvre dans Expo Go.
- [ ] Les composants HeroUI Native s'affichent correctement (texte, bouton, champ, carte).
- [ ] L'interface est entièrement en français.
- [ ] L'application suit le thème clair ou sombre du téléphone.
- [ ] La barre d'onglets est masquée sur le détail et sur le formulaire.

## Compte

- [ ] Sans compte connecté, l'application affiche l'accueil : aucun achat n'est visible.
- [ ] « Créer un compte » : deux mots de passe différents affichent une erreur sous le champ de confirmation.
- [ ] Un compte créé arrive sur Mes achats, sans aucun achat.
- [ ] « J'ai déjà un compte » : un mauvais mot de passe affiche « E-mail ou mot de passe incorrect. ».
- [ ] Après avoir fermé complètement puis rouvert l'application, on est toujours connecté.
- [ ] Mes achats : le bouton en haut à droite ouvre l'écran Compte, qui affiche l'adresse du compte.
- [ ] « Se déconnecter » demande une confirmation, puis ramène à l'accueil.
- [ ] En mode avion, une tentative de connexion affiche « Pas de connexion. Vérifiez le réseau, puis réessayez. ».

## Parcours

- [ ] Mes achats : la recherche par nom filtre la liste ; « Aucun résultat » s'affiche quand rien ne correspond.
- [ ] Mes achats : le tri par date d'achat et par fin de garantie change l'ordre de la liste.
- [ ] Détail : la date de fin, les jours restants et le statut sont affichés ; « Non renseigné » si le prix manque.
- [ ] Formulaire : « Annuler » ferme le formulaire sans rien enregistrer.
- [ ] Le bouton « Ajouter » de la barre d'onglets ouvre le formulaire depuis les deux onglets.
- [ ] Mes garanties : la prochaine échéance est en tête, et un appui dessus ouvre le détail de l'achat.
- [ ] Mes garanties : les garanties actives et expirées se déplient et se replient d'un appui.

## Persistance

- [ ] Un achat ajouté est toujours là après avoir fermé complètement puis rouvert l'application.
- [ ] Un achat modifié garde ses modifications après redémarrage.
- [ ] Un achat supprimé ne revient pas après redémarrage.
- [ ] Après avoir supprimé tous les achats, la liste reste vide.

## Caméra et photo du ticket

- [ ] Le premier appui sur « Photographier le ticket » affiche la demande de permission.
- [ ] Permission acceptée : la caméra s'ouvre et la photo prise s'affiche dans le formulaire.
- [ ] « Reprendre » remplace la photo par une nouvelle ; « Retirer » l'enlève du formulaire.
- [ ] Prise de vue annulée : le formulaire reste inchangé, sans message d'erreur.
- [ ] Permission refusée : un message explique comment l'autoriser dans les Réglages, et « Ouvrir les Réglages » ouvre les réglages d'Expo Go.
- [ ] La photo est toujours visible dans le détail après redémarrage de l'application.
- [ ] La suppression d'un achat supprime aussi sa photo.

## Suppression

- [ ] « Supprimer » affiche une confirmation ; elle mentionne la photo seulement si l'achat en a une.
- [ ] « Annuler » dans la confirmation garde l'achat.
- [ ] Après la suppression, le retour à la liste se fait sans afficher « Cet achat est introuvable. ».

## Retour haptique

- [ ] Une vibration courte confirme l'enregistrement d'un achat.
- [ ] Une vibration accompagne la suppression d'un achat.

Le retour haptique est désactivé par iOS en mode économie d'énergie : vérifier ce réglage avant de conclure à un défaut.

## Synchronisation entre deux iPhone

À faire avec deux iPhone connectés au même compte.

- [ ] Un achat ajouté sur le premier apparaît sur le second, après être revenu dans l'application.
- [ ] Une modification faite sur le second apparaît sur le premier.
- [ ] Un achat supprimé sur l'un disparaît de l'autre, et ne revient pas.
- [ ] Un achat ajouté avec une photo arrive sur l'autre téléphone avec sa photo.
- [ ] Écran Compte : « Vos achats sont synchronisés. » s'affiche, et « Synchroniser maintenant » relance la synchronisation.
- [ ] Un achat ajouté en mode avion reste sur le téléphone, puis part vers l'autre une fois le réseau revenu.
- [ ] Après une déconnexion puis une reconnexion au même compte, tous les achats sont là.
- [ ] Un second compte connecté sur le même téléphone ne voit aucun achat du premier, pas même un instant à la connexion.

## Hors connexion

- [ ] Une fois l'application chargée et connectée, le mode avion n'empêche ni la consultation, ni l'ajout, ni la suppression.
- [ ] En mode avion, « Synchroniser maintenant » affiche que la synchronisation est impossible pour le moment.

## Erreurs

- [ ] Un formulaire incomplet affiche un message sous chaque champ en erreur.
- [ ] Une erreur de lecture ou d'écriture du stockage affiche un message compréhensible.
