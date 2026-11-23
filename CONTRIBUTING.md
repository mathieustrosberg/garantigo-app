# Contribuer à GarantiGo

## Branches

- `main` est la seule branche permanente. Elle doit toujours se lancer.
- Chaque évolution part d'un `main` à jour, sur une branche courte : `feat/…`, `fix/…`, `test/…`, `docs/…` ou `chore/…`.

## Commits

Tous les commits suivent les [Conventional Commits](https://www.conventionalcommits.org/fr/) : `type(scope): description`.

- **type** : `feat`, `fix`, `test`, `docs`, `chore`, `refactor`, `style`, `ci`.
- **scope** (facultatif) : `purchases`, `warranty`, `storage`, `receipts`, `ui`, `ci`.
- **description** : en anglais, à l'impératif, sans majuscule au début ni point à la fin, 72 caractères au maximum.

```text
feat(purchases): add purchase list screen
fix(storage): keep receipt photo after app restart
test(warranty): cover 30-day threshold
docs: add adr for local persistence
```

Un commit correspond à un changement cohérent. Pas de `wip`, `update` ou `fix stuff`.

## Pull Requests

- Une Pull Request par évolution cohérente, la plus petite possible.
- Le titre suit le format des commits : il devient le message du commit lors du squash merge.
- La description suit le modèle proposé à l'ouverture de la Pull Request.

## Reviews

- Chaque Pull Request est relue par l'autre membre du binôme, sans attendre.
- Les remarques portent sur le comportement, la lisibilité et les tests.
- L'auteur répond à chaque remarque avant la fusion.

## Vérifications avant fusion

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
```

- [ ] Les quatre commandes passent en local.
- [ ] La CI est verte.
- [ ] La Pull Request est approuvée par l'autre membre du binôme.
- [ ] Si le changement touche la caméra, les permissions, l'haptique ou le stockage, la [checklist de tests manuels](docs/manual-test-checklist.md) a été déroulée sur iPhone.

La fusion se fait en squash merge.
