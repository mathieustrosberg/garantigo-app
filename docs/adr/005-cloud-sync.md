# ADR-005 · Comment synchroniser les achats entre deux téléphones ?

**Statut :** acceptée
**Date :** 2026-11-25

## Contexte et contraintes

- Les achats et les photos restent aujourd'hui sur le téléphone (voir [ADR-003](003-local-persistence.md) et [ADR-004](004-receipt-photos.md)). Changer de téléphone fait tout perdre, et deux appareils ne voient jamais la même liste.
- L'application doit continuer à fonctionner sans connexion : c'est une exigence du projet. La synchronisation s'ajoute, elle ne remplace pas le stockage local.
- Les achats appartiennent à un compte : personne ne doit voir ceux d'un autre, même sur un téléphone partagé.
- La solution doit fonctionner dans Expo Go (voir [ADR-001](001-react-native-expo.md)), donc sans module natif supplémentaire.
- La CI ne doit demander aucun secret.
- Nous n'avons ni le temps ni le besoin d'écrire et d'héberger notre propre serveur.

## Décision et alternatives

Nous utilisons **Supabase**, avec la bibliothèque `@supabase/supabase-js` :

- **Comptes** : inscription et connexion par e-mail et mot de passe. La session est conservée dans AsyncStorage, déjà présent dans le projet.
- **Achats** : une table `purchases`, une ligne par achat et par compte. Des règles d'accès (_Row Level Security_) garantissent que chaque compte ne lit et n'écrit que ses propres lignes.
- **Photos** : un dossier privé `receipts`, avec un sous-dossier par compte.
- Le schéma complet est dans [`supabase/schema.sql`](../../supabase/schema.sql).

La synchronisation suit le principe **« le téléphone d'abord »** :

1. Chaque changement est d'abord enregistré sur le téléphone, exactement comme avant.
2. Il est ensuite envoyé en ligne. Sans réseau, il attend et repart à la prochaine synchronisation.
3. La synchronisation a lieu à la connexion, à l'ouverture de l'application, à son retour au premier plan et après chaque changement.
4. Le téléphone tient un **journal des changements** : la date de la dernière modification de chaque achat. Si le même achat a changé sur deux téléphones, **la modification la plus récente gagne**.
5. Un achat supprimé n'est pas effacé en ligne : il est marqué comme supprimé, pour que les autres téléphones le suppriment à leur tour. Le journal du téléphone garde lui aussi la trace des suppressions.
6. Un achat dont la date de modification est inconnue (un achat de démonstration, par exemple) est considéré comme le plus ancien : il ne peut jamais écraser un vrai changement.
7. Les photos des tickets suivent les achats : une photo prise sur un téléphone est envoyée en ligne, puis téléchargée par les autres. Quand plus aucun achat ne l'utilise, elle est supprimée en ligne.

Le compte est **obligatoire** : sans compte connecté, l'application n'affiche que l'accueil, avec la connexion et l'inscription. La session est conservée sur le téléphone : une fois connecté, on rouvre l'application sans réseau et sans rien ressaisir.

La copie du téléphone appartient à un seul compte. Si un autre compte se connecte sur le même téléphone, elle est vidée avant d'être remplie avec les achats de ce compte : rien ne passe d'un compte à l'autre, et rien n'est supprimé en ligne.

L'adresse du projet et sa clé publique sont lues dans le fichier `.env`. Cette clé est faite pour être publique : ce sont les règles d'accès de la base qui protègent les données. Si le fichier est absent, l'application ne demande pas de compte et fonctionne uniquement sur le téléphone : c'est le cas dans les tests.

Alternatives écartées :

- **Firebase (Firestore)** : équivalent pour les comptes et les données, mais son mode hors ligne sur mobile repose sur un module natif, absent d'Expo Go.
- **iCloud (CloudKit)** : pas de compte à créer, mais module natif, réservé aux appareils Apple.
- **Notre propre serveur** : trop long à écrire, à sécuriser et à héberger pour ce projet.
- **Un export et un import par fichier** : simple et sans serveur, mais c'est une sauvegarde manuelle, pas une synchronisation.
- **Une synchronisation en temps réel** : inutile pour une liste personnelle qu'une seule personne modifie à la fois.

## Conséquences et limites

- **+** Changer de téléphone ne fait plus rien perdre : il suffit de se connecter.
- **+** Le mode hors ligne est conservé une fois connecté : les changements faits sans réseau partent à la synchronisation suivante.
- **−** La première connexion demande du réseau, et l'application n'est plus utilisable sans compte.
- **+** Les écrans ne changent presque pas : ils passent toujours par l'interface `PurchaseStorage`.
- **+** Les tests simulent le service en ligne : la CI ne contacte aucun serveur et n'a besoin d'aucun secret.
- **+** Le modèle `Purchase` n'est pas modifié : les dates de modification sont rangées à part, sous la clé `garantigo.changes.v1`.
- **−** Si un autre compte se connecte sur le téléphone, les changements du compte précédent qui n'avaient pas encore été envoyés sont perdus.
- **−** Avec le service en ligne, il n'y a plus d'achats de démonstration : un nouveau compte commence vide. Ils ne servent plus que sans service en ligne, et dans les tests.
- **−** Les achats déjà présents sur un téléphone avant sa toute première connexion sont rattachés au premier compte qui s'y connecte, pour ne rien perdre.
- **−** Une photo n'apparaît sur un autre téléphone qu'après sa synchronisation : d'ici là, l'achat s'affiche avec le message « photo introuvable ».
- **−** Il n'y a pas de « mot de passe oublié » : il demanderait l'envoi d'e-mails et un lien qui rouvre l'application.
- **−** « La plus récente gagne » peut écraser une modification faite hors ligne sur un autre téléphone. C'est acceptable pour une liste personnelle.
- **−** La date de modification vient de l'horloge du téléphone : une horloge déréglée peut fausser l'arbitrage.
- **−** Un autre téléphone ne voit un changement qu'à sa prochaine synchronisation, pas à la seconde.
- **−** Les données sont hébergées par un tiers. La confirmation de l'adresse e-mail est désactivée pour la démonstration : elle serait à réactiver pour un vrai lancement.
- **−** L'offre gratuite de Supabase met un projet en pause après une période d'inactivité : à vérifier avant la démonstration.
