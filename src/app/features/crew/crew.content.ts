/**
 * TideCrew · FIRST — all editable content for /FIRST lives here.
 *
 * Doctrine: English only for the anthem layer (name, creed, promise, values).
 * Everything conversational is Spanish, written natively.
 *
 * Before launch, confirm every line marked  // CONFIRMAR
 */

export const CONTACT = {
  email: 'hola@tidecrew.co', // CONFIRMAR: buzón real que recibe patrocinios
  instagram: '',             // CONFIRMAR: p. ej. 'https://instagram.com/tidecrew'  (vacío = no se muestra)
  youtube: '',
  tba: 'https://www.thebluealliance.com/team/6702',
};

export interface CrewTeam {
  number: string;
  name: string;
  program: string;
  home: string;
}

// La tripulación. Agrega aquí cada equipo de la familia (FRC, FTC, FLL…).
export const TEAMS: CrewTeam[] = [
  {
    number: '6702',
    name: 'Stingbots',                           // CONFIRMAR
    program: 'FIRST Robotics Competition',
    home: 'Prepa Tec Santa Anita, Guadalajara',  // CONFIRMAR
  },
];

// Valores — capa himno, se quedan en inglés.
export const VALUES: string[] = [
  'Too much is exactly enough',
  'No is not an ending',
  "We're not afraid to fall",
  'We rise together',
  'We refuse to settle',
];

export const HERO = {
  kicker: 'Robótica FIRST desde Guadalajara',
  intro:
    'Somos una tripulación de estudiantes que diseña, construye y programa robots para competir en FIRST. ' +
    'Lo que todavía no sabemos hacer, lo aprendemos en el camino — y lo compartimos.',
};

export const CREW_TEXT = {
  title: 'La tripulación',
  body:
    'Cada temporada empieza igual: un reto nuevo, seis semanas y un taller lleno de gente que no se conforma. ' +
    'Aquí nadie llega sabiendo. Se llega con ganas, y la tripulación hace el resto.',
};

export const SEASON_TEXT = {
  title: 'Offseason',
  body:
    'Entre temporadas no bajamos la marea. Diseñamos nuestro propio reto para seguir construyendo, ' +
    'y esta vez lo abrimos a todos los equipos que quieran jugarlo.',
  cta: 'Ver materiales de TideChallenge',
};

export const SPONSOR_TEXT = {
  title: 'Patrocina una temporada',
  body:
    'Un robot competitivo cuesta piezas, inscripciones y viajes. Cada patrocinio se convierte en eso: ' +
    'más estudiantes construyendo, compitiendo y aprendiendo cosas que no se enseñan en un salón.',
  cta: 'Escríbenos para patrocinar',
  empty: 'Este espacio es para las marcas que suben la marea con nosotros.',
};

export interface Sponsor {
  name: string;
  logo?: string; // ruta en /public, p. ej. '/sponsors/acme.svg'
  url?: string;
  tier: 'Captain' | 'First Officer' | 'Crew';
}

// Vacío = se muestra la invitación. Agrega patrocinadores aquí.
export const SPONSORS: Sponsor[] = [];
