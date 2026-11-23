# Checklist de tests manuels sur iPhone

Ces vérifications ne peuvent pas être automatisées : elles dépendent du matériel du téléphone. Elles se déroulent dans Expo Go, sur un vrai iPhone, avant la fusion de toute Pull Request qui touche la caméra, les permissions, l'haptique ou le stockage.

Noter pour chaque passage : la date, le modèle d'iPhone et la version d'iOS.

## Démarrage

- [ ] `pnpm start`, puis scan du QR code : l'application s'ouvre dans Expo Go.
- [ ] Les composants HeroUI Native s'affichent correctement (texte, bouton, champ, carte).
- [ ] L'interface est entièrement en français.

## Persistance

- [ ] Au premier lancement, les achats de démonstration apparaissent.
- [ ] Un achat ajouté est toujours là après avoir fermé complètement puis rouvert l'application.
- [ ] Un achat modifié garde ses modifications après redémarrage.
- [ ] Un achat supprimé ne revient pas après redémarrage.
- [ ] Après avoir supprimé tous les achats, les achats de démonstration ne reviennent pas.

## Caméra et photo du ticket

- [ ] Le premier appui sur « Photographier le ticket » affiche la demande de permission.
- [ ] Permission acceptée : la caméra s'ouvre et la photo prise s'affiche dans le formulaire.
- [ ] Prise de vue annulée : le formulaire reste inchangé, sans message d'erreur.
- [ ] Permission refusée : un message explique comment l'autoriser dans les Réglages.
- [ ] La photo est toujours visible dans le détail après redémarrage de l'application.
- [ ] La suppression d'un achat supprime aussi sa photo.

## Retour haptique

- [ ] Une vibration courte confirme l'enregistrement d'un achat.
- [ ] Une vibration accompagne la suppression d'un achat.

Le retour haptique est désactivé par iOS en mode économie d'énergie : vérifier ce réglage avant de conclure à un défaut.

## Hors connexion

- [ ] Une fois l'application chargée, le mode avion n'empêche ni la consultation, ni l'ajout, ni la suppression.

## Erreurs

- [ ] Un formulaire incomplet affiche un message sous chaque champ en erreur.
- [ ] Une erreur de lecture ou d'écriture du stockage affiche un message compréhensible.
