# PROTOTYPE — la sensation du flipper

Code **jetable**, écrit pour le ticket
[#7 — Prototype : la sensation du flipper](https://github.com/gown-dev/BetaBounce/issues/7).
Rien ici n'est destiné à être promu tel quel.

```
npm install
npm run dev      # puis ouvrir l'URL affichée
npm run verif    # contrôle à blanc sous Node : les trois socles se montent-ils ?
```

## Ce qu'il répond

- La gravité, la restitution et la vitesse de la balle donnent-elles une sensation juste ?
- Où placer les batteurs, et de quelle longueur ?
- **Combien de temps dure une partie à trois balles ?** C'est le chiffre qui décide du
  rythme du jeu entier : un déplacement sur la carte du donjon coûte cette durée-là.

## Ce qu'il ne répond pas

Le socle est **nu** — aucun module, aucun score. Le troisième point du ticket, « le seuil
de score se lit-il comme un objectif ou comme une corvée », reste donc ouvert : il demande
un plateau garni.

Et la durée mesurée ici est un **plancher**. Sur un plateau garni, les modules retiennent
la balle ; une partie réelle durera plus longtemps que ce que ce socle nu affiche.

## Les trois socles

Commutables par la barre du bas, par `?variant=A|B|C`, ou par les touches `1` `2` `3`.
Ils diffèrent par leur structure, pas seulement par leurs nombres.

| | |
|---|---|
| **A — Classique** | couloirs de sortie et slingshots, pente de machine standard (6,5°) |
| **B — Goulet** | ni couloir ni slingshot, murs qui plongent sur les batteurs, batteurs courts et écartés, pente forte (9°) |
| **C — Entonnoir** | couloirs étroits, poteau central dans le drain, batteurs longs, pente douce (4,5°) |

Les quatorze curseurs modifient le socle **en cours de balle** : le monde est rebâti à
chaque cran, la balle gardant sa position et sa vitesse.

## Ce qui est simulé et ce qui ne l'est pas

Le moteur est `@dimforge/rapier2d-deterministic-compat` — le build retenu en
[#2](https://github.com/gown-dev/BetaBounce/issues/2), variante `-compat` (même moteur,
wasm en base64, aucune configuration Vite). Pas de Phaser :
[#3](https://github.com/gown-dev/BetaBounce/issues/3) a établi qu'il ne fait que du rendu,
il n'a donc rien à dire sur la sensation.

Une seule chose est scriptée plutôt que simulée : le **haut du couloir de lancement**.
À 6,5° d'inclinaison la gravité utile ne vaut que 1,1 m/s² ; toute vitesse horizontale
résiduelle fait dériver la balle sur toute la largeur du plateau avant qu'elle ne
redescende, et elle finit collée à un mur. Une glissière filaire dépose donc la balle
au-dessus du batteur gauche, presque immobile — c'est ce que fait un vrai retour de bille.
La montée dans le couloir, elle, reste physique.

**Un constat en soi** : cette dérive n'est pas un défaut du prototype, c'est une propriété
du plateau. Sur un plateau garni, ce sont les modules qui interrompent les trajectoires.
Un plateau trop vide donnera toujours des balles qui longent les murs.
