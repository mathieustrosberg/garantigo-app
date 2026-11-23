# ADR-002 · Pourquoi HeroUI Native ?

**Statut :** acceptée
**Date :** 2026-11-23

## Contexte et contraintes

- L'application compte quatre écrans, avec des formulaires, des listes, des cartes et des badges de statut.
- L'équipe débute en React Native et dispose de quatre jours : écrire et styliser chaque composant à la main prendrait trop de temps.
- L'interface doit rester cohérente d'un écran à l'autre.
- Les composants doivent fonctionner dans Expo Go (voir [ADR-001](001-react-native-expo.md)).

## Décision et alternatives

Nous utilisons **HeroUI Native 1.1** pour les composants d'interface, avec **Uniwind** pour les styles. Uniwind est requis par HeroUI Native : il permet d'écrire des classes Tailwind CSS dans React Native.

Alternatives écartées :

- **Composants React Native stylisés à la main** (`StyleSheet`) : aucune dépendance, mais beaucoup de code de style et un risque d'incohérence entre les écrans.
- **React Native Paper** : bibliothèque mûre, mais son apparence Material Design est éloignée de nos maquettes.
- **HeroUI pour le web** : ne fonctionne pas dans React Native.

Nous n'utilisons que les composants gratuits de HeroUI Native.

## Conséquences et limites

- **+** Des composants accessibles et cohérents : boutons, champs, cartes, badges, recherche.
- **+** Des tailles par défaut adaptées au tactile.
- **+** Les classes Tailwind sont familières à des développeurs web.
- **−** Les composants de date, de champ numérique, d'état vide et de bouton flottant sont payants : nous utilisons à la place le sélecteur de date natif et de petits composants maison.
- **−** `BottomSheet` repose sur un module natif absent d'Expo Go : nous ne l'utilisons pas.
- **−** La configuration est plus lourde : Metro, un fichier CSS global, un provider à la racine et une configuration Jest spécifique.
- **−** L'installation de pnpm est à plat (`nodeLinker: hoisted`), car la configuration Jest des animations ne fonctionne pas avec l'installation isolée.
