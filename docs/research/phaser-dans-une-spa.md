# Intégrer Phaser dans une SPA

> Note de recherche — issue [gown-dev/BetaBounce#3](https://github.com/gown-dev/BetaBounce/issues/3)
> Date : 2026-08-07. Sources primaires uniquement (doc officielle, code des dépôts).
> Versions relevées le 2026-08-07 : Phaser **4.2.1**, Angular **22.1.0**, React 19, Vue 3.5, Svelte 5.

## Contexte BetaBounce

Le client est un **site**, pas un jeu. Une SPA porte le profil, les quêtes, la carte du
donjon et la navigation. Phaser n'occupe qu'un seul écran : la partie de flipper qui
résout un déplacement de case. Le joueur y entre et en sort **à chaque case**, donc
potentiellement des dizaines de fois par session.

Trois conséquences dirigent toute l'analyse :

1. Le cycle montage / démontage du canvas est chaud. Ce n'est pas un cas limite.
2. Le poids de Phaser ne doit pas grever le chargement du reste du site.
3. Le client renvoie score **et** entrées pour un rejeu serveur. La frontière
   SPA ↔ scène Phaser doit transporter un objet structuré, pas juste un nombre.

---

## 1. Frameworks SPA et templates officiels

### Ce qui existe réellement chez `phaserjs`

Phaser Studio publie une famille de templates. La page officielle
[Project Templates](https://docs.phaser.io/phaser/getting-started/project-templates)
annonce « Phaser has support for all of the major front-end frameworks and bundlers » et
liste React, Vue, Angular, Svelte, SolidJS, Next.js, Remix, plus les templates sans
framework (Vite, Webpack, Rollup, Parcel, ESBuild, Import Map, Bun).

Les quatre qui nous concernent, vérifiés dans les dépôts :

| Template | Dépôt | Framework | Phaser | Bundler | TS | Étoiles |
|---|---|---|---|---|---|---|
| React (TS) | [`phaserjs/template-react-ts`](https://github.com/phaserjs/template-react-ts) | React 19.0.0 | 4.0.0 | Vite 6.3 | oui | 200 |
| React (JS) | [`phaserjs/template-react`](https://github.com/phaserjs/template-react) | React 19 | 4.0.0 | Vite | non | 155 |
| Vue | [`phaserjs/template-vue`](https://github.com/phaserjs/template-vue) | Vue 3.5.13 | 4.0.0 | Vite | non (`.js`) | 92 |
| Svelte | [`phaserjs/template-svelte`](https://github.com/phaserjs/template-svelte) | Svelte 5.23.1 + SvelteKit 2.20 | 4.0.0 | Vite 6.3 | oui | 83 |
| Angular | [`phaserjs/template-angular`](https://github.com/phaserjs/template-angular) | Angular 19.2 | 4.0.0 | Angular CLI | oui | 39 |

Sources : `package.json` de chaque dépôt, branche `main`, relevés le 2026-08-07
([angular](https://github.com/phaserjs/template-angular/blob/main/package.json),
[react-ts](https://github.com/phaserjs/template-react-ts/blob/main/package.json),
[vue](https://github.com/phaserjs/template-vue/blob/main/package.json),
[svelte](https://github.com/phaserjs/template-svelte/blob/main/package.json)).

### Ce que font réellement ces templates

Tous les quatre font **exactement la même chose**, à la syntaxe du framework près :

1. Un fichier `src/game/main.ts` exporte `StartGame(parentId)` qui construit la config
   Phaser et retourne `new Phaser.Game(config)`.
2. Un fichier `src/game/EventBus.ts` — **trois lignes**, identiques partout :

   ```ts
   import { Events } from 'phaser';
   // Used to emit events between components, HTML and Phaser scenes
   export const EventBus = new Events.EventEmitter();
   ```
   ([template-angular/src/game/EventBus.ts](https://github.com/phaserjs/template-angular/blob/main/src/game/EventBus.ts))
3. Un composant hôte (`phaser-game.component.ts`, `PhaserGame.tsx`, `PhaserGame.vue`,
   `PhaserGame.svelte`) qui rend un `<div id="game-container">`, appelle `StartGame` au
   montage, écoute `current-scene-ready` sur l'`EventBus`, et détruit le jeu au démontage.
4. Cinq scènes de démonstration (`Boot`, `Preloader`, `MainMenu`, `Game`, `GameOver`).

**Il n'y a pas d'intégration profonde.** Le « bridge » officiel, c'est un
`EventEmitter` global et un `<div>`. La valeur ajoutée d'un template par rapport à un
autre est donc quasi nulle : ce qui les différencie tient dans un fichier de ~40 lignes
que l'on réécrit en dix minutes.

Corollaire important pour trancher : **le choix du framework SPA n'est pas contraint par
Phaser.** Aucun des quatre n'offre d'avantage structurel.

### Qualité inégale des templates — trois défauts vérifiés dans le code

Le template Angular déclare `implements OnInit` seulement, mais définit `ngOnDestroy` ;
et il **n'enlève jamais** son écouteur `current-scene-ready` :

```ts
export class PhaserGame implements OnInit
{
    ngOnInit () {
        this.game = StartGame('game-container');
        EventBus.on('current-scene-ready', (scene: Phaser.Scene) => { ... });
    }
    ngOnDestroy () {
        if (this.game) { this.game.destroy(true); }   // pas de EventBus.off
    }
}
```
([source](https://github.com/phaserjs/template-angular/blob/main/src/app/phaser-game.component.ts))

L'`EventBus` étant un **singleton de module**, il survit au composant. Chaque
entrée/sortie de l'écran de jeu empile une fermeture qui retient l'instance du composant
et la scène. Fuite garantie sur notre cas d'usage (des dizaines de cycles).

Le template Vue a le même défaut : il détruit le jeu dans `onUnmounted` mais laisse
l'écouteur en place ([PhaserGame.vue](https://github.com/phaserjs/template-vue/blob/main/src/PhaserGame.vue)).

Le template Svelte est pire : `onMount` crée le jeu et pose l'écouteur, **il n'y a aucun
`onDestroy`**. Le jeu n'est jamais détruit
([PhaserGame.svelte](https://github.com/phaserjs/template-svelte/blob/main/src/PhaserGame.svelte)).

Seul le template React fait le ménage complet — précisément parce que StrictMode l'a
forcé : `useLayoutEffect` retourne un cleanup qui appelle `destroy(true)` et remet la ref
à `null`, et `useEffect` retourne `EventBus.removeListener('current-scene-ready')`
([PhaserGame.tsx](https://github.com/phaserjs/template-react-ts/blob/main/src/PhaserGame.tsx)).

**À retenir : quel que soit le template retenu, le composant hôte est à réécrire.**

### Fraîcheur des templates

Tous les templates sont sur Phaser 4.0.0 alors que la version courante est 4.2.1.
Les README sont périmés : celui de `template-svelte` annonce « Phaser 3.90.0 » alors que
son `package.json` déclare `"phaser": "4.0.0"`, celui de `template-angular` annonce
« Phaser 3.90.0 » pour la même raison. Dernier push sur ces dépôts : avril 2026.

Le template Angular est le plus en retard : **Angular 19.2**, alors que
`@angular/core` est en **22.1.0**
([registry npm](https://registry.npmjs.org/@angular/core/latest)). Il embarque encore
`zone.js ~0.15.0` en dépendance directe, et utilise `ng serve` / `ng build` via
`@angular-devkit/build-angular` — pas Vite en direct, contrairement à ce que suggère la
ligne « Angular + Vite » du tableau de la doc.

### Coût par framework

| | React | Vue | Svelte | Angular |
|---|---|---|---|---|
| Template officiel | oui, TS, le mieux écrit | oui, JS seulement | oui, TS, mais SvelteKit | oui, TS, en retard |
| Piège spécifique | StrictMode double-monte les effets en dev → double `new Phaser.Game` si le garde `game.current === null` saute | template en JS, à convertir en TS | SvelteKit impose le SSR : le composant Phaser doit être garanti côté client | zone.js (voir §5) ; template Angular 19 |
| Connaissance du dev | — | — | — | **acquise** |
| Adhérence à Phaser | nulle | nulle | nulle | nulle |

Le piège React est réel mais documenté et déjà traité dans le template. Le piège
SvelteKit est réel : `new Phaser.Game()` touche `document`, il faut donc soit
`export const ssr = false`, soit un `browser`-guard. Le piège Angular est traité au §5
et se révèle largement neutralisé depuis Angular 21.

---

## 2. Montage et démontage du canvas

### Le patron

Le patron officiel, commun aux quatre templates, tient en trois temps :

1. Rendre un conteneur DOM stable (`<div id="game-container">`).
2. Au montage du composant : `game = new Phaser.Game({ parent: 'game-container', ... })`.
3. Au démontage : `game.destroy(true)` puis lâcher la référence.

### Ce que fait `destroy` exactement

Signature réelle
([API Game](https://docs.phaser.io/api-documentation/class/game),
[src/core/Game.js](https://github.com/phaserjs/phaser/blob/v4.2.1/src/core/Game.js)) :

```js
destroy: function (removeCanvas, noReturn)
{
    if (noReturn === undefined) { noReturn = false; }
    this.pendingDestroy = true;
    this.removeCanvas = removeCanvas;
    this.noReturn = noReturn;
},
```

**Trois points critiques :**

**(a) `destroy()` est asynchrone.** Elle ne détruit rien. Elle lève un drapeau
`pendingDestroy` que la boucle consomme à la frame suivante :

```js
step: function (time, delta)
{
    if (this.pendingDestroy) { return this.runDestroy(); }
    ...
}
```

La doc le dit : « Flags this Game instance as needing to be destroyed on the _next
frame_, making this an asynchronous operation. »

Conséquence directe pour une SPA : si le routeur retire le `<div>` parent du DOM
immédiatement après `destroy(true)`, `runDestroy()` s'exécutera **une frame plus tard**
sur un arbre DOM déjà démonté. C'est la source classique des `TypeError: Cannot read
properties of null` au changement de route. Le remède est de laisser le conteneur
en place jusqu'à l'événement `Phaser.Core.Events#DESTROY`, ou de ne pas démonter le
composant hôte dans la même tâche que la navigation.

**(b) `removeCanvas` vs `noReturn`.** Les templates appellent `destroy(true)`, donc
`removeCanvas = true`, `noReturn = false`. C'est le bon choix ici : `noReturn = true`
détruit les plugins globaux de Phaser et, selon la doc, « You cannot create another
instance of Phaser on the same web page if you do this ». Comme BetaBounce recrée un jeu
à chaque case, **`noReturn` doit rester `false`**.

**(c) Ce que `runDestroy` nettoie effectivement :**

```js
runDestroy: function ()
{
    this.scene.destroy();
    this.events.emit(Events.DESTROY);
    this.events.removeAllListeners();
    if (this.renderer) { this.renderer.destroy(); }
    if (this.removeCanvas && this.canvas) { ... }
    this.loop.destroy();
    this.pendingDestroy = false;
}
```

Le `loop.destroy()` est ce qui annule le `requestAnimationFrame`. Tant qu'il n'a pas
tourné, **la RAF continue**.

### Les fuites, une par une

**Contexte WebGL — le point le plus sérieux.**
`WebGLRenderer.destroy()` détruit les wrappers de buffers, framebuffers, programmes et
textures, retire les écouteurs `webglcontextlost` / `webglcontextrestored`, puis met
`this.gl = null`. Mais **il n'appelle jamais `WEBGL_lose_context.loseContext()`** :

```js
destroy: function ()
{
    this.off(Events.RESIZE, ...);
    this.canvas.removeEventListener('webglcontextlost', this.contextLostHandler, false);
    this.canvas.removeEventListener('webglcontextrestored', this.contextRestoredHandler, false);
    ArrayEach(this.glBufferWrappers, wrapperDestroy);
    ArrayEach(this.glFramebufferWrappers, wrapperDestroy);
    ArrayEach(this.glProgramWrappers, wrapperDestroy);
    ArrayEach(this.glTextureWrappers, wrapperDestroy);
    this.removeAllListeners();
    this.extensions = {};
    this.gl = null;
    this.game = null;
    this.canvas = null;
    this.contextLost = true;
}
```
([src/renderer/webgl/WebGLRenderer.js, v4.2.1](https://github.com/phaserjs/phaser/blob/v4.2.1/src/renderer/webgl/WebGLRenderer.js))

Le contexte n'est donc libéré que lorsque le `<canvas>` est ramassé par le GC — moment
non déterministe. Or les navigateurs plafonnent le nombre de contextes vivants.

Dans Chromium, `WebGLRenderingContextBase::ActivateContext` évince le plus ancien dès
que le plafond est atteint :

```cpp
unsigned max_gl_contexts = CurrentMaxGLContexts();
unsigned removed_contexts = 0;
while (ActiveContexts().size() >= max_gl_contexts &&
       removed_contexts < max_gl_contexts) {
  ForciblyLoseOldestContext(
      "WARNING: Too many active WebGL contexts. Oldest context will be lost.");
  removed_contexts++;
}
```
([blink/renderer/modules/webgl/webgl_rendering_context_base.cc](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/third_party/blink/renderer/modules/webgl/webgl_rendering_context_base.cc))

La valeur du plafond vient de `WebglPreferences` et est ajustable par le drapeau
`--max-active-webgl-contexts` ; l'ordre de grandeur retenu par Chromium est 16 sur
desktop, 8 sur Android
([Chromium issue 40543269](https://issues.chromium.org/issues/40543269)).

Firefox est plus permissif : `webgl.max-contexts = 1000`,
`webgl.max-contexts-per-principal = 300`
([StaticPrefList.yaml](https://searchfox.org/mozilla-central/source/modules/libpref/init/StaticPrefList.yaml)).

Avec un plafond à 16 et un cycle par déplacement de case, un joueur qui traverse
vingt cases sans que le GC soit passé perd son contexte en cours de partie. **C'est
notre risque n°1.** MDN recommande explicitement le geste manquant :

> « Consider also eagerly losing WebGL contexts via the `WEBGL_lose_context` extension
> when you're definitely done with them and no longer need the target canvas's rendering
> results. »
> ([MDN WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices))

**Mitigation recommandée** — deux options, la seconde préférable :

- Écouter `Phaser.Core.Events#DESTROY`, récupérer le canvas avant qu'il ne soit détaché
  et appeler `gl.getExtension('WEBGL_lose_context').loseContext()` explicitement.
- **Ou ne pas détruire du tout** : garder une instance `Phaser.Game` unique pour toute la
  session, la mettre en pause (`game.loop.sleep()` / `scene.stop()`) quand la SPA quitte
  l'écran de jeu, et masquer le conteneur en CSS. Zéro cycle de contexte, zéro re-preload
  d'assets, et le coût est un canvas résident. Vu que le flipper est le seul écran
  Phaser du site et qu'on y revient sans cesse, c'est le meilleur compromis.

**Écouteurs `document` / `window` non retirés.**
`VisibilityHandler` pose `document.addEventListener(hiddenVar, onChange, false)` avec un
`onChange` local non conservé, et écrase `window.onblur` / `window.onfocus`. **Aucun
chemin de retrait n'existe** : le handler ne peut pas être enlevé, et il retient
`game.events` par fermeture
([src/core/VisibilityHandler.js, v4.2.1](https://github.com/phaserjs/phaser/blob/v4.2.1/src/core/VisibilityHandler.js)).
Chaque `new Phaser.Game()` ajoute donc un écouteur `visibilitychange` permanent. Argument
supplémentaire pour l'instance unique.

À l'inverse, `ScaleManager` fait correctement son ménage : `removeListeners()` retire
`resize`, `orientationchange`, `fullscreenchange`, `fullscreenerror`
([src/scale/ScaleManager.js](https://github.com/phaserjs/phaser/blob/v4.2.1/src/scale/ScaleManager.js)).

**Écouteurs de l'`EventBus`.**
Fuite applicative, pas Phaser : voir §1. Tout `EventBus.on()` posé par la SPA doit avoir
son `EventBus.off()` dans le démontage. Le `removeAllListeners()` de `runDestroy` ne
concerne que `game.events`, pas le bus externe.

**RAF.** Annulée par `loop.destroy()` dans `runDestroy`, donc à la frame suivant l'appel
à `destroy()`. Pas de fuite si on laisse la frame passer.

**Textures.** `runDestroy` → `renderer.destroy()` → `glTextureWrappers` détruits, et le
`TextureManager` est détruit avec le jeu. Correct côté GPU **à condition** que le
contexte soit effectivement rendu. Sinon les textures restent dans un contexte fantôme.

### Checklist de démontage

- [ ] `game.destroy(true)` avec `noReturn` laissé à `false`.
- [ ] Ne pas retirer le conteneur DOM dans la même tâche ; attendre `DESTROY`.
- [ ] `EventBus.off(...)` pour chaque `on(...)` posé par la SPA.
- [ ] `WEBGL_lose_context.loseContext()` explicite sur `DESTROY`.
- [ ] Mettre la référence `game` à `null`.
- [ ] Vérifier en dev que le compteur de contextes WebGL ne croît pas (DevTools →
      Memory, ou compter les avertissements « Too many active WebGL contexts »).

---

## 3. Communication SPA ↔ scène Phaser

### Les mécanismes disponibles

**(a) `Phaser.Events.EventEmitter` externe — le patron officiel.**
C'est le seul que les templates documentent. Un singleton de module, importé des deux
côtés :

```ts
// depuis la SPA
EventBus.emit('start-game', { seed, dungeonCell });
// depuis une scène
EventBus.on('start-game', (payload) => { ... });
```

Le README React précise l'obligation dans l'autre sens : « When you add a new Scene to
your game, make sure you expose to React by emitting the `"current-scene-ready"` event
via the `EventBus` »
([README template-react-ts](https://github.com/phaserjs/template-react-ts/blob/main/README.md)).

Avantages : découplé, aucune dépendance du jeu envers le framework, testable sans DOM.
Inconvénients : non typé par défaut, aucun cycle de vie, aucune garantie que l'écouteur
soit posé avant l'émission.

**(b) Le Registry (`game.registry`).**
Data Manager appartenant à l'instance `Game` ; la doc indique « Any data set into the
registry in one Scene is instantly available in all other Scenes in your game » et le
présente comme l'endroit pour « global data, such as highscores, level data, settings »
([Data Manager](https://docs.phaser.io/phaser/concepts/data-manager)). Accessible depuis
la SPA via `game.registry.set(...)` / `.get(...)`, et depuis une scène via
`this.registry`. C'est le bon véhicule pour les **paramètres d'entrée** d'une partie
(graine, case du donjon, modificateurs) : il survit aux transitions de scènes et n'a pas
de problème d'ordonnancement.

**(c) `this.data` de scène.** Portée locale à la scène. Utile en interne, sans intérêt
pour la frontière.

**(d) `game.events` / `scene.events`.** Émetteurs internes. `game.events` est vidé par
`runDestroy` (`this.events.removeAllListeners()`), donc pas d'accumulation, mais il est
détruit avec le jeu — il ne peut pas porter le résultat *après* la destruction.

**(e) `scene.scene.start(key, data)`.** Passe un objet à `init(data)` / `create(data)`
de la scène cible. C'est le canal propre pour démarrer une partie depuis la SPA une fois
le jeu déjà en vie.

### Recommandation pour BetaBounce

Le besoin est asymétrique et il faut le traiter comme tel.

**Entrer dans une partie** — paramètres bien définis, une seule fois, avant tout rendu.
Utiliser le **Registry** puis `scene.start('Pinball')`, plutôt que l'`EventBus`. Pas de
course entre l'émission et la pose de l'écouteur :

```ts
game.registry.set('run', { seed, cellId, modifiers });
game.scene.start('Pinball');
```

**Sortir d'une partie** — un événement unique, terminal, qui porte score **et** trace
d'entrées. L'`EventBus` convient, mais il faut le **typer** ; le `EventEmitter` nu des
templates ne l'est pas. Enrober :

```ts
// shared/ — le contrat vit dans le paquet partagé, pas dans le client
export interface RunResult {
  readonly seed: string;
  readonly cellId: string;
  readonly score: number;
  readonly inputs: readonly InputEvent[];   // pour le rejeu serveur
  readonly durationMs: number;
}
```

Placer ce type dans `shared` est structurant : c'est **le même contrat** que le serveur
utilise pour rejouer la partie. La frontière SPA ↔ Phaser devient alors la frontière
client ↔ serveur, ce qui évite une double définition.

### Point d'attention rejeu : Phaser n'est pas déterministe par défaut

Rien dans Phaser n'enregistre les entrées ; la capture est à écrire. Plus gênant, le pas
de temps est variable et **lissé** : `TimeStep` calcule un delta réel et applique par
défaut `fps.smoothStep = true`
([src/core/TimeStep.js](https://github.com/phaserjs/phaser/blob/v4.2.1/src/core/TimeStep.js)).
Deux exécutions avec les mêmes entrées ne produisent pas la même trajectoire de bille.

Pour qu'un rejeu serveur ait un sens, la simulation du flipper doit tourner à **pas fixe**
et être découplée du rendu : un module de simulation dans `shared`, avancé par pas
constants, que Phaser se contente de dessiner. Les entrées sont horodatées en **numéro de
pas**, pas en millisecondes. C'est une décision d'architecture plus lourde que le choix du
framework SPA, et elle est indépendante de lui.

---

## 4. Poids dans le bundle

### Chiffres mesurés

Fichiers `dist` téléchargés depuis npm et compressés localement (`gzip -9`,
`brotli -q 11`), le 2026-08-07 :

| Build | brut (min) | gzip -9 | brotli -11 |
|---|---:|---:|---:|
| **phaser 4.2.1** `phaser.esm.min.js` | 1 377 611 o (1,31 Mio) | **353 168 o (345 Kio)** | 283 365 o (277 Kio) |
| phaser 4.2.1 `phaser-arcade-physics.min.js` | 1 266 396 o | 319 641 o (312 Kio) | 256 037 o |
| phaser 3.90.0 `phaser.esm.min.js` | 1 197 130 o | 315 560 o (308 Kio) | 253 139 o |
| phaser 3.90.0 `phaser-arcade-physics.min.js` | 1 086 308 o | 282 279 o | 226 234 o |

Deux enseignements : Phaser 4 est **~12 % plus lourd** que Phaser 3.90 (nouveau renderer
Beam), et le build « arcade physics only » ne fait gagner que ~10 % — il retire Matter,
pas grand-chose d'autre.

**Ordre de grandeur à retenir : ~345 Kio gzip, ~277 Kio brotli.** C'est plus lourd
qu'Angular + Router, plus lourd que React + React-DOM. Phaser sera le plus gros artefact
du site.

### Le tree-shaking ne marchera pas

Le `package.json` de Phaser 4.2.1
([source](https://github.com/phaserjs/phaser/blob/v4.2.1/package.json)) :

```json
"main": "./src/phaser.js",
"types": "./types/phaser.d.ts",
"browser": "./dist/phaser.js",
"module": "./dist/phaser.esm.js",
"exports": {
  ".": {
    "types": "./types/phaser.d.ts",
    "import": "./dist/phaser.esm.js",
    "require": "./dist/phaser.js",
    "default": "./dist/phaser.esm.js"
  }
}
```

Un `import Phaser from 'phaser'` résout vers `dist/phaser.esm.js`, un **bundle pré-agrégé
de 1,31 Mio**. Il n'y a **aucun champ `sideEffects`** dans le manifeste. Vite, Rollup,
esbuild et le builder Angular ne peuvent donc rien élaguer : ils recopient le fichier.

La seule voie de réduction est le **custom build** : un point d'entrée webpack qui
importe module par module depuis `src/`, comme le décrit
[`phaserjs/custom-build`](https://github.com/phaserjs/custom-build). Les chiffres annoncés
par ce dépôt sont spectaculaires — d'un défaut de 980 Ko minifié à « 122 KB min+gz » pour
sprites + loader, « 113 KB min+gz » pour un loader restreint. Mais le dépôt cible
**Phaser 3.50** et fonctionne par assemblage manuel des modules, sans drapeaux de features.
Sur Phaser 4, dont l'architecture de rendu a été entièrement remplacée, sa transposition
n'est pas acquise. **À ne pas mettre au planning initial** ; à garder comme levier si le
poids devient bloquant.

### Il faut charger Phaser paresseusement

Puisqu'on ne peut pas alléger Phaser, il faut le **retirer du chemin critique**. C'est
non négociable : le profil, les quêtes et la carte du donjon ne doivent pas payer 345 Kio
pour un écran que le joueur n'a pas encore ouvert.

Tous les frameworks candidats le permettent via `import()` dynamique. Côté Angular, deux
mécanismes officiels :

- **Route paresseuse** : `{ path: 'flipper', loadComponent: () => import('./flipper/flipper-page') }`.
  La doc indique que « Lazily loading routes can significantly improve the load speed of
  your Angular application by removing large portions of JavaScript from the initial
  bundle », le code compilant vers des « chunks » demandés seulement à la visite
  ([Route Loading Strategies](https://angular.dev/guide/routing/loading-strategies)).
- **`@defer`** : « `@defer` blocks reduce the initial bundle size of your application by
  deferring the loading of code that is not strictly necessary for the initial rendering
  of a page », avec des déclencheurs `on viewport`, `on interaction`, `on idle`, `when`
  ([Deferrable views](https://angular.dev/guide/templates/defer)). Contrainte : les
  dépendances doivent être **standalone** et ne pas être référencées hors du bloc
  (ni dans un `ViewChild`).

Combinaison recommandée : route paresseuse pour l'écran flipper, plus un préchargement
déclenché quand le joueur survole/sélectionne une case adjacente sur la carte. Le
téléchargement de 345 Kio se fait alors pendant que le joueur regarde la carte, pas quand
il clique.

---

## 5. Angular : zone.js, `runOutsideAngular`, signals

C'était historiquement l'argument massue contre Angular pour du jeu. **Il ne tient
presque plus.**

### Le problème historique

zone.js monkey-patche `requestAnimationFrame`, `setTimeout` et les écouteurs DOM. Phaser
tourne sa boucle sur RAF ~60 fois par seconde ; sous zone.js, chaque frame déclenchait un
cycle de détection de changements sur toute l'application. Le remède documenté est
`NgZone.runOutsideAngular` : « Running functions via `runOutsideAngular` allows you to
escape Angular's zone and do work that doesn't trigger Angular change-detection or is
subject to Angular's error handling »
([API NgZone](https://angular.dev/api/core/NgZone)).

Le patron classique reste valable et coûte trois lignes :

```ts
private readonly zone = inject(NgZone);
ngOnInit() {
  this.zone.runOutsideAngular(() => { this.game = StartGame('game-container'); });
}
```

Il faut alors repasser dans la zone (`zone.run(...)`) pour livrer le résultat de fin de
partie à la SPA — ou ne rien faire du tout si l'application est zoneless.

### L'état actuel : zoneless par défaut

- `@angular/core` est en **22.1.0**, et `zone.js` y est déclaré **peer dependency
  optionnelle** (`"zone.js": "~0.15.0 || ~0.16.0"`, optionnel)
  ([registry npm](https://registry.npmjs.org/@angular/core/latest)).
- La doc [Zoneless](https://angular.dev/guide/zoneless) indique que **zoneless est le
  défaut depuis Angular v21** ; en v20 il fallait `provideZonelessChangeDetection()`
  explicitement, en v21+ c'est acquis sauf `provideZoneChangeDetection()` explicite.
- La doc recommande de **retirer zone.js du build** (le supprimer d'`angular.json` et
  désinstaller le paquet) pour réduire la taille du bundle.
- `NgZone.run` / `runOutsideAngular` **restent compatibles** en zoneless ; la doc
  avertit même que « removing these calls can lead to performance regressions for
  libraries that are used in applications that still rely on ZoneJS ».

En zoneless, la détection de changements est pilotée par les signals et les événements de
template. **La boucle RAF de Phaser ne déclenche plus rien.** Le conflit historique
disparaît par construction.

### Conséquence pratique

Sur un projet neuf en Angular 22 :

1. Bootstrapper zoneless (c'est le défaut), retirer `zone.js` des dépendances.
2. Exposer l'état du jeu à la SPA par des **signals** (`signal<RunResult | null>(null)`),
   alimentés depuis le callback de l'`EventBus`. Un `set()` sur un signal notifie Angular
   correctement, sans zone.
3. Garder `runOutsideAngular` autour de la création du jeu **par prudence** — coût nul,
   et cela protège si une dépendance réintroduit zone.js.

Le template officiel Angular, lui, est en Angular 19 avec `zone.js` en dépendance directe
et ne fait **aucun** `runOutsideAngular` : il ne reflète pas cet état de l'art. Raison de
plus pour ne pas s'en servir tel quel.

---

## 6. Recommandation

**Choisir Angular 22, zoneless, avec un composant hôte Phaser écrit à la main.**

**Pourquoi.** Les quatre templates officiels démontrent la même chose : un `<div>`, un
`EventEmitter` global de trois lignes, `new Phaser.Game()` au montage, `destroy(true)` au
démontage. **Phaser n'a aucune adhérence au framework SPA.** Le critère « quel framework
s'intègre proprement » n'a donc pas de gagnant technique, et il faut trancher sur autre
chose : la connaissance du dev. Elle est du côté d'Angular. Le seul argument qui
disqualifiait Angular pour du jeu — zone.js patchant RAF et déclenchant une détection de
changements à chaque frame — a disparu : zoneless est le défaut depuis Angular v21 et
`zone.js` est désormais une peer dependency optionnelle. Le reste de BetaBounce (profil,
quêtes, carte, routage, formulaires) est exactement ce pour quoi Angular est outillé en
première partie, sans arbitrage de bibliothèques tierces.

**Ce qu'on ne prend pas.** React a le template le mieux écrit, mais l'avantage vaut ~40
lignes qu'on réécrit de toute façon, et son piège StrictMode s'ajoute au reste. Svelte a
le template le plus dangereux (aucune destruction du jeu) et SvelteKit impose de gérer le
SSR pour un écran qui n'a aucun besoin de SSR. Vue n'a qu'un template JavaScript, à
convertir.

**Coût.** Réécrire le composant hôte (~1 jour, y compris la libération explicite du
contexte WebGL). Ne pas partir de `template-angular` : il est en Angular 19, Phaser 4.0.0,
zone.js, et fuit un écouteur `EventBus` à chaque démontage. En reprendre uniquement l'idée
de `StartGame(parentId)` et les scènes d'exemple. Phaser pèse **345 Kio gzip / 277 Kio
brotli** (mesuré sur 4.2.1) et **n'est pas tree-shakable** : le paquet n'expose qu'un
bundle ESM pré-agrégé et ne déclare pas `sideEffects`. Il faut donc une route paresseuse
`loadComponent` pour l'écran flipper, avec préchargement au survol d'une case adjacente.

**Risques, par ordre de gravité.**
1. **Contextes WebGL.** `WebGLRenderer.destroy()` de Phaser 4.2.1 n'appelle pas
   `loseContext()`, et Chromium évince le plus ancien contexte au-delà de ~16. Avec un
   cycle par déplacement de case, la limite est atteignable en une session. Mitigation
   retenue : **une seule instance `Phaser.Game` pour toute la session**, mise en pause et
   masquée hors de l'écran de jeu, plutôt que créée/détruite. Cela règle du même coup la
   fuite non contournable de `VisibilityHandler` (écouteur `visibilitychange` jamais
   retiré) et le coût de re-preload des assets.
2. **Déterminisme du rejeu.** Phaser tourne à pas de temps variable et lissé
   (`fps.smoothStep = true` par défaut). Le rejeu serveur exige une simulation à pas fixe,
   placée dans `shared`, que Phaser se contente de dessiner ; les entrées horodatées en
   numéro de pas. Ce chantier est indépendant du framework SPA mais plus lourd que lui —
   à traiter en priorité.
3. **Templates officiels périmés.** Tous sur Phaser 4.0.0 (courant : 4.2.1), READMEs
   incohérents avec leurs `package.json`, dernier push avril 2026. Les traiter comme de
   la documentation, pas comme une base de code.
