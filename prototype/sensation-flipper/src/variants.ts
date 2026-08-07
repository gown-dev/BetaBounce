// PROTOTYPE JETABLE — trois socles structurellement différents.
// Ils ne diffèrent pas seulement par des nombres : A a des couloirs de sortie et des
// slingshots, B n'a ni l'un ni l'autre (tout converge au centre), C ferme le drain
// d'un poteau central. On en choisit un, puis on affine aux curseurs.

import type { Reglages } from './socle';

const base: Reglages = {
  penteDeg: 6.5,
  restitutionMur: 0.32,
  restitutionBatteur: 0.25,
  frottement: 0.15,

  rayonBalle: 0.0135,
  masseBalle: 0.08,
  forceLanceur: 1.12, // multiple de la vitesse juste nécessaire pour atteindre le toit

  longueurBatteur: 0.078,
  rayonBatteur: 0.009,
  ecartBatteurs: 0.043,
  hauteurBatteurs: 0.145,
  angleReposDeg: 32,
  angleHautDeg: 28,
  vitesseBatteur: 34,

  largeurCouloir: 0.048,
  hauteurPoteau: 0.26,
  slingshots: true,
  poteauCentral: false,
};

export type Variant = { cle: string; nom: string; resume: string; reglages: Reglages };

export const VARIANTS: Variant[] = [
  {
    cle: 'A',
    nom: 'Classique',
    resume: 'couloirs de sortie et slingshots, pente de machine standard',
    reglages: { ...base },
  },
  {
    cle: 'B',
    nom: 'Goulet',
    resume: 'ni couloir ni slingshot, batteurs courts et écartés, pente forte',
    reglages: {
      ...base,
      penteDeg: 9,
      restitutionMur: 0.38,
      longueurBatteur: 0.06,
      ecartBatteurs: 0.055,
      hauteurBatteurs: 0.13,
      vitesseBatteur: 30,
      slingshots: false,
    },
  },
  {
    cle: 'C',
    nom: 'Entonnoir',
    resume: 'couloirs étroits, poteau central, batteurs longs, pente douce',
    reglages: {
      ...base,
      penteDeg: 4.5,
      restitutionMur: 0.26,
      longueurBatteur: 0.088,
      ecartBatteurs: 0.075,
      vitesseBatteur: 36,
      largeurCouloir: 0.03,
      hauteurPoteau: 0.3,
      poteauCentral: true,
    },
  },
];
