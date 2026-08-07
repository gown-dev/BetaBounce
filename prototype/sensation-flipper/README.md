# PROTOTYPE — la sensation du flipper

Code **jetable**, écrit pour le ticket
[#7 — Prototype : la sensation du flipper](https://github.com/gown-dev/BetaBounce/issues/7).
Rien ici n'est destiné à être promu tel quel.

```
npm install
npm run dev      # puis ouvrir l'URL affichée
npm run verif    # contrôle à blanc sous Node : les trois socles se montent-ils ?
```

## Proportions du plateau

**60 × 92 cm**, contre 52 × 116 cm sur une vraie machine. Le plateau réel est trop haut
pour tenir sur un écran 1080p à côté du panneau de réglages. Ce n'est pas qu'un choix
d'affichage : la balle tombe de moins haut et dispose de plus de largeur, donc la
sensation change avec. Le canvas se taille ensuite sur la fenêtre, hauteur d'abord.

## Ce qu'il répond

- La gravité, la restitution et la vitesse de la balle donnent-elles une sensation juste ?
- Où placer les batteurs, et de quelle longueur ?
- **De combien le batteur physique doit-il déborder du batteur dessiné** pour que la
  frappe soit agréable sans devenir une farce ?
- **Combien de temps dure une partie à trois balles ?** C'est le chiffre qui décide du
  rythme du jeu entier : un déplacement sur la carte du donjon coûte cette durée-là.

## L'indulgence

Le batteur **physique** est plus gros que le batteur **dessiné** — deux marges réglables,
tracées en pointillé autour de chaque batteur :

- **au ras du batteur** (épaisseur) : rattrape la balle qui frôle sans toucher ;
- **après la pointe** (longueur) : rattrape le raté classique, la balle passée d'un cheveu
  au bout du batteur.

Une borne dure : la marge de longueur est rabotée pour que l'écart réel entre les deux
batteurs laisse toujours passer une balle. Le joueur peut tricher, pas gagner — sinon le
drain se referme et la partie ne peut plus finir.

## Ce qu'il ne répond pas

Aucun score. Le troisième point du ticket, « le seuil de score se lit-il comme un objectif
ou comme une corvée », reste donc ouvert.

Les trois bumpers ne sont **pas** un plateau garni : ce sont trois cercles rebondissants
pour que la balle ait quelque chose à toucher. Rien à voir avec les **modules** du domaine
(empreinte, récepteurs, résistance, activation, effet).

## Les trois socles

Commutables par la barre du bas, par `?variant=A|B|C`, ou par les touches `1` `2` `3`.
Ils diffèrent par leur structure, pas seulement par leurs nombres.

| | |
|---|---|
| **A — Classique** | couloirs de sortie et slingshots, pente de machine standard (6,5°) |
| **B — Goulet** | ni couloir ni slingshot, murs qui plongent sur les batteurs, batteurs courts et écartés, pente forte (9°) |
| **C — Entonnoir** | couloirs étroits, poteau central dans le drain, batteurs longs, pente douce (4,5°) |

Les curseurs et les cases à cocher modifient le socle **en cours de balle** : le monde est
rebâti à chaque cran, la balle gardant sa position et sa vitesse. Les bumpers, les
slingshots et le poteau central se retirent d'une case — le socle nu reste donc à un clic.

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

Le couloir de lancement est par ailleurs un **cul-de-sac scellé** : son séparateur monte
jusqu'à la voûte. Sans ça, une balle bien frappée y retombe et la partie ne finit jamais.

**Un constat en soi** : cette dérive n'est pas un défaut du prototype, c'est une propriété
du plateau. Sur un plateau garni, ce sont les modules qui interrompent les trajectoires.
Un plateau trop vide donnera toujours des balles qui longent les murs — c'est ce que le
premier essai, socle nu, a montré en une partie.
