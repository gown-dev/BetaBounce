// PROTOTYPE JETABLE — montage du monde Rapier. Aucun DOM ici, pour qu'un test à blanc
// sous Node puisse monter le même plateau que la page.

import { gravite, margesEffectives, type Reglages, type Socle } from './socle.ts';

export type Monde = {
  monde: any;
  balle: any;
  batteurG: any;
  batteurD: any;
};

export function creerMonde(
  RAPIER: any,
  r: Reglages,
  socle: Socle,
  pas: number,
  depart: { x: number; y: number },
  vitesse?: { x: number; y: number },
  angles?: { gauche: number; droit: number },
): Monde {
  const monde = new RAPIER.World({ x: 0, y: -gravite(r.penteDeg) });
  monde.timestep = pas;

  const decor = monde.createRigidBody(RAPIER.RigidBodyDesc.fixed());
  for (const ligne of socle.murs) {
    monde.createCollider(
      RAPIER.ColliderDesc.polyline(new Float32Array(ligne.flat()))
        .setRestitution(r.restitutionMur)
        .setFriction(r.frottement),
      decor,
    );
  }
  for (const p of socle.poteaux) {
    monde.createCollider(
      RAPIER.ColliderDesc.ball(p.r)
        .setTranslation(p.x, p.y)
        .setRestitution(Math.min(0.9, r.restitutionMur + 0.15))
        .setFriction(r.frottement),
      decor,
    );
  }

  for (const b of socle.bumpers) {
    monde.createCollider(
      RAPIER.ColliderDesc.ball(b.r)
        .setTranslation(b.x, b.y)
        .setRestitution(r.restitutionBumper)
        .setFriction(r.frottement * 0.5),
      decor,
    );
  }

  // Le batteur physique est plus gros que le batteur dessiné : c'est là que vit toute
  // l'indulgence. Le rendu, lui, dessine la taille nominale.
  const marges = margesEffectives(r);
  const batteur = (pivot: [number, number], angle: number) => {
    const corps = monde.createRigidBody(
      RAPIER.RigidBodyDesc.kinematicPositionBased()
        .setTranslation(pivot[0], pivot[1])
        .setRotation(angle),
    );
    const rr = r.rayonBatteur + marges.epaisseur;
    const longueur = r.longueurBatteur + marges.longueur;
    const demi = Math.max(0.001, (longueur - 2 * rr) / 2);
    monde.createCollider(
      RAPIER.ColliderDesc.capsule(demi, rr)
        .setTranslation(longueur / 2, 0)
        .setRotation(-Math.PI / 2)
        .setRestitution(r.restitutionBatteur)
        .setFriction(r.frottement),
      corps,
    );
    return corps;
  };

  const balle = monde.createRigidBody(
    RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(depart.x, depart.y)
      .setCcdEnabled(true)
      .setLinearDamping(0.04)
      .setAngularDamping(0.2),
  );
  monde.createCollider(
    RAPIER.ColliderDesc.ball(r.rayonBalle)
      .setMass(r.masseBalle)
      .setRestitution(r.restitutionMur)
      .setFriction(r.frottement),
    balle,
  );
  if (vitesse) balle.setLinvel(vitesse, true);

  return {
    monde,
    balle,
    batteurG: batteur(socle.pivotGauche, angles?.gauche ?? 0),
    batteurD: batteur(socle.pivotDroit, angles?.droit ?? Math.PI),
  };
}
