# BetaBounce

Jeu web : un donjon fantasy exploré case par case, où chaque déplacement se joue comme une partie de flipper.

Ce fichier est un glossaire, rien d'autre. Les décisions et leur justification vivent sur les tickets de la [carte wayfinder](https://github.com/gown-dev/BetaBounce/issues/1).

## Language

### Le donjon

**donjon** :
Le monde du jeu : une carte unique, découpée en secteurs et parcourue depuis un escalier central.
La carte est **commune à tous les joueurs** — mêmes cases, mêmes quêtes ancrées, mêmes marchands. Ce qui est propre à chaque joueur, c'est sa **progression** dessus.

**secteur** :
Un bloc de cases voisines sur la carte unique du donjon, avec son thème et sa difficulté propres.
Un secteur n'est jamais fermé : on peut s'y rendre à tout moment. Il est seulement ingrat tant que le héros ne porte pas les **sceaux** qu'exigent ses **barrières** — on y joue, on y marque très peu. Ce qu'on appelle « ouvrir un secteur » est donc la conséquence d'un sceau gagné, jamais une récompense en soi.

**case** :
Une position du donjon. S'y déplacer exige de gagner une partie. La case choisit un plan et le garnit de modules — c'est son identité et sa difficulté.
_Éviter_ : niveau, carte

**quête** :
La source unique de progression. Une quête accorde une bénédiction, un sceau, l'amélioration d'une arme, ou une exploration de plus par jour.
Une quête est un **service** : elle est ancrée sur une case, révélée en l'explorant, et reste consultable sur place — on y revient pour en revoir l'objectif. Une case n'en porte qu'une, et ne se recharge pas.
Elle ne s'accepte pas et ne se dépense pas : elle observe ce que fait le héros et avance seule. Toutes les quêtes trouvées courent donc en parallèle, sans arbitrage entre elles.
Ce qui l'incarne — un héraut, un autel, une statue gravée — est un habillage. Le modèle ne connaît que la quête.
Une quête est faite d'une ou plusieurs **étapes**, sans limite de nombre. Elle verse une **récompense**, et une seule.

**étape** :
Une condition à franchir dans une quête. Les étapes se choisissent dans une grammaire **fermée** : se rendre sur une case, conquérir une case, obtenir un nombre donné d'**objets de quête**, atteindre un palier donné sur une case. Une quête est donc une donnée, pas du code. La liste s'allonge par décision, jamais par dérive.
Les étapes se franchissent dans l'ordre écrit, une à la fois. Une étape ne compte que ce qui arrive pendant qu'elle est **en cours** : elle lit des événements, jamais l'état acquis avant elle. C'est ce qui fait de la quête le dispositif qui dirige le joueur dans un donjon sans limites.
Une étape désigne toujours la case où elle se franchit, et la carte la marque. Le joueur n'a jamais à chercher où aller.

**objet de quête** :
Un objet que le héros transporte pour franchir une étape, et qui n'a aucun effet. Il ne s'obtient **que** pendant l'étape qui le réclame : hors d'elle, il n'existe pas et ne tombe jamais. Obtenu en explorant, parfois au hasard, et comptable. Il se dépense, se détruit et se perd — la permanence ne le concerne pas.
_Éviter_ : relique, consommable, butin

**service** :
Ce qu'une case révèle en plus de son plateau, une fois explorée : un marchand, un portail, une quête. Une seule par case, pour que la carte reste lisible. On en use gratuitement et autant qu'on veut, tant que le héros se tient sur la case.

**marchand** :
Un service qui vend contre de la monnaie : des consommables, et les identités d'armes qui lui sont propres. Se découvre en explorant sa case.
_Éviter_ : boutique, vendeur, échoppe

### La partie

**exploration** :
Une tentative de déplacement vers une case. Le héros en dispose d'un nombre limité par jour. Deux réserves distinctes : le **quota du jour**, qui se remet à son plein chaque jour et dont le reliquat expire, et les **explorations bonus** achetées, qui s'accumulent sans limite. Elle se consomme qu'elle réussisse ou non, et même sur une case déjà validée — auquel cas seuls les paliers encore non versés peuvent rapporter.
_Éviter_ : tentative, déplacement, essai

**partie** :
La partie de flipper qui résout une exploration, jouée avec un nombre de balles fixé. Une exploration, une partie — jamais deux.
Une partie persiste, et traverse deux états. **En cours** : ouverte par le serveur, elle attend son enregistrement. **Close** : l'enregistrement est déposé et rejoué, le score est acquis. Elle garde ensuite son enregistrement, et le témoignage d'une éventuelle divergence.

**palier** :
Un score à atteindre, propre à une case. Une case en porte cinq, croissants. Franchir un palier verse sa récompense — une seule fois dans la vie de la case, jamais deux. Les paliers restants se gagnent en y revenant, au prix d'une exploration.
_Éviter_ : seuil, niveau, cap

**conquête** :
Le franchissement du palier qui vaut victoire — un palier intermédiaire, pas le dernier. Il valide le déplacement vers la case. La partie continue au-delà, pour les paliers suivants.

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

**indulgence** :
L'écart entre le batteur dessiné et le batteur qui touche. La balle est frappée alors qu'elle passe un peu à côté de ce que le joueur voit. Deux marges distinctes : au ras du batteur, et après la pointe. Bornée — l'écart réel entre les deux batteurs laisse toujours passer une balle.
_Éviter_ : coyote, tolérance, assistance

**balle** :
Le projectile. Porteuse des sceaux du joueur.
_Éviter_ : bille

**barrière** :
L'exigence portée par un récepteur : nécrotique, de ténèbres. Un récepteur barricadé n'encaisse aucune sollicitation tant que la balle ne porte pas le sceau correspondant. Réservée aux récepteurs sollicités par impact.
_Éviter_ : protection, défense

### Le joueur

Trois porteurs, distingués par ce sur quoi l'effet agit. Ce qui existe encore sans plateau va au héros ; ce qui a besoin du plateau va à l'arme ; ce qui décide si une cible encaisse va à la balle.

**récompense** :
Ce qu'une quête verse : une bénédiction, un sceau, un cran de qualité d'arme, une exploration de plus par jour. Une récompense est permanente : une fois gagnée, elle est acquise pour toujours. Elle ne se perd pas et ne se dépense pas. Une quête peut seulement la rendre **inactive** le temps qu'elle dure — l'acquis, lui, demeure. C'est la permanence qui la définit, et elle ne s'étend à rien d'autre : l'**objet de quête** et le **consommable** se dépensent, la **monnaie** aussi.
Les récompenses forment un catalogue **fermé**, écrit d'avance et identique pour tous les joueurs. Le joueur connaît donc dès le départ ce qui lui reste à obtenir.

**héros** :
Le personnage persistant que le joueur incarne. Jamais visible pendant la partie. Propriétaire de tout.

**journal** :
Le registre de ce qui est arrivé au héros : la suite ordonnée et datée de ses **événements**. Il fait foi — tout ce que le héros possède y a sa cause. Ce qu'il affiche par ailleurs (sa monnaie, ses explorations restantes, son inventaire) n'en est que le résumé.

**événement** :
Un fait inscrit au journal, daté et causé, qui ne se réécrit jamais. Monnaie versée par un palier, monnaie dépensée chez un marchand, récompense acquise, objet de quête ramassé, exploration débitée.
Un événement concerne toujours le **héros**, jamais le plateau : ce qui se produit pendant une partie a ses propres mots — **sollicitation**, **activation**, **effet**.
Une **étape** de quête ne lit que les événements survenus pendant qu'elle est en cours.
_Éviter_ : écriture, mouvement, opération, versement

**bénédiction** :
Un effet permanent du héros sur le cadre de la partie — balles supplémentaires, relance d'urgence. Indépendant de l'arme équipée.
_Éviter_ : talent, don, bonus, amélioration

**arme** :
L'objet équipé qui produit les effets de plateau. Une seule équipée à la fois, choisie avant la partie. Entièrement décrite par son identité et sa qualité. L'identité s'achète chez le marchand qui la vend ; la qualité ne monte que par quête.
_Éviter_ : équipement, objet

**qualité** :
Le rang atteint par une arme : commune, inhabituelle, rare, épique. Un scalaire, pas une collection — une arme améliorée deux fois est de qualité rare.
_Éviter_ : niveau, rang, palier

**améliorer** :
Faire monter une arme d'un cran de qualité. Débloqué par quête.

**inactive** :
L'état d'une **récompense** suspendue par une quête. Toute récompense peut l'être, sceaux compris. Elle reste acquise et cesse seulement de produire son effet, jusqu'à ce que la quête s'achève — après quoi elle revient intacte. Un état, jamais une perte.
La suspension est elle-même un ressort de quête : un gobelin dérobe le bâton du héros, la quête est la poursuite, et rattraper le voleur rend le bâton. Elle ne coûte aucune entrée du catalogue, puisque rien de neuf n'est versé.

**sceau** :
La capacité permanente de la balle à solliciter un récepteur malgré sa barrière. Un sceau franchit la barrière de même nom. Global, indépendant de l'arme équipée.
_Éviter_ : clé, capacité, pouvoir

**monnaie** :
Ce que versent les paliers, et la seule chose qu'ils versent. Ne s'achète pas, ne se perd pas, ne se retire pas. Ne se dépense que chez un marchand.

**consommable** :
Un effet à usage unique porté par le héros, acheté chez un marchand et gardé en réserve. Frère de la bénédiction — même porteur, mais il se dépense au lieu de valoir toujours. Agit sur le cadre de la partie ou sur le donjon, jamais sur le plateau : il achète du temps, jamais de la puissance.
_Éviter_ : objet, potion, item

### L'architecture

**shared** :
Le paquet qui porte le cœur de simulation. Ne connaît ni Phaser ni le DOM, et tourne à l'identique dans le navigateur et sous Node.
Il contient exactement ce que le rejeu exécute, et rien d'autre — même ce dont les deux côtés se servent reste dehors s'il n'est pas nécessaire au rejeu.

**server** :
Le paquet qui porte le domaine persistant : donjon, cases, quêtes, économie, marchands, comptes. Seul possédant du plateau, qu'il résout et transmet. C'est lui qui rejoue.

**client** :
Le paquet qui porte la SPA et le rendu. Ne construit jamais un plateau : il en reçoit un et l'exécute dans **shared**.

**contracts** :
Le paquet des types d'échange entre **server** et **client** qui ne concernent pas le rejeu. Déclarations pures, sans dépendance et sans code exécutable. Il existe pour que rien n'entre dans **shared** au seul motif d'être partagé.

**partie en cours** :
L'état d'une **partie** que le serveur a ouverte en débitant l'exploration, et qui n'a pas encore été rejouée : la case, l'arme équipée, l'heure d'ouverture. Elle n'accepte qu'un enregistrement, une seule fois.
Le plateau n'y est pas conservé : sans aléa, il se re-résout à l'identique depuis la case.
Fermer la page ne l'annule pas — l'exploration est déjà dépensée.

**enregistrement** :
Ce que le client dépose à la fin d'une partie : la case visitée, l'arme équipée, les entrées horodatées du joueur, la version du moteur physique, et le score prédit. Il suffit à rejouer la partie à l'identique. Conservé après le rejeu.
_Éviter_ : replay, trace, log

**score prédit** :
Le score que le client calcule pendant la partie. Sans autorité, et branché sur rien : le rejeu ne le lit pas, il le compare. Il sert à l'affichage, et de témoin — un écart avec le score du rejeu ne rapporte rien au joueur, il signale que le déterminisme a cassé, ou qu'un client a menti sans y gagner.

**rejeu** :
La ré-exécution serveur d'une partie à partir de son enregistrement. Le score qu'il produit fait foi. Seule porte d'entrée de valeur dans le compte d'un joueur, avec les quêtes.
_Éviter_ : replay, validation
