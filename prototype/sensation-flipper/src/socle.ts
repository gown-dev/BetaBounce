// PROTOTYPE JETABLE — géométrie paramétrique du socle.
// Tout est en mètres, origine en bas à gauche, y vers le haut.
// Un vrai plateau de flipper fait ~52 × 116 cm ; on reste dans ces eaux-là pour que
// les valeurs physiques (gravité, masse, rayon) se lisent en unités réelles.

export type Reglages = {
  penteDeg: number; // inclinaison de la machine ; la gravité utile en découle
  restitutionMur: number;
  restitutionBatteur: number;
  frottement: number;

  rayonBalle: number;
  masseBalle: number;
  forceLanceur: number;

  longueurBatteur: number;
  rayonBatteur: number;
  ecartBatteurs: number; // distance pointe à pointe au repos
  hauteurBatteurs: number; // y des pivots
  angleReposDeg: number;
  angleHautDeg: number;
  vitesseBatteur: number; // rad/s

  // Indulgence : le batteur physique est plus gros que le batteur dessiné. La balle est
  // donc frappée alors qu'elle passe un peu à côté de ce que le joueur voit. Deux marges,
  // parce que les deux ratés n'ont rien à voir : passer *au ras* du batteur, et passer
  // *juste après la pointe*.
  margeEpaisseur: number;
  margeLongueur: number;

  largeurCouloir: number; // couloir de sortie
  hauteurPoteau: number;
  slingshots: boolean;
  poteauCentral: boolean;
  garnissage: boolean; // quelques bumpers, pour que la balle ait quelque chose à faire
  restitutionBumper: number;

  // De quoi rendre la zone basse vivante. Un slingshot passif n'est qu'un mur, et un
  // couloir de sortie sans rattrapage n'est qu'un entonnoir à drain.
  slingshotsActifs: boolean;
  forceSlingshot: number; // gain de vitesse à la frappe, en m/s
  kickback: boolean;
  forceKickback: number; // vitesse de renvoi, en m/s
};

// Un vrai plateau fait 52 × 116 cm, soit un rapport de 0,45 — trop haut pour tenir sur un
// écran 1080p à côté du panneau de réglages. On élargit et on raccourcit : 60 × 92 cm.
// Ce n'est pas un choix d'affichage, c'est un choix de plateau — la balle tombe de moins
// haut et dispose de plus de largeur, donc la sensation change avec.
export const LARGEUR = 0.6;
export const HAUTEUR = 0.92;
export const LARGEUR_LANCEUR = 0.036;

export type Polyligne = [number, number][];

export type Socle = {
  murs: Polyligne[];
  poteaux: { x: number; y: number; r: number }[];
  bumpers: { x: number; y: number; r: number }[];
  // Face frappante d'un slingshot : le segment, et la normale qui pointe vers le jeu.
  facesSling: { a: [number, number]; b: [number, number]; normale: [number, number] }[];
  // Couloirs de sortie, pour le kickback : la tranche en x, et la hauteur de déclenchement.
  couloirs: { xMin: number; xMax: number; y: number }[];
  pivotGauche: [number, number];
  pivotDroit: [number, number];
  departBalle: [number, number];
  centre: number;
  hauteurSortie: number;
  depose: [number, number];
  limiteLanceur: number;
};

const rad = (d: number) => (d * Math.PI) / 180;

export function construireSocle(r: Reglages): Socle {
  const xL = 0.02;
  const xR = LARGEUR - LARGEUR_LANCEUR;
  const cx = (xL + xR) / 2;
  const H = HAUTEUR;

  const demiPortee =
    r.ecartBatteurs / 2 + r.longueurBatteur * Math.cos(rad(r.angleReposDeg));
  const pivotGauche: [number, number] = [cx - demiPortee, r.hauteurBatteurs];
  const pivotDroit: [number, number] = [cx + demiPortee, r.hauteurBatteurs];

  // Contour : mur gauche, voûte, mur droit, plancher du lanceur, séparateur de couloir.
  // Ouvert en bas — ce qui sort par là, c'est le drain.
  const contour: Polyligne = [
    [xL, 0],
    [xL, 0.86 * H],
    [xL + 0.038, 0.955 * H],
    [xL + 0.11, 0.995 * H],
    [cx, H],
    [xR - 0.03, 0.995 * H],
    [xR + 0.018, 0.955 * H],
    [LARGEUR, 0.86 * H],
    [LARGEUR, 0.012],
    [xR, 0.012],
    // Le séparateur monte jusqu'à croiser la voûte : le couloir de lancement est un
    // cul-de-sac scellé, dont la seule sortie est la glissière filaire. Sans ça, une
    // balle bien frappée y retombe et la partie ne finit jamais.
    [xR, 0.99 * H],
  ];

  const murs: Polyligne[] = [contour];
  const poteaux: Socle['poteaux'] = [];
  const bumpers: Socle['bumpers'] = [];
  const facesSling: Socle['facesSling'] = [];
  const couloirs: Socle['couloirs'] = [];

  const miroir = (p: Polyligne): Polyligne => p.map(([x, y]) => [2 * cx - x, y]);

  if (r.slingshots) {
    const sommetPoteau: [number, number] = [
      xL + r.largeurCouloir + 0.03,
      r.hauteurPoteau + 0.055,
    ];
    const poteau: Polyligne = [
      [xL + r.largeurCouloir, 0.02],
      [xL + r.largeurCouloir, r.hauteurPoteau],
      sommetPoteau,
    ];
    // La bouche du couloir de sortie est le vide entre le sommet du poteau et le coin
    // bas-gauche du slingshot. On la dimensionne sur la balle : trop serrée, elle s'y
    // coince ; c'est ce qui arrivait avant de la calculer.
    const bouche = 2 * r.rayonBalle + 0.006;
    const sling: Polyligne = [
      [sommetPoteau[0] + bouche * 0.45, sommetPoteau[1] + bouche * 1.2],
      [pivotGauche[0] + 0.02, r.hauteurBatteurs + 0.235],
      [pivotGauche[0], r.hauteurBatteurs + 0.075],
      [sommetPoteau[0] + bouche * 0.45, sommetPoteau[1] + bouche * 1.2],
    ];
    murs.push(poteau, miroir(poteau), sling, miroir(sling));

    // La face frappante est celle qui regarde le jeu : le segment sommet → bas, dont la
    // normale s'éloigne du troisième point du triangle.
    for (const t of [sling, miroir(sling)]) {
      const [coin, haut, bas] = t;
      const dir = [bas[0] - haut[0], bas[1] - haut[1]];
      const n = Math.hypot(dir[0], dir[1]) || 1;
      let normale: [number, number] = [-dir[1] / n, dir[0] / n];
      const versCoin = (coin[0] - haut[0]) * normale[0] + (coin[1] - haut[1]) * normale[1];
      if (versCoin > 0) normale = [-normale[0], -normale[1]];
      facesSling.push({ a: haut, b: bas, normale });
    }

    couloirs.push(
      { xMin: xL, xMax: xL + r.largeurCouloir, y: 0.09 },
      { xMin: 2 * cx - xL - r.largeurCouloir, xMax: 2 * cx - xL, y: 0.09 },
    );
  } else {
    // Pas de couloir de sortie : les murs plongent en diagonale sur les batteurs.
    const rampe: Polyligne = [
      [xL, r.hauteurBatteurs + 0.3],
      [pivotGauche[0], r.hauteurBatteurs + 0.055],
    ];
    murs.push(rampe, miroir(rampe));
  }

  if (r.poteauCentral) {
    // Le poteau ne doit jamais sceller le drain : on lui laisse de chaque côté de quoi
    // faire passer une balle, quitte à le réduire à rien si l'écart est trop serré.
    const place = (r.ecartBatteurs - 2 * (2 * r.rayonBalle + 0.002)) / 2;
    if (place > 0.002) poteaux.push({ x: cx, y: r.hauteurBatteurs - 0.014, r: Math.min(0.008, place) });
  }

  // Garnissage minimal. Le socle nu a livré son verdict : la moindre frappe renvoie la
  // balle vers un drain, faute de quoi que ce soit à toucher en haut. Trois bumpers
  // suffisent à casser les trajectoires et à rendre la durée d'une partie mesurable.
  if (r.garnissage) {
    // Écartement proportionnel à la largeur jouable, pour que le triangle reste centré
    // et lisible quelles que soient les proportions du plateau.
    const e = 0.16 * (xR - xL);
    bumpers.push(
      { x: cx - e, y: 0.7 * H, r: 0.022 },
      { x: cx + e, y: 0.7 * H, r: 0.022 },
      { x: cx, y: 0.79 * H, r: 0.022 },
    );
  }

  return {
    murs,
    poteaux,
    bumpers,
    facesSling,
    couloirs,
    pivotGauche,
    pivotDroit,
    departBalle: [LARGEUR - LARGEUR_LANCEUR / 2, 0.032],
    centre: cx,
    hauteurSortie: 0.84 * H,
    // On dépose au-dessus du milieu du batteur gauche : c'est ce que fait un vrai
    // retour de bille, et ça donne au joueur une balle à frapper plutôt qu'une balle
    // qui longe un mur jusqu'au couloir de sortie.
    depose: [
      pivotGauche[0] + 0.55 * r.longueurBatteur * Math.cos(rad(r.angleReposDeg)),
      0.86 * H,
    ],
    limiteLanceur: xR,
  };
}

// L'indulgence a une limite dure : si les batteurs physiques se rejoignent, le drain se
// referme et la partie ne peut plus finir. On rabote donc la marge de longueur pour que
// l'écart réel laisse toujours passer une balle — le joueur peut tricher, pas gagner.
export function margesEffectives(r: Reglages) {
  const epaisseur = Math.max(0, r.margeEpaisseur);
  const cos = Math.cos(rad(r.angleReposDeg));
  const place = (r.ecartBatteurs - (2 * r.rayonBalle + 0.002)) / 2 - epaisseur;
  return {
    epaisseur,
    longueur: Math.max(0, Math.min(r.margeLongueur, place / Math.max(0.2, cos))),
  };
}

// Le lanceur se règle en multiple de ce qu'il faut pour atteindre la sortie du couloir,
// pas en impulsion absolue : sans ça, changer la pente casse le lancement, puisque la
// hauteur atteinte dépend de la gravité. Un lancer trop mou retombe dans le couloir —
// c'est le comportement voulu, on relance.
export function impulsionLanceur(r: Reglages, socle: Socle, charge: number): number {
  const monte = socle.hauteurSortie - socle.departBalle[1];
  const necessaire = Math.sqrt(2 * gravite(r.penteDeg) * monte);
  return r.masseBalle * necessaire * r.forceLanceur * (0.94 + 0.06 * charge);
}

// Le haut du couloir est une glissière filaire, pas une pièce simulée : à 1,1 m/s² de
// gravité utile, toute vitesse horizontale à l'entrée fait dériver la balle sur toute
// la largeur du plateau avant qu'elle ne redescende. On la *dépose* donc au-dessus du
// batteur gauche, presque immobile, au lieu de la faire rebondir sur un toit. Le trajet
// dans le couloir, lui, reste physique — c'est lui qu'on sent au lancement.
export function livrer(socle: Socle, balle: any): boolean {
  const p = balle.translation();
  const v = balle.linvel();
  if (p.x < socle.limiteLanceur || p.y < socle.hauteurSortie || v.y <= 0) return false;
  balle.setTranslation({ x: socle.depose[0], y: socle.depose[1] }, true);
  balle.setLinvel({ x: 0, y: 0 }, true);
  balle.setAngvel(0, true);
  return true;
}

export function gravite(penteDeg: number): number {
  return 9.81 * Math.sin(rad(penteDeg));
}

export const anglesBatteur = (r: Reglages) => ({
  gaucheRepos: rad(-r.angleReposDeg),
  gaucheHaut: rad(r.angleHautDeg),
  droitRepos: Math.PI - rad(-r.angleReposDeg),
  droitHaut: Math.PI - rad(r.angleHautDeg),
});
