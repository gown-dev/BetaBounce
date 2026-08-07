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
Une position du donjon. S'y déplacer exige de gagner une partie. La case choisit un plan et le garnit de modules — c'est son identité et sa difficulté.
_Éviter_ : niveau, carte

**quête** :
La source unique de progression. Une quête accorde une bénédiction, un sceau, ou l'amélioration d'une arme.

### La partie

**partie** :
Une tentative de déplacement vers une case, jouée au flipper avec un nombre de balles fixé.

**plan** :
Un dessin de plateau réutilisable : une grille de tuiles, un contour, des emplacements. Les plans forment une bibliothèque qui s'étoffe ; une case en choisit un, puis le garnit.

**tuile** :
Une cellule de la grille d'un plan, portant un fragment de géométrie pris dans un jeu fini.

**socle** :
La zone basse, identique sur tous les plans et tracée hors grille : batteurs, drain, couloirs de sortie, lanceur.
_Éviter_ : coquille

**plateau** :
Le terrain de jeu effectif d'une partie : un plan garni par une case, posé sur le socle.
_Éviter_ : table, niveau

**emplacement** :
Un rectangle de cellules qu'un plan réserve pour accueillir un module. Un module y tient ou n'y tient pas ; rien d'autre ne conditionne la pose. Les emplacements par où la balle entre et sort portent en plus un rôle, car la géométrie ne le dit pas.

**module** :
Une pièce de plateau, posée par la case sur un emplacement. Figé : son empreinte, ses récepteurs, sa condition d'activation et son effet appartiennent à son identité. Les variantes sont des modules distincts.
_Éviter_ : élément, obstacle

**récepteur** :
Une partie sollicitable d'un module. Un récepteur se sollicite par impact — la balle rebondit — ou par passage — elle traverse.
_Éviter_ : organe, interface

**résistance** :
Le nombre de sollicitations qu'un récepteur encaisse avant de devenir inerte. Un bumper a une résistance infinie, un bouton une résistance de un.

**inerte** :
L'état d'un récepteur dont la résistance est épuisée. Levé au réarmement.

**activation** :
La condition, portant sur l'état des récepteurs d'un module, qui fait émettre son effet et réarme tous ses récepteurs d'un coup.

**effet** :
Une modification d'ampleur et de durée fixées, portant sur l'une des quatre grandeurs d'une partie : le score, la physique de la balle, le cadre de la partie, l'état du plateau. Un effet est déclaré, jamais calculé. Il vient de l'activation d'un module, ou de l'arme équipée — auquel cas il dure toute la partie.

**batteur** :
La palette qui renvoie la balle. Deux par plateau, de géométrie identique sur toutes les cases et pour tous les joueurs.
_Éviter_ : flipper (désigne aussi la machine), raquette, palette

**balle** :
Le projectile. Porteuse des sceaux du joueur.
_Éviter_ : bille

**barrière** :
L'exigence portée par un récepteur : nécrotique, de ténèbres. Un récepteur barricadé n'encaisse aucune sollicitation tant que la balle ne porte pas le sceau correspondant. Réservée aux récepteurs sollicités par impact.
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
La capacité permanente de la balle à solliciter un récepteur malgré sa barrière. Un sceau franchit la barrière de même nom. Global, indépendant de l'arme équipée.
_Éviter_ : clé, capacité, pouvoir

### L'architecture

**shared** :
Le paquet qui porte le cœur de simulation. Ne connaît ni Phaser ni le DOM, et tourne à l'identique dans le navigateur et sous Node.

**rejeu** :
La ré-exécution serveur d'une partie à partir des entrées transmises par le client, pour valider le score annoncé.
_Éviter_ : replay, validation
