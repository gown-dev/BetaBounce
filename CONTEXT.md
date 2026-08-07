# BetaBounce

Jeu web : un donjon fantasy exploré case par case, où chaque déplacement se joue comme une partie de flipper.

Ce fichier est un glossaire, rien d'autre. Les décisions et leur justification vivent sur les tickets de la [carte wayfinder](https://github.com/gown-dev/BetaBounce/issues/1).

## Language

### Le donjon

**donjon** :
Le monde du jeu, propre à chaque joueur, découpé en secteurs et parcouru depuis un escalier central.

**secteur** :
Une région du donjon, ouverte par une quête.

**case** :
Une position du donjon. S'y déplacer exige de gagner une partie. La case décide des modules posés sur son plateau — c'est son identité et sa difficulté.
_Éviter_ : niveau, carte

**quête** :
La source unique de progression. Une quête accorde une bénédiction, un sceau, ou l'amélioration d'une arme.

### La partie

**partie** :
Une tentative de déplacement vers une case, jouée au flipper avec un nombre de balles fixé.

**plateau** :
Le rectangle de jeu, de taille fixe, percé d'emplacements prédéfinis.
_Éviter_ : table, niveau

**emplacement** :
Une position du plateau où un module peut se greffer.

**module** :
Une pièce de plateau, posée par la case sur un emplacement. Un module émet un effet temporaire quand on le sollicite.
_Éviter_ : élément, obstacle

**batteur** :
La palette qui renvoie la balle. Deux par plateau, de géométrie identique sur toutes les cases et pour tous les joueurs.
_Éviter_ : flipper (désigne aussi la machine), raquette, palette

**balle** :
Le projectile. Porteuse des sceaux du joueur.
_Éviter_ : bille

**barrière** :
L'exigence portée par un module : nécrotique, de ténèbres. Un module barricadé n'encaisse aucun dégât tant que la balle ne porte pas le sceau correspondant.
_Éviter_ : protection, défense

### Le joueur

Trois porteurs, distingués par ce sur quoi l'effet agit. Ce qui existe encore sans plateau va au héros ; ce qui a besoin du plateau va à l'arme ; ce qui décide si une cible encaisse va à la balle. Tout est permanent : rien ne se perd, rien ne se retire.

**héros** :
Le personnage persistant que le joueur incarne. Jamais visible pendant la partie. Propriétaire de tout.

**bénédiction** :
Un effet permanent du héros sur le cadre de la partie — balles supplémentaires, relance d'urgence. Indépendant de l'arme équipée.
_Éviter_ : talent, don, bonus, amélioration

**arme** :
L'objet équipé qui produit les effets de plateau. Une seule équipée à la fois, choisie avant la partie. Entièrement décrite par son identité et sa qualité.
_Éviter_ : équipement, objet

**qualité** :
Le rang atteint par une arme : commune, inhabituelle, rare, épique. Un scalaire, pas une collection — une arme améliorée deux fois est de qualité rare.
_Éviter_ : niveau, rang, palier

**améliorer** :
Faire monter une arme d'un cran de qualité. Débloqué par quête.

**inactive** :
L'état d'une amélioration temporairement suspendue par une quête. Un état, jamais une perte.

**sceau** :
La capacité permanente de la balle à endommager un module malgré sa barrière. Un sceau franchit la barrière de même nom. Global, indépendant de l'arme équipée.
_Éviter_ : clé, capacité, pouvoir

### L'architecture

**shared** :
Le paquet qui porte le cœur de simulation. Ne connaît ni Phaser ni le DOM, et tourne à l'identique dans le navigateur et sous Node.

**rejeu** :
La ré-exécution serveur d'une partie à partir des entrées transmises par le client, pour valider le score annoncé.
_Éviter_ : replay, validation
