# Inventaire des mécaniques de flipper réelles

Note de recherche — issue [gown-dev/BetaBounce#17](https://github.com/gown-dev/BetaBounce/issues/17).
Date : 2026-08-07. Modèle confronté : la résolution de
[#5](https://github.com/gown-dev/BetaBounce/issues/5) — plan, tuiles, emplacements, module,
récepteur, résistance, activation, effet, barrière, socle.

## 0. Méthode et fiabilité des sources

Trois familles de sources primaires ont été retenues.

1. **Les documentations de fabrication de flippers** — [Pinball Makers](https://pinballmakers.com/wiki/index.php?title=Basics)
   et sa page [Construction](https://pinballmakers.com/wiki/index.php?title=Construction).
   Ce sont des descriptions de pièces réelles : ce qui bouge, ce qui détecte, ce qui pousse.
2. **Le Mission Pinball Framework** ([missionpinball.org](https://missionpinball.org/latest/)),
   le cadriciel qui pilote des machines physiques. Sa
   [référence de configuration](https://missionpinball.org/latest/config/) est la source la
   plus utile de l'inventaire : c'est déjà une modélisation logicielle de mécaniques
   matérielles, donc directement confrontable au modèle de #5. Quand une notion y a un nom
   de réglage, la mécanique a une réalité vérifiable.
3. **Le règlement de compétition PAPA/IFPA**
   ([ifpapinball.com/rules](https://www.ifpapinball.com/rules/)), pour ce qui touche au
   cadre d'une partie : tilt, tilt violent (slam tilt), sanctions.

**Limite assumée.** Les fiches de règles officielles des fabricants (Stern, Jersey Jack)
sont publiées en PDF d'images, non extractibles. Les tentatives sur
[Godzilla](https://www.sternpinball.com/wp-content/uploads/2022/06/Godzilla-Rulesheet.pdf),
[Rush](https://www.sternpinball.com/wp-content/uploads/2022/09/Rush-Rulesheet.pdf),
[Metallica Remastered](https://sternpinball.com/wp-content/uploads/2025/04/Metallica-Remastered-Rulesheet.pdf)
et [Ghostbusters](https://sternpinball.com/wp-content/uploads/2018/10/GB-Basic-guide.pdf)
ont toutes échoué. Conséquence : les mécaniques de **couche règle** — jackpot,
super-jackpot, mode, wizard mode, skill shot — reposent ici sur le vocabulaire du
Mission Pinball Framework, qui les nomme et les implémente, et non sur une fiche de
fabricant. Cette partie de l'inventaire est donc moins bien étayée que la partie matérielle.
Les faits matériels, eux, sont solides.

---

## 1. Inventaire des mécaniques réelles

### 1.1 Les mécaniques qui rendent l'énergie

**Bumper actif (pop bumper).**
Une pièce ronde qui détecte la balle par un jupon plastique sous son corps. Le contact ferme
un interrupteur, une bobine tire, un anneau descend et **chasse la balle** dans la direction
opposée ([Pinball Makers, Basics](https://pinballmakers.com/wiki/index.php?title=Basics)).
Le point central : le bumper actif ne se contente pas de renvoyer, il **ajoute** de la
vitesse. Le cadriciel le classe parmi les
[bobines à déclenchement automatique](https://missionpinball.org/latest/config/autofire_coils/) :
l'interrupteur commande la bobine sans passer par la logique de jeu, parce que la latence
doit être nulle.
*Rythme* : c'est l'accélérateur. Un nid de bumpers avale la balle plusieurs secondes, marque
en continu, et la recrache sans que le joueur décide de rien. C'est le temps mort actif d'une
partie.

**Bumper passif.**
La forme d'origine, héritée des machines à bingo : la balle touche, un contact se ferme, ça
marque — et rien ne pousse. Le bumper actif est venu après. Les bumpers « champignon »
(mushroom bumpers) des machines Bally de la fin des années 1970 en sont la survivance, et
sont encore vendus comme pièces détachées
([Marco Specialties](https://www.marcospecialties.com/pinball-parts/PFLD-BUMP)).
*Rythme* : purement géométrique. Il dévie et marque, il ne relance pas.

**Catapulte latérale (slingshot).**
Un ou deux interrupteurs de contact sans capot, plus une bobine. Quand la balle heurte le
caoutchouc tendu, la bobine tire et **projette la balle dans une seule direction**
([Pinball Makers, Construction](https://pinballmakers.com/wiki/index.php?title=Construction)).
Placée au-dessus de chaque batteur, en biais.
*Rythme* : elle rend la balle vive et imprévisible juste au moment où le joueur croyait la
contrôler. C'est le générateur d'aléa du bas du plateau.

**Relance de couloir (kickback).**
Une bobine dans un couloir de sortie qui **renvoie la balle en jeu** au lieu de la laisser
partir au drain. Le cadriciel la décrit avec une bobine, un interrupteur, et des réglages de
péremption : `timeout_max_hits`, `timeout_watch_time`, `timeout_disable_time`
([kickbacks](https://missionpinball.org/latest/config/kickbacks/)) — donc une ressource
limitée, pas un mur.
*Rythme* : c'est un sursis. Elle change la valeur du risque, pas la géométrie.

### 1.2 Les cibles

**Cible fixe (standup target).**
Un interrupteur monté au-dessus du plateau, actionné par la balle qui le heurte
([Pinball Makers, Basics](https://pinballmakers.com/wiki/index.php?title=Basics)). La balle
rebondit, la cible ne bouge pas, elle est frappable indéfiniment.
*Rythme* : le point d'appui. Elle rapporte peu mais toujours.

**Cible tombante (drop target).**
Une cible plate tenue sur un ressaut. Frappée, elle recule et **s'enfonce sous le plateau**,
ce qui la rend infrappable — et laisse le passage libre
([Pinball Makers, Construction](https://pinballmakers.com/wiki/index.php?title=Construction)).
Le cadriciel lui donne un interrupteur obligatoire, une bobine de relevage (`reset_coil`) et
parfois une bobine d'abattage (`knockdown_coil`) qui permet au logiciel de la coucher
lui-même ([drop_targets](https://missionpinball.org/latest/config/drop_targets/)).

**Banque de cibles tombantes (drop target bank).**
Un groupe de cibles suivi collectivement. Le cadriciel émet trois événements — toutes
couchées, toutes debout, état mixte — et porte un réglage `reset_on_complete` : **la banque
se relève d'elle-même quand elle est complète**
([drop_target_banks](https://missionpinball.org/latest/config/drop_target_banks/)).
*Rythme* : c'est la mécanique de progression la plus lisible du flipper. Trois coups, un
palier, tout se relève, on recommence pour plus cher. #5 a repris cette règle telle quelle
sous le nom d'**activation qui réarme**. C'est la mécanique qui rentre le mieux dans le modèle.

### 1.3 Les mécaniques de passage

**Rampe et orbite (ramp, orbit, loop).**
Le cadriciel les traite ensemble et donne le fait qui compte : une rampe, une boucle ou une
orbite contient **deux interrupteurs — un à l'entrée, un pour signaler la réussite**
([Loops / Orbits / Ramps](https://missionpinball.org/latest/mechs/loops/)). La distinction
entre les deux est de trajet : la rampe monte et rend la balle à un couloir de retour ;
l'orbite contourne le plateau et ressort de l'autre côté.
*Rythme* : c'est le souffle. Une rampe réussie, c'est une seconde et demie sans danger, un
son, et la balle qui revient proprement sur un batteur. C'est ce qui donne le sentiment de
maîtrise. Une orbite, c'est la même chose avec un renversement de côté.

**Franchissement (rollover).**
Un interrupteur sous la surface, déclenché par la balle qui **roule dessus**
([Pinball Makers, Basics](https://pinballmakers.com/wiki/index.php?title=Basics)). La balle
ne rebondit pas. C'est le récepteur à passage nu.

**Couloirs de retour et couloirs de sortie (inlanes, outlanes).**
La disposition standard du bas de plateau est : deux batteurs, deux couloirs de sortie, deux
couloirs de retour, deux catapultes latérales
([Pinball Makers, Construction](https://pinballmakers.com/wiki/index.php?title=Construction)).
Les couloirs de retour ramènent la balle sur le batteur ; les couloirs de sortie mènent au
drain.
*Rythme* : la largeur des couloirs de sortie est le premier réglage de difficulté d'une
machine réelle. Un couloir large, c'est une partie courte.

**Tourniquet (spinner).**
La balle frappe une ailette plate montée sur axe, la traverse, et **l'ailette tourne sur
place en fermant un interrupteur à chaque tour**
([Pinball Makers, Basics](https://pinballmakers.com/wiki/index.php?title=Basics)). Le
cadriciel émet un événement par tour (`spinner_(nom)_hit`), plus des états actif / inactif /
au repos avec `active_ms` et `idle_ms`
([spinners](https://missionpinball.org/latest/config/spinners/)).
*Rythme* : c'est le seul récepteur dont **un seul franchissement rapporte un nombre variable
de points**, proportionnel à la vitesse de la balle. Il récompense la force du coup, pas sa
précision.

### 1.4 Les mécaniques qui prennent la balle

**Trou et éjecteur (scoop, saucer hole, VUK).**
Le cadriciel les décrit précisément : un trou (scoop) **capture la balle et la rejette** après
un court instant ; un trou de soucoupe (saucer hole) fait pareil mais la balle **reste
visible**, et sert parfois de verrou ; un éjecteur vertical (VUK) capture depuis le plateau
et **rejette vers une rampe ou un plateau supérieur**
([Scoops / VUKs / Saucer holes](https://missionpinball.org/latest/mechs/)).
*Rythme* : c'est la ponctuation. La balle s'arrête, quelque chose se passe à l'écran, puis
elle repart d'un endroit **choisi**. C'est le seul moment où la machine reprend la main.

**Aimant (magnet).**
Une bobine sous le plateau. Le cadriciel lui donne trois actions distinctes : **saisir**
(`grab_ball_events`), **relâcher** (`release_ball_events`) et **projeter**
(`fling_ball_events`, qui pulse l'aimant pour catapulter la balle), avec des durées de
maintien et de reprise ([magnets](https://missionpinball.org/latest/config/magnets/)).
*Rythme* : c'est de la triche assumée par la machine. Elle vole la balle, la tient, la rend
où elle veut.

**Verrou de multiballe (ball lock).**
Un dispositif qui retient des balles jusqu'au déclenchement de la multiballe. Le cadriciel
distingue le **verrou physique** — la balle est vraiment retenue — du **verrou virtuel**, où
seul un compteur logiciel suit les balles verrouillées, avec un réglage `min_virtual_physical`
pour mélanger les deux ([multiball_locks](https://missionpinball.org/latest/config/multiball_locks/)).

### 1.5 Les mécaniques qui changent la géométrie

**Aiguillage (diverter).**
Une pièce mobile actionnée par bobine qui **redirige le trajet de la balle**. Le cadriciel la
décrit par ses deux destinations : `targets_when_active` et `targets_when_inactive`, plus un
type qui dit si elle tient sa position ou revient au repos
([diverters](https://missionpinball.org/latest/config/diverters/)).
*Rythme* : elle rend une même entrée ambivalente. Le même coup ne mène pas au même endroit
selon l'état du jeu.

**Porte à sens unique (gate).**
De la géométrie pure, sans bobine ni interrupteur : un volet qui laisse passer dans un sens
et bloque dans l'autre. Elle ne marque rien.

### 1.6 Les mécaniques de couche règle

Ces mécaniques ne sont pas des pièces. Ce sont des règles posées par-dessus les pièces. Elles
sont documentées comme telles dans la
[logique de jeu](https://missionpinball.org/latest/game_logic/) du cadriciel.

**Coup allumé et groupe de coups (shot, shot group).**
Un « coup » est un objectif visable du plateau, qui a un **état** et qui **avance** à chaque
réussite. Les coups se regroupent, et le groupe apporte deux mécaniques réelles : la
**rotation** (le coup allumé se déplace) et le **changement de voie** (lane change : le joueur
décale les voies allumées en actionnant un batteur). Il existe aussi des **coups en séquence**,
à réussir dans un ordre imposé
([shots](https://missionpinball.org/latest/game_logic/shots/)).

**Conditions d'ouverture (logic blocks).**
Le cadriciel nomme quatre formes de conditions : le **compteur**, l'**accumulation**, la
**séquence** et la **machine à états**
([logic_blocks](https://missionpinball.org/latest/game_logic/logic_blocks/)). C'est la
grammaire réelle des règles de flipper. Le modèle de #5 n'en couvre qu'une, l'accumulation.

**Multiballe (multiball).**
Plusieurs balles en jeu simultanément. Le cadriciel la paramètre par `ball_count` et
`ball_count_type` — soit un total de balles en jeu, soit un nombre de balles à ajouter, ce qui
couvre la multiballe classique et la variante « une balle de plus » — plus un `shoot_again`
qui redonne un essai si le joueur perd tout, et un `grace_period` avant le démarrage réel
([multiballs](https://missionpinball.org/latest/config/multiballs/)).
*Rythme* : c'est le sommet de la partie. Tout est plus dense, plus bruyant, et le risque de
tout perdre est concentré sur quelques secondes.

**Jackpot et super-jackpot.**
Un jackpot est un coup dont la **valeur croît** pendant la multiballe et se collecte à un
endroit désigné ; le super-jackpot vaut un multiple du jackpot et demande une condition
supplémentaire. *Étayage faible* : les fiches de règles des fabricants n'ont pas pu être lues
(voir §0). Le fait retenu ici, et qui est celui qui compte pour le modèle, est celui de la
**valeur variable**.

**Mode.**
Une phase chronométrée de la partie pendant laquelle la valeur et le sens des coups changent
globalement. Le cadriciel en fait une brique de premier ordre : un mode est un jeu de règles
activable, et la logique de jeu s'écrit presque entièrement en modes
([game_logic](https://missionpinball.org/latest/game_logic/)). Le **wizard mode** est le mode
terminal, ouvert par l'accomplissement de tous les autres.
*Rythme* : c'est ce qui empêche une partie d'être une suite de coups équivalents. Un mode
donne une intention à trois minutes de jeu.

**Sauvegarde de balle (ball save).**
Une fenêtre de quelques secondes après le lancement pendant laquelle une balle perdue est
rendue. Réglée par `active_time`, `grace_period`, `hurry_up_time` et `balls_to_save`
([ball_saves](https://missionpinball.org/latest/game_logic/ball_saves/)).

**Coup de lancement (skill shot).**
Un bonus attribué au tout début d'une balle, obtenu en dosant le lanceur ou en réussissant un
coup précis avant que le jeu ne s'installe. *Étayage faible*, même raison que le jackpot.

**Tilt.**
La sanction anti-secousse. Le cadriciel la modélise avec trois familles d'interrupteurs —
avertissement, tilt, tilt violent (slam tilt) — un nombre d'avertissements avant sanction
(`warnings_to_tilt`) et un délai de stabilisation (`settle_time`) ; au tilt, la balle se
termine et le score cesse ([tilt](https://missionpinball.org/latest/config/tilt/)). En
compétition, le tilt violent donne un score de zéro, et le tilt délibéré destiné à en tirer
avantage aussi ([règlement PAPA/IFPA](https://www.ifpapinball.com/rules/)).
*Rythme* : c'est ce qui rend illégitime la solution physique brutale.

---

## 2. Traduction dans le modèle de #5

Empreintes données à titre indicatif, en cellules, sous réserve de la maille — qui dépend du
diamètre de la balle et reste bloquée par #7.

| Mécanique réelle | Récepteurs | Mode | Résistance | Activation | Effet (grandeur) | Empreinte |
|---|---|---|---|---|---|---|
| Bumper passif | 1 | impact | ∞ | aucune | — (marque seulement) | 1×1 |
| Bumper actif (pop bumper) | 1 | impact | ∞ | aucune | **non exprimable** — voir §3.1 | 1×1 |
| Serviteur | 1 | impact | 3 | récepteur inerte | score, ampleur faible | 1×1 |
| Boss | 1 | impact | 12 | récepteur inerte | score ×N, durée moyenne | 3×3 |
| Cible fixe (standup) | 1 | impact | ∞ | aucune | — | 1×1 |
| Cible tombante isolée | 1 | impact | 1 | récepteur inerte | état du plateau | 1×1 |
| Banque de trois cibles tombantes | 3 | impact | 1 chacun | les trois inertes | état du plateau ou score | 3×1 |
| Triple bouton | 3 | impact | 1 chacun | les trois inertes | état du plateau | 3×1 |
| Trois voies de franchissement (rollover lanes) | 3 | passage | 1 chacun | les trois inertes | cadre de la partie | 3×1 |
| Tourniquet (spinner) | 1 | passage | ∞ | aucune | — (mais voir §3.7) | 1×1 |
| Rampe | 2 (entrée, réussite) | passage | ∞ | les deux sollicités **dans l'ordre** | score | 1×3 ou 1×4 |
| Orbite | 2 (deux extrémités) | passage | ∞ | idem | score | portée par le plan |
| Catapulte latérale (slingshot) | 1 | impact | ∞ | aucune | **non exprimable** — §3.1 | 2×1 |
| Relance de couloir (kickback) | 1 | passage | 1 | récepteur inerte | cadre de la partie | socle |
| Trou / soucoupe (scoop, saucer) | 1 | **capture — absent** | 1 | récepteur inerte | au choix | 2×2 |
| Aimant | — | **absent** | — | — | **non exprimable** — §3.2 | 2×2 |
| Aiguillage (diverter) | 1 | passage | ∞ | sollicitation | état du plateau | 2×2 |
| Porte à sens unique | 0 | — | — | — | — | tuile, pas module |
| Multiballe | verrou : 1 | passage | 3 | verrou plein | **non exprimable** — §3.3 | 2×2 |
| Jackpot | 1 | impact ou passage | ∞ | armé par ailleurs | score, **ampleur variable** — §3.7 | 1×1 |
| Mode | — | — | — | **inter-modules** — §3.6 | score + état du plateau | — |
| Coup de lancement (skill shot) | 1 | passage | 1 | **historique de la partie** — §3.5 | score | socle |
| Sauvegarde de balle | — | — | — | début de balle | cadre de la partie | — |
| Tilt | — | — | — | **pas d'entrée joueur** — §3.9 | cadre de la partie | — |

Trois lignes seulement passent sans réserve : la banque de cibles tombantes, le triple bouton,
et l'archétype boss + serviteurs. Ce n'est pas un mauvais résultat — ce sont les mécaniques de
progression, et #5 les a visées juste. Mais l'essentiel du **mouvement** d'un flipper réel est
ailleurs.

---

## 3. Ce que le modèle ne sait pas exprimer

C'est la section que le ticket demande en priorité. Chaque écart est nommé, chiffré en coût,
et assorti d'une piste — sans traduction forcée.

### 3.1 Aucun module ne peut pousser la balle

**Le fait.** Le bumper actif et la catapulte latérale ne renvoient pas la balle : ils lui
**ajoutent de l'énergie**, à un instant, dans une direction. C'est la différence historique
entre bumper passif et bumper actif. C'est aussi ce qui fait qu'un flipper est vif.

**Ce qui manque.** Le modèle a bien une grandeur `physique de la balle`, mais c'est un effet
*temporaire et global* — « rebonds plus vifs pendant 8 s ». Il n'a rien pour une **impulsion
ponctuelle, dirigée, appliquée au point de contact**. Le récepteur à impact ne déclare que sa
résistance et sa barrière.

**Coût d'ouverture.** Faible, et il ne faut probablement pas passer par l'effet. La bonne
réponse est sans doute que l'impulsion est une **propriété statique du récepteur**, au même
titre que sa résistance : un coefficient de restitution et, éventuellement, une impulsion
fixe. Ça reste de la donnée, ça ne touche pas l'ensemble fermé des grandeurs, et le rejeu
serveur n'y perd rien. Il faut juste le décider explicitement, parce que #5 ne l'a pas dit.

**Si on n'ouvre pas :** le modèle ne sait exprimer que le bumper **passif**. Tous les modules
seraient des murs qui comptent.

### 3.2 Rien ne peut retenir la balle

**Le fait.** Trou, soucoupe, éjecteur vertical, aimant, verrou physique : dans tous ces cas la
balle **sort du jeu** un instant, puis est **réinjectée ailleurs**, avec une position et une
vitesse choisies par la machine.

**Ce qui manque.** Le modèle n'a que deux modes de sollicitation : `impact` (la balle
rebondit) et `passage` (elle traverse). Il manque un troisième — **capture** — et surtout la
donnée qui va avec : le **point de réinjection** et l'impulsion de sortie.

**Coût d'ouverture.** Moyen. Un troisième mode, plus deux champs sur le module. Ce n'est pas
une grandeur d'effet de plus, c'est une extension du récepteur. Le rejeu serveur y survit tant
que le point de sortie est statique.

**Si on n'ouvre pas :** pas de trou, pas d'aimant, pas de verrou physique, pas de
téléportation entre deux endroits du plateau. On perd toute la ponctuation du jeu — les
moments où la machine reprend la main. Dans un donjon fantasy, on perd aussi les modules les
plus évocateurs : l'autel qui avale l'offrande, le piège qui immobilise.

### 3.3 Une seule balle, et deux sens du mot « balle »

**Le fait.** La multiballe est le sommet d'une partie de flipper. Le cadriciel la traite en
distinguant explicitement le total de balles en jeu et l'ajout d'une balle.

**Ce qui manque, d'abord au glossaire.** `CONTEXT.md` définit **balle** comme le projectile,
puis définit **partie** comme « jouée avec un nombre de balles fixé ». Ce sont deux notions
différentes : le projectile, et la tentative. #5 range « une balle de plus » dans
`cadre de la partie` — au sens tentative. Il n'y a donc **aucun mot** pour « deux projectiles en même
temps ». C'est un écart de vocabulaire avant d'être un écart de modèle, et il faut le régler
d'abord : proposer **tentative** ou **lancer** pour le second sens.

**Coût d'ouverture.** Élevé, et pas seulement dans le modèle. Deux balles simultanées, ce sont
des collisions balle contre balle, un drain partiel, et surtout un **rejeu serveur** dont le
déterminisme dépend de l'ordre de résolution des contacts multiples. C'est un sujet #2, pas un
sujet catalogue. À trancher tôt justement pour ça.

**Si on n'ouvre pas :** on écarte la multiballe, et avec elle le jackpot au sens strict, qui
est une mécanique de multiballe. C'est défendable pour un premier jeu. Mais il faut le dire,
parce que ça retire au jeu son pic d'intensité.

### 3.4 Rien n'est orienté, et le sens de franchissement est perdu

**Le fait.** Une rampe et une orbite ne sont pas des choses qu'on touche, ce sont des chemins
qu'on **emprunte**. Le cadriciel le dit par sa géométrie de détection : deux interrupteurs,
l'un à l'entrée, l'autre pour signaler la réussite. Une orbite prise par la gauche et une
orbite prise par la droite ne sont pas le même coup.

**Ce qui manque.** Deux choses. D'abord, un récepteur à passage détecte le franchissement mais
ne dit rien du **sens**. Ensuite, et plus profondément : #5 met la géométrie dans le **plan**
(les tuiles) et le contenu dans le **module**. Une rampe est donc une chaîne de tuiles avec un
récepteur posé dessus — ce qui veut dire qu'**une rampe est cuite dans le plan et qu'une case
ne peut pas en poser une**. C'est un choix cohérent, mais #5 ne l'a pas énoncé, et il a une
conséquence forte : le garnissage ne peut pas changer la topologie du plateau.

**Coût d'ouverture.** Le sens de franchissement est bon marché : un champ sur le récepteur.
La rampe garnissable est chère : il faudrait des modules qui apportent leur propre géométrie
de chemin, ce qui rouvre le carrelage que #5 a assumé comme point faible.

**Recommandation :** ouvrir le sens de franchissement, laisser la rampe au plan, et le dire.

### 3.5 L'activation ne connaît ni l'ordre ni le temps

**Le fait.** Le cadriciel nomme quatre formes de conditions : compteur, accumulation,
**séquence**, machine à états. Il a aussi des coups en séquence et des enchaînements
(combo_switches) qui exigent deux sollicitations dans une fenêtre de temps.

**Ce qui manque.** #5 dit que la condition d'activation est « exprimée sur l'état de ses
récepteurs ». C'est un prédicat sur un état : un ET ou un OU, donc de l'**accumulation** et
rien d'autre. Une rampe (entrée puis réussite) demande déjà l'ordre. Un enchaînement demande
une fenêtre de temps. Le coup de lancement (skill shot) demande pire : une condition sur
l'**histoire** de la partie — « avant le premier contact avec un batteur ».

**Coût d'ouverture.** Faible tant que ça reste **dans un module** : l'ordre des récepteurs et
une fenêtre en millisecondes se codent en donnée et se rejouent sans risque. Élevé dès que la
condition sort du module — voir §3.6.

### 3.6 Rien n'existe entre les modules

**Le fait.** C'est l'écart le plus large. La règle d'un flipper réel se joue presque
entièrement **entre** les mécaniques, pas dedans : une banque complétée **allume** une rampe ;
une rampe allumée **démarre** un mode ; un mode **change la valeur** de tous les coups ; le
wizard mode s'ouvre quand tous les modes ont été faits.

**Ce qui manque.** #5 enferme la condition d'activation dans le module et l'effet dans quatre
grandeurs. Deux mécaniques n'y rentrent pas du tout :

- **allumer un coup** — un récepteur qui rapporte autrement parce qu'un *autre* module a été
  activé ;
- **le mode** — une phase de la partie qui change globalement la valeur des récepteurs, avec
  une durée et une condition de réussite ou d'échec.

La grandeur `état du plateau` en est l'amorce : #5 cite « réarmer les modules voisins » et
« neutraliser les barrières ». Ce sont déjà des effets qui **désignent d'autres modules**. La
question à trancher est donc plus étroite qu'il n'y paraît : est-ce que `état du plateau` peut
aussi **armer**, et pas seulement réarmer ou désarmer ?

**Coût d'ouverture.** Réel. Ça fait du plateau une machine à états, donc du rejeu un problème
d'**ordonnancement** : quel effet s'applique avant quel autre quand deux modules s'activent
dans la même image. C'est exactement le risque de divergence que #5 voulait éviter en
interdisant le code par module. Une règle d'ordre déterministe (par exemple : ordre de
déclaration des modules dans le plan) suffit probablement, mais il faut l'écrire.

**À noter :** #5 exigeait déjà l'adressage par proximité pour l'arme électrique — « active le
bumper le plus proche et lui fait rapporter ses points sans contact ». C'est le **même
besoin** vu depuis l'arme : désigner un autre module et lui faire quelque chose. Un seul
mécanisme d'adressage sert les deux. C'est un argument fort pour l'ouvrir.

### 3.7 Aucune valeur ne croît

**Le fait.** Trois mécaniques réelles reposent sur une valeur qui monte : le jackpot, dont le
montant croît pendant la multiballe ; le bonus de fin de balle, qui cumule puis multiplie ; et
le tourniquet, dont **un seul franchissement rapporte un nombre de points proportionnel à la
vitesse de la balle**, puisqu'il marque une fois par tour.

**Ce qui manque.** L'effet de #5 est un quadruplet **statique** : l'ampleur est figée dans
l'identité du module. Le multiplicateur temporaire (`score ×3 pendant 10 s`) couvre le mode,
mais pas « le jackpot vaut maintenant deux fois ce qu'il valait ».

**Le tourniquet est un cas propre et gênant.** Une sollicitation physique, N points. Si on le
modélise comme N sollicitations, on entame N fois la résistance — ce qui n'a aucun sens dès
que la résistance est finie. L'écart est net : **le modèle confond marquer et entamer**. #5
dit pourtant que ce sont deux canaux distincts (marquer / activer) ; il manque le troisième —
entamer.

**Coût d'ouverture.** Faible pour le tourniquet : découpler le nombre de points marqués du
nombre d'entames, en donnée. Modéré pour le jackpot : soit rendre l'ampleur fonction d'un
compteur — ce qui casse « l'effet est de la donnée » —, soit passer par un **multiplicateur
de score global** que les effets font monter, ce qui reste de la donnée et couvre aussi le
bonus multiplié. La seconde piste est nettement préférable.

### 3.8 Inerte ne dit pas si le récepteur reste solide

**Le fait.** Une cible tombante tombée s'enfonce **sous le plateau** : elle ne bloque plus, et
c'est précisément ce qui ouvre le chemin derrière elle. C'est une mécanique de conception de
plateau, pas un détail.

**Ce qui manque.** #5 définit **inerte** comme « résistance épuisée » et rien d'autre. Un
récepteur inerte reste-t-il un obstacle physique ? Le modèle ne le dit pas.

**Coût d'ouverture.** Négligeable : un booléen sur le récepteur, ou une convention écrite.
Mais il faut choisir, sinon deux personnes implémenteront deux choses.

### 3.9 Le tilt n'a pas de prise

Il n'y a pas d'entrée joueur autre que les batteurs. Pas de secousse, donc pas de tilt. À
**écarter explicitement** plutôt qu'à traduire : c'est une sanction contre une triche physique
qui n'existe pas ici. Aucun coût, aucune perte.

### 3.10 Le socle fige la difficulté du bas de plateau

#5 met batteurs, drain, couloirs de sortie et lanceur dans le **socle**, invariant sur tous les
plans. Or sur une machine réelle, la largeur des couloirs de sortie est le premier levier de
difficulté. Conséquence assumée : la difficulté d'une case ne peut passer **que** par le plan,
le garnissage et les variantes de modules. Il n'y a pas de « case avec des couloirs de sortie
larges ». Ce n'est pas un défaut, c'est une contrainte à connaître au moment d'équilibrer.
Le coup de lancement (skill shot) tombe pour la même raison : le lanceur étant invariant, il ne
peut pas être une mécanique de case.

---

## 4. Liste de départ proposée

Douze modules, écrits pour être discutés et rejetés, pas pour être implémentés tels quels.
Les empreintes supposent une maille où la balle occupe à peu près une cellule.

| Module | Empreinte | Récepteurs | Mode | Résistance | Activation | Effet |
|---|---|---|---|---|---|---|
| `bumper` | 1×1 | 1 | impact | ∞ | aucune | — |
| `gros-bumper` | 2×2 | 1 | impact | ∞ | aucune | — (marque ×3) |
| `serviteur` | 1×1 | 1 | impact | 3 | inerte | score, faible, court |
| `boss` | 3×3 | 1 | impact | 12 | inerte | score ×3, 10 s |
| `boss-barricade-necrotique` | 3×3 | 1 | impact, barrière nécrotique | 12 | inerte | score ×3, 10 s |
| `triple-bouton` | 3×1 | 3 | impact | 1 chacun | les trois inertes | état du plateau : neutraliser les barrières, 8 s |
| `cible-fixe` | 1×1 | 1 | impact | ∞ | aucune | — |
| `banque-de-trois-cibles` | 3×1 | 3 | impact | 1 chacun | les trois inertes | score ×2, 15 s |
| `trois-voies` | 3×1 | 3 | passage | 1 chacun | les trois inertes | cadre de la partie : une tentative de plus |
| `tourniquet` | 1×1 | 1 | passage | ∞ | aucune | — (marque par tour, voir §3.7) |
| `braises` | 2×1 | 1 | impact | ∞ | sollicitation | physique de la balle : rebonds plus vifs, 5 s |
| `autel` | 2×2 | 1 | passage | 1 | inerte | état du plateau : réarmer les modules voisins |

Ce qui **n'y est pas** et devrait y être, une fois les écarts tranchés : la rampe et l'orbite
(§3.4, dépendent du plan), le trou et l'aimant (§3.2, mode capture), la catapulte latérale
(§3.1, impulsion), le jackpot (§3.3 et §3.7).

L'archétype de #4 — un boss central entouré de serviteurs — se pose avec `boss` +
`serviteur` × n, et la variante barricadée fait exactement ce que #4 attendait : la case reste
jouable, le score reste au ras du sol.

---

## 5. Grandeurs d'effet réellement sollicitées

Confrontation de ce que les mécaniques réelles font au quatuor fermé de #5.

| Effet réel observé | Grandeur de #5 | Verdict |
|---|---|---|
| Points d'un coup, valeur d'une cible | score | couvert |
| Multiplicateur de plateau, bonus multiplié | score | couvert |
| Valeur de jackpot qui croît | score | **couvert seulement si** un multiplicateur global est ouvert (§3.7) |
| Balle supplémentaire (extra ball) | cadre de la partie | couvert |
| Sauvegarde de balle, relance de couloir | cadre de la partie | couvert |
| Multiballe | cadre de la partie ? | **non couvert** — c'est le nombre de projectiles, pas de tentatives (§3.3) |
| Ouvrir ou fermer un chemin (aiguillage, porte) | état du plateau | couvert |
| Relever une banque, éteindre une barrière | état du plateau | couvert |
| Allumer un coup ailleurs, démarrer un mode | état du plateau ? | **non couvert tel quel** — demande l'adressage inter-modules (§3.6) |
| Gravité ou rebond modifiés pendant n secondes | physique de la balle | couvert |
| Impulsion d'un bumper actif ou d'une catapulte | physique de la balle ? | **non couvert** — et ce n'est probablement pas un effet (§3.1) |
| Saisir, tenir, projeter la balle (aimant, trou) | — | **non couvert** — demande le mode capture (§3.2) |
| Sanction de tilt | cadre de la partie | sans objet (§3.9) |

### Est-ce que quatre suffisent ?

**Oui — sous trois conditions, dont aucune n'ajoute une cinquième grandeur.**

1. **L'impulsion sort des effets** et devient une propriété statique du récepteur, à côté de
   la résistance. Sinon le jeu n'a que des bumpers passifs.
2. **`état du plateau` est autorisé à désigner d'autres modules**, avec une règle d'ordre
   déterministe pour le rejeu. C'est le même mécanisme que l'adressage par proximité déjà
   exigé par #5 pour les armes. Sans ça, ni mode, ni coup allumé, ni chaînage — c'est-à-dire
   presque toute la règle d'un flipper.
3. **La croissance de valeur passe par un multiplicateur de score global**, que les effets font
   monter et descendre. Ça garde l'effet statique.

**Deux choses restent dehors et demandent un vrai arbitrage, pas un ajustement.**

- **La capture de la balle** (§3.2). Ce n'est pas une grandeur d'effet mais un troisième mode
  de sollicitation. Coût moyen, valeur de jeu élevée. Recommandation : ouvrir.
- **La multiballe** (§3.3). Ce n'est pas un problème de catalogue mais de moteur et de rejeu.
  Recommandation : écarter explicitement pour l'instant, et régler d'abord le double sens du
  mot **balle** dans le glossaire.

---

## Sources

Documentations de fabrication :

- [Pinball Makers — Basics](https://pinballmakers.com/wiki/index.php?title=Basics)
- [Pinball Makers — Construction](https://pinballmakers.com/wiki/index.php?title=Construction)
- [Marco Specialties — Pop Bumper Components](https://www.marcospecialties.com/pinball-parts/PFLD-BUMP)

Mission Pinball Framework :

- [Référence de configuration](https://missionpinball.org/latest/config/) ·
  [Mécanismes](https://missionpinball.org/latest/mechs/) ·
  [Logique de jeu](https://missionpinball.org/latest/game_logic/)
- [drop_targets](https://missionpinball.org/latest/config/drop_targets/) ·
  [drop_target_banks](https://missionpinball.org/latest/config/drop_target_banks/) ·
  [spinners](https://missionpinball.org/latest/config/spinners/) ·
  [magnets](https://missionpinball.org/latest/config/magnets/) ·
  [diverters](https://missionpinball.org/latest/config/diverters/) ·
  [multiballs](https://missionpinball.org/latest/config/multiballs/) ·
  [multiball_locks](https://missionpinball.org/latest/config/multiball_locks/) ·
  [kickbacks](https://missionpinball.org/latest/config/kickbacks/) ·
  [autofire_coils](https://missionpinball.org/latest/config/autofire_coils/) ·
  [tilt](https://missionpinball.org/latest/config/tilt/)
- [Loops / Orbits / Ramps](https://missionpinball.org/latest/mechs/loops/) ·
  [Pop Bumpers](https://missionpinball.org/latest/mechs/pop_bumpers/) ·
  [Targets](https://missionpinball.org/latest/mechs/targets/)
- [ball_saves](https://missionpinball.org/latest/game_logic/ball_saves/) ·
  [shots](https://missionpinball.org/latest/game_logic/shots/) ·
  [logic_blocks](https://missionpinball.org/latest/game_logic/logic_blocks/)

Règlement de compétition :

- [PAPA/IFPA Tournament Rules](https://www.ifpapinball.com/rules/)

Consultées sans succès (PDF d'images, texte non extractible) :

- [Stern — Godzilla](https://www.sternpinball.com/wp-content/uploads/2022/06/Godzilla-Rulesheet.pdf) ·
  [Rush](https://www.sternpinball.com/wp-content/uploads/2022/09/Rush-Rulesheet.pdf) ·
  [Metallica Remastered](https://sternpinball.com/wp-content/uploads/2025/04/Metallica-Remastered-Rulesheet.pdf) ·
  [Ghostbusters](https://sternpinball.com/wp-content/uploads/2018/10/GB-Basic-guide.pdf)
