# Moteur physique 2D déterministe pour BetaBounce

Note de recherche — issue [gown-dev/BetaBounce#2](https://github.com/gown-dev/BetaBounce/issues/2).
Date : 2026-08-07. Sources primaires uniquement (docs officielles, code, specs, issues des mainteneurs).

## 1. Le problème posé correctement

Le serveur doit rejouer la partie à partir des entrées du joueur et retrouver le même
score. Il faut donc que la simulation donne **bit pour bit** le même résultat sous Node
(V8 côté serveur) et dans le navigateur du joueur (V8, SpiderMonkey ou JavaScriptCore).
C'est du déterminisme **cross-plateforme**, pas du déterminisme local.

Point souvent mal posé : **l'arithmétique flottante de JavaScript est déjà déterministe.**
ECMA-262 définit `Number` comme un binary64 IEEE-754 et `+ - * /` comme les opérations
IEEE-754 correspondantes, arrondi au plus proche pair, sans FMA ni précision étendue x87
([ECMA-262, Numbers and Dates](https://tc39.es/ecma262/multipage/numbers-and-dates.html)).
`Math.sqrt`, `Math.abs`, `Math.floor`, `Math.fround` sont exactement spécifiés.

Le trou est ailleurs. Les fonctions transcendantes sont *implementation-approximated* :
la spec dit que « the behaviour of `sin` is not precisely specified except to require
specific results for certain argument values » et laisse « some latitude […] in the choice
of approximation algorithms », avec l'intention explicite que l'implémenteur puisse
réutiliser la bibliothèque mathématique de la plateforme
([ECMA-262 §Math.sin](https://tc39.es/ecma262/multipage/numbers-and-dates.html#sec-math.sin)).
Sont concernés : `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `atan2`, `exp`, `log`,
`log2`, `log10`, `pow`, `cbrt`, `hypot`, les hyperboliques.

C'est confirmé empiriquement par les moteurs eux-mêmes : V8 et SpiderMonkey utilisent des
portages *différents* de fdlibm, JavaScriptCore utilise le `cmath` du système. Mozilla a
dû introduire `javascript.options.use_fdlibm_for_sin_cos_tan` précisément parce que
`sin`/`cos`/`tan` variaient selon l'OS et le matériel
([intent to implement, dev-platform](https://groups.google.com/a/mozilla.org/g/dev-platform/c/0dxAO-JsoXI/m/eEhjM9VsAgAJ),
[bug 531915 « Floating point differences between platforms »](https://bugzilla.mozilla.org/show_bug.cgi?id=531915),
[bug 1775254 sur la précision de `Math.pow`](https://bugzilla.mozilla.org/show_bug.cgi?id=1775254)).

Dans Matter.js, la surface exposée est petite mais placée exactement au mauvais endroit :
`Vector.rotate` et `Vector.rotateAbout` appellent `Math.cos`/`Math.sin`, `Vector.angle`
appelle `Math.atan2`, `Vector.magnitude` appelle `Math.sqrt` (celui-là est sûr)
([src/geometry/Vector.js](https://github.com/liabru/matter-js/blob/master/src/geometry/Vector.js)).
La rotation des flippers passe par là à chaque frame.

Second problème, indépendant du déterminisme mais bloquant pour un flipper : **Matter.js
n'a pas de CCD**. L'issue [liabru/matter-js#5](https://github.com/liabru/matter-js/issues/5)
est ouverte depuis les débuts du projet, la branche `ccd` est décrite par le mainteneur
comme inutilisable en l'état ([issue #336](https://github.com/liabru/matter-js/issues/336),
[#309](https://github.com/liabru/matter-js/issues/309)). Une bille de flipper à pleine
vitesse traverse les murs. Le mainteneur classe par ailleurs le lockstep déterministe
comme *out-of-scope* ([issue #1040](https://github.com/liabru/matter-js/issues/1040)).

## 2. Pourquoi WebAssembly résout structurellement le problème

Un moteur compilé en WASM et distribué comme **un seul fichier `.wasm`** transforme le
problème « déterminisme cross-plateforme » en problème « même binaire », qui est le cas
facile.

- La spec WASM définit les opérations flottantes comme les opérations IEEE-754, arrondi
  au plus proche pair, sans mode d'arrondi alternatif ni précision étendue
  ([WebAssembly Core, Numerics](https://webassembly.github.io/spec/core/exec/numerics.html)).
- Il n'y a **aucune instruction transcendante** dans WASM : pas de `f32.sin`. Un moteur
  qui a besoin de `sin` doit soit l'importer de l'hôte (mauvais : on retombe sur le libm
  de la plateforme), soit **embarquer sa propre implémentation logicielle dans le module**
  (bon : le code est le même partout).
- La seule non-déterminisme flottant restant est le **motif de bits des NaN**, plus le
  SIMD *relaxed* et le multithreading
  ([design/Nondeterminism.md](https://github.com/WebAssembly/design/blob/main/Nondeterminism.md)).
  Le SIMD non-relaxed est déterministe. Les bits de NaN ne comptent que si la simulation
  produit un NaN — auquel cas la partie est déjà cassée — ou s'ils fuient dans un hash
  d'état.

Contrainte pratique associée : **la version du moteur fait partie du contrat**. Client et
serveur doivent charger exactement le même `.wasm`, donc version épinglée, pas de plage
semver.

## 3. Inventaire des candidats

| Moteur | Accès TS | Garantie documentée | Portée réelle |
|---|---|---|---|
| **Rapier 2D** (`@dimforge/rapier2d-deterministic`) | bindings officiels WASM + `.d.ts` | cross-plateforme, explicitement navigateur ↔ Node | la plus forte du lot |
| **Box2D v3** (via `box2d3-wasm`) | bindings tiers | cross-plateforme côté C, mais dépend des flags de build du binding | à vérifier soi-même |
| **Jolt** (`jolt-physics`, WASM) | bindings officiels | cross-plateforme si `CROSS_PLATFORM_DETERMINISTIC` | **3D uniquement** |
| **planck.js** | natif TS | explicitement *non* garanti cross-plateforme | non |
| **Matter.js** | natif JS | aucune garantie, sujet *out-of-scope* | non |

### Rapier 2D — le candidat sérieux

La doc Rust distingue nettement les deux niveaux : déterminisme local par défaut, et
déterminisme cross-plateforme seulement avec la feature `enhanced-determinism`, laquelle
est incompatible avec `simd-nightly`, `simd-stable` et `parallel`
([Rapier / Determinism, Rust](https://rapier.rs/docs/user_guides/rust/determinism/)).

Le mécanisme est vérifiable dans le source :
`enhanced-determinism = ["simba/libm_force", "parry2d/enhanced-determinism"]`
([crates/rapier2d/Cargo.toml](https://github.com/dimforge/rapier/blob/master/crates/rapier2d/Cargo.toml)).
`libm_force` force l'usage du crate `libm` (portage logiciel de la libm de musl) **même
hors `no_std`**, donc les transcendantes sont compilées **dans** le module WASM au lieu
d'être importées. C'est exactement la condition du §2.

La page JavaScript est plus directe que la page Rust et répond au point qui nous
intéresse : la version WASM/TypeScript est « fully cross-platform deterministic »,
« même avec des navigateurs, systèmes d'exploitation et processeurs différents », à
version de Rapier identique et conditions initiales identiques (mêmes paramètres, mêmes
corps/colliders/joints, **même ordre d'insertion et de suppression**)
([Rapier / Determinism, JavaScript](https://rapier.rs/docs/user_guides/javascript/determinism/)).

Deux avertissements de cette même page, à prendre au sérieux :

1. La garantie couvre l'intérieur du moteur, pas nos données d'entrée. Si on calcule la
   position d'un bumper avec `Math.cos` côté client et côté serveur, on peut injecter des
   conditions initiales divergentes dans un moteur pourtant déterministe. La doc le dit
   noir sur blanc pour `Math.sin`/`Math.cos`.
2. La vérification se fait avec `world.createSnapshot()` puis hash du tableau d'octets.
   C'est notre test de non-régression, gratuit à écrire.

Depuis rapier.js 0.15.0 (mars 2025), les paquets `rapier2d`/`rapier3d` sont construits
**sans** `enhanced-determinism` ; il faut migrer explicitement vers la saveur
`-deterministic`, décrite comme « less optimized » en échange de la garantie
([CHANGELOG rapier.js](https://github.com/dimforge/rapier.js/blob/master/CHANGELOG.md)).
Piège de packaging concret : c'est la variante `-deterministic` qu'il faut, pas la
variante par défaut. Variantes `-compat` disponibles quand le bundler ne sait pas charger
le `.wasm` (WASM encodé en base64 dans le JS) — utile pour Node.
Version courante : `@dimforge/rapier2d-deterministic` 0.19.3 (nov. 2025).

Bonus non négociable pour un flipper : Rapier a une **CCD non linéaire** (translation +
rotation), activable par corps via `RigidBodyDesc.dynamic().setCcdEnabled(true)`, avec
`IntegrationParameters.maxCcdSubsteps` réglable
([Rapier / rigid_body_ccd](https://rapier.rs/docs/user_guides/javascript/rigid_body_ccd/)).
C'est ce qui manque à Matter.

Limite honnête : la garantie est *à version identique*. Toute montée de version de Rapier
invalide les rejeux enregistrés avec l'ancienne. Il faut versionner les replays.
Rapier a aussi eu des bugs de déterminisme ponctuels — par exemple
[dimforge/rapier#797](https://github.com/dimforge/rapier/issues/797) (perte de
déterminisme via `setRotationWrtParent`/`setRotation`). La garantie est réelle mais reste
une garantie logicielle, pas un théorème.

### Box2D v3

Erin Catto documente précisément le travail fait pour la v3 : pas de nombres aléatoires,
déterminisme multithread obtenu par des bit arrays plutôt que des atomiques, et pour le
cross-plateforme trois actions — désactiver `fast-math`, désactiver le FMA par flags de
compilation, et **réimplémenter `atan2f`** parce que « atan2f gives different answers on
different platforms » (`sinf`/`cosf` se sont révélés cohérents sur les compilateurs
testés). Le test de référence est la scène *Falling Hinges*, comparée par hash de
transforms ([box2d.org / Determinism](https://box2d.org/posts/2024/08/determinism/)).
Il précise aussi que le déterminisme *roll-back* n'est pas supporté.

Techniquement excellent, mais côté web on dépend de bindings tiers :
[Birch-san/box2d3-wasm](https://github.com/Birch-san/box2d3-wasm) (WASM + SIMD + Web
Workers), qui ne documente pas ses garanties de déterminisme et active du multithread par
workers — dont le comportement selon le nombre de workers disponible côté client vs Node
serait à valider nous-mêmes. Substituable à Rapier, mais avec la charge de preuve sur
nous.

### Jolt

`JPH_CROSS_PLATFORM_DETERMINISTIC` (option CMake `CROSS_PLATFORM_DETERMINISTIC`) coûte
~8 % de performance et rend la simulation déterministe quel que soit le compilateur, y
compris **emscripten**, dont la build WASM « can now be compiled cross-platform
deterministic and deliver the same results as Windows, Linux, etc. »
([Jolt / Building README](https://jrouwe.github.io/JoltPhysics/md__build_2_r_e_a_d_m_e.html),
[Release Notes](https://jrouwe.github.io/JoltPhysics/md__docs_2_release_notes.html)).
La garantie est donc de même nature que celle de Rapier. Mais Jolt est **3D** : simuler
un flipper 2D en contraignant un monde 3D est un coût gratuit en complexité et en CPU.
Écarté sur ce seul motif.

### planck.js

La doc de planck.js reprend telle quelle la formulation Box2D : reproductible « for the
same input, and same binary », pas au-delà, à cause du traitement du flottant selon
compilateurs et processeurs
([Limitations](https://piqnt.com/planck.js/docs/limitations.html)). Un utilisateur a
demandé si en JS la notion de « même binaire » pouvait signifier « même version de V8 »
([issue #271](https://github.com/piqnt/planck.js/issues/271)) — sans réponse du
mainteneur. En pratique planck.js est un portage TS de Box2D et appelle donc les `Math.*`
transcendantes de l'hôte : même faille que Matter.js, sans garantie compensatoire.

## 4. Coût d'intégration avec Phaser

Faible, et c'est le point rassurant. Phaser 3 propose Arcade et Matter, mais **aucun des
deux n'est obligatoire** : sans clé `physics` dans la config, aucun moteur n'est démarré,
et un GameObject reste positionnable par `setPosition()` / `setRotation()`. Le schéma
« moteur tiers pour la simulation, Phaser pour le rendu seul » consiste à faire un
`world.step()` par tick puis à recopier les transforms sur les sprites.

Phaser publie d'ailleurs officiellement le chemin Rapier : un
[template Rapier + Phaser](https://github.com/phaserjs/template-rapier) présenté comme une
intégration native « no plugin or layer over the top of it », et un
[rapier-connector](https://github.com/phaserjs/rapier-connector) qui apparie un GameObject
avec un rigid body via `addRigidBody()` et synchronise position/rotation
([annonce Phaser, août 2024](https://phaser.io/news/2024/08/rapier-physics-and-phaser-templates)).

Recommandation d'architecture pour BetaBounce : **ne pas** utiliser le connector. Le cœur
de simulation vit dans `shared`, ne connaît pas Phaser, et expose un pas de temps fixe.
`client` lit les transforms après chaque pas et les pousse dans Phaser. C'est ce qui
garantit que `server` peut faire tourner exactement le même code sans Phaser du tout.
Le connector fait l'inverse : il couple le corps physique au GameObject.

## 5. L'alternative Rune : patcher `Math` avec `Math.fround`

Rune décrit son approche dans
[« Making JS deterministic for fun and glory »](https://developers.rune.ai/blog/making-js-deterministic-for-fun-and-glory).
Trois volets :

- **`Math`** : quasi toutes les fonctions sont patchées, le résultat étant arrondi en
  simple précision via `Math.fround()` (abs, acos, sin, cos, sqrt, pow, floor, ceil… ~37
  fonctions au total).
- **`Math.random`** : remplacé par mulberry32 seedé, l'état de la graine étant suivi
  séparément (hachage xmur3) pour permettre le rollback.
- **`Array.prototype.sort`** : remplacé par un comparateur déterministe conforme à la
  spec, le tri par défaut variant entre moteurs.

Mise en œuvre par **monkey patching** des globaux, restaurés ensuite pour ne pas
contaminer le reste de l'application, plus un
[`eslint-plugin-rune`](https://www.npmjs.com/package/eslint-plugin-rune) qui signale les
constructions non déterministes à l'écriture.

Correction importante par rapport à la formulation de l'issue : **Rune ne forke pas
Matter.js**. Elle patche les globaux, et n'importe quel moteur en JS pur hérite du patch.
Il n'y a donc pas de fork à maintenir. C'est nettement moins cher que ce qu'on redoutait.

Ce que ça vaut vraiment :

- **Ça marche en pratique, mais ce n'est pas une garantie.** L'argument est probabiliste :
  deux moteurs JS divergent typiquement de quelques ULP en binary64 ; arrondir à binary32
  écrase cet écart… **sauf** quand les deux résultats tombent de part et d'autre d'une
  frontière d'arrondi binary32. Cet événement est rare mais non nul, et il n'existe aucune
  clause de spec qui l'interdise — ECMA-262 laisse explicitement « some latitude » sur les
  algorithmes d'approximation. Rune peut vivre avec : leur modèle est *predict-rollback*,
  une divergence se resynchronise. **BetaBounce ne le peut pas** : le rejeu serveur est un
  contrôle anti-triche, une divergence signifie un score refusé à un joueur honnête.
- Le risque n'est pas stable dans le temps : V8 et SpiderMonkey continuent de faire
  évoluer leurs implémentations mathématiques (cf. bugs Mozilla cités plus haut). Une
  mise à jour de navigateur peut déplacer la frontière.
- Le coût de maintenance est réel même sans fork : patcher/dépatcher autour de chaque pas
  de simulation, et une discipline permanente (lint, revue) pour qu'aucun code de jeu
  n'appelle un `Math` non patché ni ne dépende de l'ordre d'itération d'un `Map`/`Set`.
- Et surtout : **ça ne règle pas le CCD**. Même parfaitement déterministe, Matter.js
  laissera la bille traverser un mur. Il faudrait de toute façon écrire notre propre CCD
  ou changer de moteur.

Verdict : approche légitime, à retenir comme **filet de sécurité pour la logique de jeu
non physique** (génération du donjon, scoring, effets), pas comme fondation du moteur
physique.

## 6. Recommandation

**Prendre `@dimforge/rapier2d-deterministic`, version épinglée, dans `shared`. Phaser
en rendu seul.**

C'est le seul candidat qui documente explicitement le cas exact de BetaBounce — même
simulation dans le navigateur et sous Node, machines et moteurs JS différents — et dont le
mécanisme est vérifiable dans le source (`simba/libm_force` → transcendantes compilées
dans le `.wasm`, donc plus aucun appel à la libm de l'hôte). Il apporte en prime la CCD
non linéaire, sans laquelle un flipper n'est pas simulable correctement, et Matter.js n'en
a pas.

Effort d'intégration : modéré.

- Écrire dans `shared` un `PinballWorld` qui possède le `RAPIER.World`, avance à pas de
  temps fixe et consomme une liste d'entrées horodatées. Aucune dépendance Phaser.
- Chargement WASM asynchrone à gérer des deux côtés (`await RAPIER.init()`), variante
  `-compat` si le bundler ou Node coince sur le `.wasm`.
- Côté client, boucle Phaser sans clé `physics`, recopie des transforms après chaque pas.
- Test de non-régression dès le premier jour : hash de `world.createSnapshot()` après N
  pas, comparé entre Node et un navigateur réel en CI. C'est le test qui protège tout le
  reste.

Risques et mitigations :

- **Version = contrat.** Une montée de Rapier peut changer les résultats. Estampiller
  chaque replay avec la version du moteur ; ne migrer que par lot, en invalidant ou en
  rejouant les anciens scores.
- **Conditions initiales.** Interdire `Math.sin`/`cos`/`atan2`/`pow` dans tout code de
  `shared` qui produit des valeurs injectées dans le monde physique (géométrie du donjon,
  angles de bumpers). Précalculer en constantes, ou passer par une table. Règle ESLint
  dédiée, dans l'esprit d'`eslint-plugin-rune`.
- **Ordre d'insertion.** La garantie exige un ordre identique d'ajout/retrait des corps.
  Construire le monde à partir d'une description ordonnée et sérialisable, jamais d'une
  itération d'objet ou de `Set`.
- **Coût CPU.** La build `-deterministic` est « less optimized » (pas de SIMD, pas de
  parallélisme). Sur une scène de flipper — quelques dizaines de corps — c'est sans
  conséquence.
- **Bugs de déterminisme amont.** Ils existent (dimforge/rapier#797). Le test de hash en
  CI les attrape avant les joueurs.

Repli si Rapier déçoit à la mesure : Box2D v3 via `box2d3-wasm`, en reconstruisant le
binding nous-mêmes avec les flags voulus et sans threading. Même famille de garantie,
mais charge de preuve sur nous.

Ce qu'on ne fait pas : garder Matter.js, avec ou sans patch `fround`. Le patch ne donne
qu'une garantie probabiliste, incompatible avec un rejeu anti-triche, et laisse le
problème de CCD entier.
