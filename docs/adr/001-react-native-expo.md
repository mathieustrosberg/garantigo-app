# ADR-001 · Pourquoi React Native et Expo ?

**Statut :** acceptée
**Date :** 2026-11-23

## Contexte et contraintes

- GarantiGo est une application mobile qui doit accéder à la caméra, au retour haptique et au stockage local du téléphone.
- L'équipe compte deux développeurs web, débutants en développement mobile.
- Le projet dure quatre jours et se termine par une démonstration sur iPhone.
- Le cours impose React Native, Expo et TypeScript.
- Xcode n'est pas installé : compiler nous-mêmes l'application pour iPhone demanderait une préparation que le délai ne permet pas.

## Décision et alternatives

Nous utilisons **React Native avec Expo SDK 58 et TypeScript**, et nous lançons l'application dans **Expo Go**.

Alternatives écartées :

- **Natif (Swift)** : meilleure intégration, mais un langage et des outils à apprendre en quatre jours.
- **Flutter** : multiplateforme, mais demande d'apprendre Dart.
- **PWA** : simple à déployer, mais l'accès à la caméra et au retour haptique est limité sur iPhone.
- **Development build** (application compilée par nos soins) : demande Xcode pour une compilation locale, ou un compte Apple Developer payant avec EAS Build.

Expo SDK 58 est la seule version acceptée par l'application Expo Go de l'App Store au moment du projet.

## Conséquences et limites

- **+** Une seule base de code TypeScript, proche de ce que l'équipe connaît déjà avec React.
- **+** Aucun outil natif à installer : un téléphone, Expo Go et un QR code suffisent.
- **+** La caméra, l'haptique et le stockage sont fournis par des modules Expo inclus dans Expo Go.
- **−** Seuls les modules natifs inclus dans Expo Go sont utilisables. Un module absent imposerait de passer à un development build.
- **−** L'application a besoin du serveur de développement pour démarrer : ce n'est pas une application installée de façon autonome.
- **−** La demande de permission de la caméra est celle d'Expo Go, pas celle de GarantiGo : son texte ne peut pas être personnalisé. Le texte en français prévu dans `app.json` ne s'applique qu'à un development build.
