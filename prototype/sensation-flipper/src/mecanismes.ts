// PROTOTYPE JETABLE — les deux mécanismes actifs de la zone basse.
//
// Constat du dev après la deuxième session : « les drains sont peu intéressants par
// défaut, sans autre mécanique pour les accompagner ». Sur une vraie machine, ce qui rend
// la zone basse vivante n'est pas la géométrie mais ce qui *pousse* : le slingshot chasse
// la balle d'un côté à l'autre, le kickback la renvoie du couloir de sortie. Sans eux, un
// couloir de sortie n'est qu'un entonnoir à drain, et un slingshot qu'un mur oblique.
//
// Les deux sont implémentés géométriquement plutôt que par événements de contact : on
// teste la distance à la face et on pousse. Suffisant pour juger la sensation, et ça
// évite de brancher la file d'événements de Rapier pour un prototype.

import type { Reglages, Socle } from './socle.ts';

const REPOS_SLING = 0.09; // secondes de repos après une frappe, sinon il mitraille

export type EtatMecanismes = {
  reposSling: number[];
  kickbackDispo: boolean;
};

export function creerEtat(socle: Socle): EtatMecanismes {
  return { reposSling: socle.facesSling.map(() => 0), kickbackDispo: true };
}

// Un kickback réel a un nombre d'usages limité. Ici : une fois par balle.
export function rearmerKickback(etat: EtatMecanismes) {
  etat.kickbackDispo = true;
}

function distanceAuSegment(
  px: number,
  py: number,
  a: [number, number],
  b: [number, number],
): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const carre = dx * dx + dy * dy || 1e-9;
  let t = ((px - a[0]) * dx + (py - a[1]) * dy) / carre;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (a[0] + t * dx), py - (a[1] + t * dy));
}

export function appliquer(
  r: Reglages,
  socle: Socle,
  balle: any,
  etat: EtatMecanismes,
  pas: number,
): void {
  const p = balle.translation();
  const v = balle.linvel();

  if (r.slingshotsActifs) {
    socle.facesSling.forEach((face, i) => {
      etat.reposSling[i] = Math.max(0, etat.reposSling[i] - pas);
      if (etat.reposSling[i] > 0) return;
      if (distanceAuSegment(p.x, p.y, face.a, face.b) > r.rayonBalle + 0.005) return;
      // Ne frapper que la balle qui arrive : sinon le slingshot repousse celle qui s'en
      // va déjà, et la chasse d'un mur à l'autre sans fin.
      if (v.x * face.normale[0] + v.y * face.normale[1] > 0) return;
      balle.setLinvel(
        {
          x: v.x + face.normale[0] * r.forceSlingshot,
          y: v.y + face.normale[1] * r.forceSlingshot,
        },
        true,
      );
      etat.reposSling[i] = REPOS_SLING;
    });
  }

  if (r.kickback && etat.kickbackDispo && v.y < 0) {
    for (const c of socle.couloirs) {
      if (p.x < c.xMin || p.x > c.xMax || p.y > c.y) continue;
      balle.setLinvel({ x: 0, y: r.forceKickback }, true);
      etat.kickbackDispo = false;
      break;
    }
  }
}
