// PROTOTYPE JETABLE — ticket #7 « la sensation du flipper ».
//
// Question : la gravité, la restitution, la vitesse de la balle et la longueur des
// batteurs donnent-elles une sensation juste — et combien de temps dure une partie
// à trois balles sur un socle nu ?
//
// Moteur : @dimforge/rapier2d-deterministic-compat, le build retenu en #2 (variante
// -compat : même moteur, wasm en base64, aucune config Vite à écrire). Rendu en
// canvas 2D, pas Phaser : #3 a tranché que Phaser ne fait que du rendu, il n'a donc
// rien à dire sur la sensation et ne ferait qu'alourdir le prototype.
//
// Pas de score, pas de module : le socle est nu, choix explicite du dev sur le ticket.

import RAPIER from '@dimforge/rapier2d-deterministic-compat';
import {
  construireSocle,
  anglesBatteur,
  impulsionLanceur,
  margesEffectives,
  livrer,
  HAUTEUR,
  LARGEUR,
  LARGEUR_LANCEUR,
  type Reglages,
  type Socle,
} from './socle.ts';
import { creerMonde } from './monde.ts';
import {
  creerEtat,
  rearmerKickback,
  appliquer as appliquerMecanismes,
  type EtatMecanismes,
} from './mecanismes.ts';
import { VARIANTS } from './variants.ts';

await RAPIER.init();

const PAS = 1 / 240;
const BALLES_PAR_PARTIE = 3;

const canvas = document.getElementById('table') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const echelle = canvas.height / HAUTEUR;

// ---------------------------------------------------------------- état de la partie

let variantIndex = Math.max(
  0,
  VARIANTS.findIndex((v) => v.cle === (new URLSearchParams(location.search).get('variant') ?? 'A')),
);
let reglages: Reglages = { ...VARIANTS[variantIndex].reglages };

let socle: Socle;
let monde: any;
let balle: any;
let batteurG: any;
let batteurD: any;
let mecanismes: EtatMecanismes;

const batteurs = {
  gauche: { angle: 0, cible: 0, repos: 0, haut: 0 },
  droit: { angle: 0, cible: 0, repos: 0, haut: 0 },
};

let numeroBalle = 1;
let durees: number[] = [];
let chronoBalle = 0;
let enJeu = false; // la balle a quitté le lanceur
let charge = 0;
let chargeEnCours = false;
let immobileDepuis = 0;
const trainee: [number, number][] = [];

// ---------------------------------------------------------------- construction monde

function construireMonde(pos?: { x: number; y: number }, vel?: { x: number; y: number }) {
  socle = construireSocle(reglages);

  const a = anglesBatteur(reglages);
  batteurs.gauche.repos = a.gaucheRepos;
  batteurs.gauche.haut = a.gaucheHaut;
  batteurs.droit.repos = a.droitRepos;
  batteurs.droit.haut = a.droitHaut;
  if (!batteurs.gauche.angle) batteurs.gauche.angle = a.gaucheRepos;
  if (!batteurs.droit.angle) batteurs.droit.angle = a.droitRepos;
  batteurs.gauche.cible = batteurs.gauche.repos;
  batteurs.droit.cible = batteurs.droit.repos;

  const m = creerMonde(
    RAPIER,
    reglages,
    socle,
    PAS,
    pos ?? { x: socle.departBalle[0], y: socle.departBalle[1] },
    vel,
    { gauche: batteurs.gauche.angle, droit: batteurs.droit.angle },
  );
  monde = m.monde;
  balle = m.balle;
  batteurG = m.batteurG;
  batteurD = m.batteurD;
  // Le kickback survit à une reconstruction en cours de balle : on ne rend pas un
  // rattrapage déjà consommé parce qu'on a bougé un curseur.
  const dispo = mecanismes?.kickbackDispo ?? true;
  mecanismes = creerEtat(socle);
  mecanismes.kickbackDispo = dispo;
  trainee.length = 0;
}

function rejouer() {
  numeroBalle = 1;
  durees = [];
  chronoBalle = 0;
  enJeu = false;
  construireMonde();
  rearmerKickback(mecanismes);
}

function balleSuivante() {
  durees.push(chronoBalle);
  chronoBalle = 0;
  enJeu = false;
  numeroBalle = Math.min(numeroBalle + 1, BALLES_PAR_PARTIE + 1);
  if (numeroBalle > BALLES_PAR_PARTIE) return; // partie finie, on laisse le HUD parler
  balle.setTranslation({ x: socle.departBalle[0], y: socle.departBalle[1] }, true);
  balle.setLinvel({ x: 0, y: 0 }, true);
  balle.setAngvel(0, true);
  rearmerKickback(mecanismes);
  trainee.length = 0;
}

// ---------------------------------------------------------------------- entrées

const touches = new Set<string>();

addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (k === ' ') {
    e.preventDefault();
    chargeEnCours = true;
  }
  if (k === 'r') rejouer();
  if (k === 'n') secouer();
  if (k === '1' || k === '2' || k === '3') choisirVariant(Number(k) - 1);
  if (['arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
  touches.add(k);
});

addEventListener('keyup', (e) => {
  const k = e.key.toLowerCase();
  if (k === ' ') lancer();
  touches.delete(k);
});

function gaucheAppuye() {
  return touches.has('arrowleft') || touches.has('q') || touches.has('a') || touches.has('shift');
}
function droitAppuye() {
  return touches.has('arrowright') || touches.has('d') || touches.has('p');
}

function lancer() {
  chargeEnCours = false;
  if (numeroBalle > BALLES_PAR_PARTIE) return;
  const p = balle.translation();
  if (p.x < LARGEUR - LARGEUR_LANCEUR) return; // la balle n'est plus dans le lanceur
  balle.applyImpulse({ x: 0, y: impulsionLanceur(reglages, socle, charge) }, true);
  charge = 0;
  enJeu = true;
}

function secouer() {
  balle.applyImpulse({ x: (Math.random() - 0.5) * 0.02, y: 0.012 }, true);
}

// ---------------------------------------------------------------------- boucle

let dernier = performance.now();
let reste = 0;

function boucle(maintenant: number) {
  const dt = Math.min(0.05, (maintenant - dernier) / 1000);
  dernier = maintenant;

  if (chargeEnCours) charge = Math.min(1, charge + dt / 0.9);

  batteurs.gauche.cible = gaucheAppuye() ? batteurs.gauche.haut : batteurs.gauche.repos;
  batteurs.droit.cible = droitAppuye() ? batteurs.droit.haut : batteurs.droit.repos;

  reste += dt;
  while (reste >= PAS) {
    avancer(PAS);
    reste -= PAS;
  }

  dessiner();
  majHud();
  requestAnimationFrame(boucle);
}

function avancer(pas: number) {
  for (const [b, corps] of [
    [batteurs.gauche, batteurG],
    [batteurs.droit, batteurD],
  ] as const) {
    const delta = b.cible - b.angle;
    const max = reglages.vitesseBatteur * pas;
    b.angle += Math.max(-max, Math.min(max, delta));
    corps.setNextKinematicRotation(b.angle);
  }

  monde.step();
  appliquerMecanismes(reglages, socle, balle, mecanismes, pas);
  if (livrer(socle, balle)) enJeu = true;

  const p = balle.translation();
  const v = balle.linvel();
  const vitesse = Math.hypot(v.x, v.y);

  if (enJeu) chronoBalle += pas;

  if (p.y < -0.04) {
    if (numeroBalle <= BALLES_PAR_PARTIE) balleSuivante();
    return;
  }

  // Sortie du lanceur : à partir de là, la balle est en jeu.
  if (!enJeu && p.x < LARGEUR - LARGEUR_LANCEUR - 0.01) enJeu = true;

  // Anti-blocage : une balle coincée fausse toute mesure de durée.
  if (enJeu && vitesse < 0.02) {
    immobileDepuis += pas;
    if (immobileDepuis > 3) {
      secouer();
      immobileDepuis = 0;
    }
  } else {
    immobileDepuis = 0;
  }

  if (trainee.length === 0 || Math.hypot(p.x - trainee[0][0], p.y - trainee[0][1]) > 0.004) {
    trainee.unshift([p.x, p.y]);
    if (trainee.length > 14) trainee.pop();
  }
}

// ---------------------------------------------------------------------- rendu

const X = (x: number) => x * echelle;
const Y = (y: number) => canvas.height - y * echelle;

function dessiner() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // zone de drain
  ctx.fillStyle = '#1a1013';
  ctx.fillRect(0, Y(0.02), canvas.width, canvas.height - Y(0.02));

  ctx.strokeStyle = '#3a4150';
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  for (const ligne of socle.murs) {
    ctx.beginPath();
    ligne.forEach(([x, y], i) => (i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y))));
    ctx.stroke();
  }
  // La glissière filaire n'est pas un mur simulé : on la trace en pointillé pour que
  // le chemin de la balle entre le haut du couloir et le point de dépose se lise.
  ctx.save();
  ctx.setLineDash([5, 6]);
  ctx.strokeStyle = '#2f3540';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(X(LARGEUR - LARGEUR_LANCEUR / 2), Y(socle.hauteurSortie));
  ctx.quadraticCurveTo(
    X(socle.depose[0] + 0.09),
    Y(socle.hauteurSortie + 0.06),
    X(socle.depose[0]),
    Y(socle.depose[1]),
  );
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = '#3a4150';
  for (const p of socle.poteaux) {
    ctx.beginPath();
    ctx.arc(X(p.x), Y(p.y), p.r * echelle, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const b of socle.bumpers) {
    ctx.fillStyle = '#2b3a4a';
    ctx.beginPath();
    ctx.arc(X(b.x), Y(b.y), b.r * echelle, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#4d6b86';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Les pièces qui poussent doivent se distinguer des murs qui subissent.
  if (reglages.slingshotsActifs && reglages.forceSlingshot > 0) {
    ctx.strokeStyle = '#c05a4a';
    ctx.lineWidth = 4;
    for (const f of socle.facesSling) {
      ctx.beginPath();
      ctx.moveTo(X(f.a[0]), Y(f.a[1]));
      ctx.lineTo(X(f.b[0]), Y(f.b[1]));
      ctx.stroke();
    }
  }
  if (reglages.kickback && reglages.forceKickback > 0) {
    ctx.fillStyle = mecanismes.kickbackDispo ? 'rgba(192,90,74,.35)' : 'rgba(80,88,100,.18)';
    for (const c of socle.couloirs) {
      ctx.fillRect(X(c.xMin), Y(c.y), (c.xMax - c.xMin) * echelle, c.y * echelle);
    }
  }

  dessinerBatteur(socle.pivotGauche, batteurs.gauche.angle);
  dessinerBatteur(socle.pivotDroit, batteurs.droit.angle);

  trainee.forEach(([x, y], i) => {
    ctx.globalAlpha = (1 - i / trainee.length) * 0.35;
    ctx.fillStyle = '#7fa8d8';
    ctx.beginPath();
    ctx.arc(X(x), Y(y), reglages.rayonBalle * echelle * (1 - i / trainee.length / 1.5), 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  const p = balle.translation();
  const grad = ctx.createRadialGradient(
    X(p.x) - 4, Y(p.y) - 4, 1,
    X(p.x), Y(p.y), reglages.rayonBalle * echelle,
  );
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(1, '#9aa6b8');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(X(p.x), Y(p.y), reglages.rayonBalle * echelle, 0, Math.PI * 2);
  ctx.fill();

  if (charge > 0) {
    ctx.fillStyle = '#d6a45a';
    const h = charge * 90;
    ctx.fillRect(canvas.width - 10, Y(0.02) - h, 5, h);
  }

  if (numeroBalle > BALLES_PAR_PARTIE) {
    ctx.fillStyle = 'rgba(10,11,14,.82)';
    ctx.fillRect(0, canvas.height / 2 - 70, canvas.width, 140);
    ctx.fillStyle = '#e6e8ec';
    ctx.textAlign = 'center';
    ctx.font = '600 22px ui-sans-serif, system-ui, sans-serif';
    ctx.fillText('Partie terminée', canvas.width / 2, canvas.height / 2 - 16);
    ctx.font = '15px ui-sans-serif, system-ui, sans-serif';
    ctx.fillStyle = '#d6a45a';
    ctx.fillText(
      `${durees.reduce((a, b) => a + b, 0).toFixed(1).replace('.', ',')} s pour trois balles`,
      canvas.width / 2,
      canvas.height / 2 + 12,
    );
    ctx.fillStyle = '#8d95a3';
    ctx.font = '13px ui-sans-serif, system-ui, sans-serif';
    ctx.fillText('R pour rejouer', canvas.width / 2, canvas.height / 2 + 40);
  }
}

function dessinerBatteur(pivot: [number, number], angle: number) {
  const [px, py] = pivot;
  const bx = px + Math.cos(angle) * reglages.longueurBatteur;
  const by = py + Math.sin(angle) * reglages.longueurBatteur;

  // L'indulgence en pointillé : c'est la différence entre ce que le joueur voit et ce
  // que le moteur touche. Elle doit être visible ici, sinon on règle à l'aveugle.
  const marges = margesEffectives(reglages);
  if (marges.epaisseur > 0 || marges.longueur > 0) {
    const gx = px + Math.cos(angle) * (reglages.longueurBatteur + marges.longueur);
    const gy = py + Math.sin(angle) * (reglages.longueurBatteur + marges.longueur);
    ctx.save();
    ctx.setLineDash([3, 4]);
    ctx.strokeStyle = 'rgba(214,164,90,.35)';
    ctx.lineWidth = (reglages.rayonBatteur + marges.epaisseur) * 2 * echelle;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(X(px), Y(py));
    ctx.lineTo(X(gx), Y(gy));
    ctx.stroke();
    ctx.restore();
  }

  ctx.strokeStyle = '#d6a45a';
  ctx.lineWidth = reglages.rayonBatteur * 2 * echelle;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(X(px), Y(py));
  ctx.lineTo(X(bx), Y(by));
  ctx.stroke();
  ctx.fillStyle = '#14161a';
  ctx.beginPath();
  ctx.arc(X(px), Y(py), 3, 0, Math.PI * 2);
  ctx.fill();
}

// ------------------------------------------------------------------------- HUD

const hudBall = document.getElementById('hud-ball')!;
const hudTotal = document.getElementById('hud-total')!;
const hudChips = document.getElementById('hud-chips')!;
const hudSpeed = document.getElementById('hud-speed')!;

const secondes = (s: number) => `${s.toFixed(1).replace('.', ',')} s`;

function majHud() {
  const fini = numeroBalle > BALLES_PAR_PARTIE;
  hudBall.innerHTML = fini ? '—' : `${numeroBalle}&thinsp;/&thinsp;${BALLES_PAR_PARTIE}`;
  hudTotal.textContent = secondes(durees.reduce((a, b) => a + b, 0) + chronoBalle);

  hudChips.innerHTML = '';
  for (let i = 0; i < BALLES_PAR_PARTIE; i++) {
    const el = document.createElement('div');
    el.className = 'ball-chip' + (i < durees.length ? ' done' : i === durees.length && !fini ? ' live' : '');
    el.textContent = i < durees.length ? secondes(durees[i]) : i === durees.length && !fini ? secondes(chronoBalle) : '—';
    hudChips.append(el);
  }

  const v = balle.linvel();
  hudSpeed.textContent = `${Math.hypot(v.x, v.y).toFixed(2).replace('.', ',')} m/s`;
}

// --------------------------------------------------------------------- curseurs

type Curseur = {
  cle: keyof Reglages;
  nom: string;
  min: number;
  max: number;
  pas: number;
  fmt: (v: number) => string;
};

const mm = (v: number) => `${Math.round(v * 1000)} mm`;
const brut = (v: number) => v.toFixed(2).replace('.', ',');

const CURSEURS: Curseur[] = [
  { cle: 'penteDeg', nom: 'Pente de la machine', min: 2, max: 12, pas: 0.25, fmt: (v) => `${brut(v)}°` },
  { cle: 'restitutionMur', nom: 'Restitution des murs', min: 0, max: 0.7, pas: 0.01, fmt: brut },
  { cle: 'restitutionBatteur', nom: 'Restitution des batteurs', min: 0, max: 0.7, pas: 0.01, fmt: brut },
  { cle: 'frottement', nom: 'Frottement', min: 0, max: 0.6, pas: 0.01, fmt: brut },
  { cle: 'rayonBalle', nom: 'Rayon de la balle', min: 0.009, max: 0.019, pas: 0.0005, fmt: mm },
  { cle: 'masseBalle', nom: 'Masse de la balle', min: 0.03, max: 0.16, pas: 0.005, fmt: (v) => `${Math.round(v * 1000)} g` },
  { cle: 'forceLanceur', nom: 'Force du lanceur', min: 0.95, max: 1.6, pas: 0.01, fmt: (v) => `×${brut(v)}` },
  { cle: 'longueurBatteur', nom: 'Longueur des batteurs', min: 0.045, max: 0.105, pas: 0.001, fmt: mm },
  { cle: 'ecartBatteurs', nom: 'Écart pointe à pointe', min: 0.018, max: 0.095, pas: 0.001, fmt: mm },
  { cle: 'hauteurBatteurs', nom: 'Hauteur des pivots', min: 0.1, max: 0.24, pas: 0.002, fmt: mm },
  { cle: 'angleReposDeg', nom: 'Angle au repos', min: 8, max: 46, pas: 1, fmt: (v) => `${v}°` },
  { cle: 'angleHautDeg', nom: 'Angle relevé', min: 4, max: 46, pas: 1, fmt: (v) => `${v}°` },
  { cle: 'vitesseBatteur', nom: 'Vitesse des batteurs', min: 8, max: 60, pas: 1, fmt: (v) => `${v} rad/s` },
  { cle: 'margeEpaisseur', nom: 'Indulgence — au ras du batteur', min: 0, max: 0.014, pas: 0.0005, fmt: mm },
  { cle: 'margeLongueur', nom: 'Indulgence — après la pointe', min: 0, max: 0.035, pas: 0.0005, fmt: mm },
  { cle: 'largeurCouloir', nom: 'Largeur du couloir de sortie', min: 0.018, max: 0.08, pas: 0.001, fmt: mm },
  { cle: 'restitutionBumper', nom: 'Restitution des bumpers', min: 0.3, max: 0.95, pas: 0.01, fmt: brut },
  { cle: 'forceSlingshot', nom: 'Frappe des slingshots', min: 0, max: 4, pas: 0.05, fmt: (v) => `${brut(v)} m/s` },
  { cle: 'forceKickback', nom: 'Renvoi du kickback', min: 0, max: 3.5, pas: 0.05, fmt: (v) => `${brut(v)} m/s` },
];

const BASCULES: { cle: keyof Reglages; nom: string }[] = [
  { cle: 'garnissage', nom: 'Bumpers' },
  { cle: 'slingshots', nom: 'Slingshots et couloirs' },
  { cle: 'slingshotsActifs', nom: 'Slingshots actifs (ils frappent)' },
  { cle: 'kickback', nom: 'Kickback (un par balle)' },
  { cle: 'poteauCentral', nom: 'Poteau central' },
];

const boite = document.getElementById('sliders')!;

function construireCurseurs() {
  boite.innerHTML = '';

  const bascules = document.createElement('div');
  bascules.className = 'bascules';
  for (const b of BASCULES) {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = reglages[b.cle] as boolean;
    input.addEventListener('change', () => {
      (reglages[b.cle] as boolean) = input.checked;
      reconstruireSurPlace();
    });
    label.append(input, document.createTextNode(' ' + b.nom));
    bascules.append(label);
  }
  boite.append(bascules);

  for (const c of CURSEURS) {
    const label = document.createElement('label');
    label.className = 'slider';
    label.innerHTML = `<span class="lab"><span>${c.nom}</span><b></b></span>`;
    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(c.min);
    input.max = String(c.max);
    input.step = String(c.pas);
    input.value = String(reglages[c.cle]);
    const sortie = label.querySelector('b')!;
    sortie.textContent = c.fmt(reglages[c.cle] as number);
    input.addEventListener('input', () => {
      (reglages[c.cle] as number) = Number(input.value);
      sortie.textContent = c.fmt(Number(input.value));
      reconstruireSurPlace();
    });
    label.append(input);
    boite.append(label);
  }
}

// Un réglage change la géométrie : on rebâtit le monde mais on garde la balle où
// elle est, pour pouvoir régler en cours de balle sans casser le chrono.
function reconstruireSurPlace() {
  const p = balle.translation();
  const v = balle.linvel();
  construireMonde({ x: p.x, y: p.y }, { x: v.x, y: v.y });
}

// -------------------------------------------------------------------- variants

const nomVariant = document.getElementById('variant-name')!;

function choisirVariant(i: number) {
  variantIndex = (i + VARIANTS.length) % VARIANTS.length;
  reglages = { ...VARIANTS[variantIndex].reglages };
  const url = new URL(location.href);
  url.searchParams.set('variant', VARIANTS[variantIndex].cle);
  history.replaceState(null, '', url);
  majVariant();
  construireCurseurs();
  rejouer();
}

function majVariant() {
  const v = VARIANTS[variantIndex];
  nomVariant.innerHTML = `${v.cle} — ${v.nom} <em>· ${v.resume}</em>`;
}

document.getElementById('prev')!.addEventListener('click', () => choisirVariant(variantIndex - 1));
document.getElementById('next')!.addEventListener('click', () => choisirVariant(variantIndex + 1));
document.getElementById('btn-reset')!.addEventListener('click', rejouer);
document.getElementById('btn-nudge')!.addEventListener('click', secouer);
document.getElementById('btn-defaults')!.addEventListener('click', () => choisirVariant(variantIndex));

// ------------------------------------------------------------------- démarrage

majVariant();
construireCurseurs();
rejouer();
requestAnimationFrame(boucle);
