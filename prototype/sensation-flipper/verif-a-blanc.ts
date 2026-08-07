// PROTOTYPE JETABLE — vérification à blanc sous Node (`npm run verif`).
// Ne juge pas la sensation : vérifie seulement que chaque socle se monte, que la balle
// sort du lanceur, traverse le plateau, que les batteurs la renvoient, et qu'elle finit
// au drain. Sans ça, on livre une page blanche au dev.

import RAPIER from '@dimforge/rapier2d-deterministic-compat';
import {
  construireSocle,
  anglesBatteur,
  impulsionLanceur,
  livrer,
  type Reglages,
} from './src/socle.ts';
import { creerMonde } from './src/monde.ts';
import { VARIANTS } from './src/variants.ts';

await RAPIER.init();

const PAS = 1 / 240;
const LIMITE = 120; // secondes de simulation avant de déclarer la balle coincée

type Resultat = {
  sortiLanceur: boolean;
  hauteurMax: number;
  vitesseMax: number;
  drain: number;
  contactsBatteur: number;
  xMiTable: number;
  fin: [number, number];
};

const trace = process.argv.includes('--trace');

function jouer(r: Reglages, battre: boolean): Resultat {
  const socle = construireSocle(r);
  const a = anglesBatteur(r);
  const { monde, balle, batteurG, batteurD } = creerMonde(
    RAPIER,
    r,
    socle,
    PAS,
    { x: socle.departBalle[0], y: socle.departBalle[1] },
    undefined,
    { gauche: a.gaucheRepos, droit: a.droitRepos },
  );

  balle.applyImpulse({ x: 0, y: impulsionLanceur(r, socle, 0.5) }, true); // mi-course

  let angleG = a.gaucheRepos;
  let angleD = a.droitRepos;
  let t = 0;
  const res: Resultat = {
    sortiLanceur: false,
    hauteurMax: 0,
    vitesseMax: 0,
    drain: -1,
    contactsBatteur: 0,
    xMiTable: -1,
    fin: [0, 0],
  };
  let montait = true;

  while (t < LIMITE) {
    if (battre) {
      // Battement aveugle : monté 0,10 s, baissé 0,15 s. Un vrai joueur fera mieux ;
      // ce qu'on mesure ici, c'est seulement que le batteur *touche* la balle.
      const phase = t % 0.25;
      const cibleG = phase < 0.1 ? a.gaucheHaut : a.gaucheRepos;
      const cibleD = phase < 0.1 ? a.droitHaut : a.droitRepos;
      const max = r.vitesseBatteur * PAS;
      angleG += Math.max(-max, Math.min(max, cibleG - angleG));
      angleD += Math.max(-max, Math.min(max, cibleD - angleD));
      batteurG.setNextKinematicRotation(angleG);
      batteurD.setNextKinematicRotation(angleD);
    }

    monde.step();
    livrer(socle, balle);
    t += PAS;

    const p = balle.translation();
    const v = balle.linvel();
    res.hauteurMax = Math.max(res.hauteurMax, p.y);
    res.vitesseMax = Math.max(res.vitesseMax, Math.hypot(v.x, v.y));
    if (p.x < 0.45) res.sortiLanceur = true;

    // Un rebond compte quand la balle repart vers le haut depuis la zone des batteurs.
    const remonte = v.y > 0.35;
    if (remonte && !montait && p.y < r.hauteurBatteurs + 0.1) res.contactsBatteur++;
    montait = remonte;

    if (res.xMiTable < 0 && res.hauteurMax > 0.8 && p.y < 0.6) res.xMiTable = p.x;
    if (trace && Math.round(t / PAS) % 12 === 0 && t < 4)
      console.log(`    t=${t.toFixed(2)}  x=${p.x.toFixed(3)}  y=${p.y.toFixed(3)}  v=(${v.x.toFixed(2)}, ${v.y.toFixed(2)})`);
    res.fin = [p.x, p.y];
    if (p.y < -0.04) {
      res.drain = t;
      break;
    }
  }
  return res;
}

for (const v of VARIANTS) {
  for (const battre of [false, true]) {
    const r = jouer(v.reglages, battre);
    console.log(
      `${v.cle} ${v.nom.padEnd(10)} ${battre ? 'batteurs actifs ' : 'batteurs au repos'}` +
        ` | lanceur ${r.sortiLanceur ? 'ok ' : 'NON'}` +
        ` | h.max ${r.hauteurMax.toFixed(2)} m` +
        ` | v.max ${r.vitesseMax.toFixed(2)} m/s` +
        ` | x à mi-table ${r.xMiTable.toFixed(3)}` +
        ` | renvois ${String(r.contactsBatteur).padStart(3)}` +
        ` | drain ${
          r.drain < 0
            ? `JAMAIS — bloquée en (${r.fin[0].toFixed(3)}, ${r.fin[1].toFixed(3)})`
            : r.drain.toFixed(1) + ' s'
        }`,
    );
  }
}
