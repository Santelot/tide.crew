/**
 * TideCrew landing — every word on /FIRST lives here.
 *
 * Focus: what TideCrew is inside FIRST. "More than robots" runs through every
 * section as the "Más que ___" eyebrow.
 *
 * Doctrine (Manual of Visual Identity):
 *  - The anthem layer stays English in both languages (the hero line, the
 *    footer promise). Everything conversational is written natively per language.
 *
 * Source of facts: the content form Santi filled on 2026-10-20, plus the 6702
 * history verified on frc-events.firstinspires.org.
 */

export const CONTACT_EMAIL = 'mariana.gomezb@tec.mx';

export const SOCIAL = [
  { id: 'instagram', label: 'Instagram', handle: '@tide.crew', href: 'https://www.instagram.com/tide.crew/' },
  { id: 'youtube', label: 'YouTube', handle: '@StingBots', href: 'https://www.youtube.com/@StingBots' },
];

export const COACHES = [
  { name: 'Santi Arzate', role: { es: 'Coach de Ingeniería', en: 'Engineering Coach' } },
  { name: 'Mariana Gómez Bravo', role: { es: 'Coach de Impacto', en: 'Impact Coach' } },
];

export type Program = 'FLL' | 'FTC' | 'FRC';

export interface Team {
  id: 'stingbots' | 'jellybots' | 'krakenbots' | 'dragonflies';
  name: string;
  program: Program;
  number?: string;
  color: string;     // taken from the team's own mark
  ink: string;       // text colour that reads on `color`
  logo: string;
  since: number;
  stats?: string;    // public stats page
  squads?: { name: string; color: string; wip?: boolean }[];
}

export const TEAMS: Team[] = [
  { id: 'stingbots', name: 'Stingbots', program: 'FRC', number: '6702', color: '#714E98', ink: '#FFFBFE', logo: '/teams/stingbots.svg', since: 2017, stats: 'https://www.thebluealliance.com/team/6702' },
  { id: 'jellybots', name: 'Jellybots', program: 'FTC', number: '25517', color: '#E8C105', ink: '#111921', logo: '/teams/jellybots.svg', since: 2024 },
  { id: 'krakenbots', name: 'Krakenbots', program: 'FRC', number: '9999', color: '#B81E25', ink: '#FFFBFE', logo: '/teams/krakenbots.svg', since: 2024 },
  {
    id: 'dragonflies', name: 'Dragonflies', program: 'FLL', color: '#1E68B2', ink: '#FFFBFE', logo: '/teams/dragonflies.svg', since: 2021,
    squads: [
      { name: 'Black', color: '#111921' },
      { name: 'White', color: '#FFFBFE' },
      { name: 'Pink', color: '#E2579A' },
      { name: 'Teal', color: '#00A6B8', wip: true },
    ],
  },
];

/** The FIRST ladder, shallow to deep. */
export const LADDER: { program: Program; long: string; teams: Team['id'][] }[] = [
  { program: 'FLL', long: 'FIRST LEGO League Challenge', teams: ['dragonflies'] },
  { program: 'FTC', long: 'FIRST Tech Challenge', teams: ['jellybots'] },
  { program: 'FRC', long: 'FIRST Robotics Competition', teams: ['stingbots', 'krakenbots'] },
];

/** TideChallenge milestones (local Guadalajara time). */
export const MILESTONES = [
  { id: 'manual', at: '2026-10-26T09:00:00-06:00' },
  { id: 'qaOpen', at: '2026-10-30T09:00:00-06:00' },
  { id: 'qaClose', at: '2026-11-20T23:59:00-06:00' },
  { id: 'event', at: '2026-12-05T08:00:00-06:00' },
] as const;

export type MilestoneId = (typeof MILESTONES)[number]['id'];

interface Season {
  year: string;
  game?: string;
  robot?: string;
  big?: boolean;
  items: { team: Team['id'] | 'crew'; es: string; en: string }[];
}

/** Awards and events only (the level of detail Santi chose). */
export const SEASONS: Season[] = [
  {
    year: '2017',
    items: [{ team: 'stingbots', es: 'Stingbots 6702 debuta en FRC desde Prepa Tec Santa Anita.', en: 'Stingbots 6702 debuts in FRC out of Prepa Tec Santa Anita.' }],
  },
  {
    year: '2018–22',
    items: [
      { team: 'stingbots', es: 'Temporadas de aprender, fallar y volver a intentar: los cimientos de todo lo que vino después.', en: 'Seasons of learning, failing and trying again: the groundwork for everything that came next.' },
      { team: 'dragonflies', es: '2021 · Nacen los Dragonflies en FIRST LEGO League Challenge, en Atizapán.', en: '2021 · The Dragonflies take off in FIRST LEGO League Challenge, in Atizapán.' },
    ],
  },
  {
    year: '2023', game: 'CHARGED UP', robot: 'Tequila 1', big: true,
    items: [
      { team: 'stingbots', es: 'Ganadores del Regional Monterrey.', en: 'Monterrey Regional winners.' },
      { team: 'stingbots', es: "Frida Amaya, finalista del FIRST Dean's List.", en: "Frida Amaya, FIRST Dean's List finalist." },
      { team: 'stingbots', es: 'Campeonato Mundial FIRST en Houston, división Galileo.', en: 'FIRST Championship in Houston, Galileo division.' },
    ],
  },
  {
    year: '2024', game: 'CRESCENDO', robot: 'Tequila 2',
    items: [
      { team: 'stingbots', es: 'Excellence in Engineering Award en el Regional Hermosillo.', en: 'Excellence in Engineering Award at the Hermosillo Regional.' },
      { team: 'stingbots', es: 'Regional Laguna.', en: 'Laguna Regional.' },
      { team: 'jellybots', es: 'Nacen los Jellybots en FTC y los Krakenbots, el equipo de novatos de FRC.', en: 'The Jellybots are born in FTC, and the Krakenbots, our FRC rookie crew.' },
    ],
  },
  {
    year: '2025', game: 'REEFSCAPE', robot: 'Tequila 3', big: true,
    items: [
      { team: 'stingbots', es: 'Regional León.', en: 'León Regional.' },
      { team: 'stingbots', es: 'Regional FIRST Impact Award en el Regional Laguna y pase al Campeonato.', en: 'Regional FIRST Impact Award at the Laguna Regional, and a ticket to Championship.' },
      { team: 'stingbots', es: 'Campeonato Mundial FIRST en Houston, división Milstein.', en: 'FIRST Championship in Houston, Milstein division.' },
    ],
  },
  {
    year: '2026', game: 'REBUILT', robot: 'Tequila 4',
    items: [
      { team: 'stingbots', es: 'Regional Monterrey.', en: 'Monterrey Regional.' },
      { team: 'stingbots', es: 'Denver Regional, en Estados Unidos.', en: 'Denver Regional, in the United States.' },
      { team: 'dragonflies', es: 'Los cuatro equipos Dragonflies se suman a TideCrew.', en: 'All four Dragonflies teams join TideCrew.' },
      { team: 'crew', es: 'Lanzamos TideChallenge, nuestro primer reto offseason abierto.', en: 'We launch TideChallenge, our first open offseason challenge.' },
    ],
  },
];

const es = {
  nav: {
    tidecrew: 'Qué es TideCrew', first: 'FIRST', teams: 'Equipos', history: 'Trayectoria', impact: 'Impacto',
    challenge: 'TideChallenge', join: 'Únete', menu: 'Menú', close: 'Cerrar', sections: 'Secciones', sound: 'Sonido del mar',
  },
  loader: { text: 'Subiendo la marea', skip: 'Saltar' },
  more: 'Más que',
  hero: {
    kicker: 'Robótica FIRST · Guadalajara y Atizapán',
    lead: 'TideCrew es una alianza de siete equipos FIRST en México. Desde 2017 construimos robots, competimos dentro y fuera del país y abrimos la puerta a más estudiantes cada temporada.',
    ctaTeams: 'Conoce a los equipos',
    ctaJoin: 'Únete',
    scroll: 'Desliza para sumergirte',
    touch: 'Toca el agua',
  },
  about: {
    more: 'un equipo',
    title: 'Una alianza de equipos FIRST.',
    statement:
      'Reunimos a estudiantes de distintas edades y categorías de FIRST en una sola tripulación. ' +
      'La meta es llevarlos al máximo nivel de competencia y que, en el camino, crezcan hasta desarrollar todo su potencial.',
    stats: [
      { value: '7', count: true, label: 'equipos en tres programas FIRST' },
      { value: '2', count: true, label: 'escuelas, de Jalisco al Estado de México' },
      { value: '2017', count: false, label: 'año novato de los Stingbots 6702' },
      { value: '2', count: true, label: 'Campeonatos Mundiales FIRST, en 2023 y 2025' },
    ],
    sharedTitle: 'Lo que compartimos',
    shared: ['Taller', 'Mentores', 'Entrenamiento', 'Recursos', 'Conocimiento'],
    originTitle: 'Cómo nació',
    origin: 'Para ampliar lo que podíamos ofrecer en FIRST: que estudiantes de distintas edades tuvieran la oportunidad de vivir esta competencia y esta comunidad.',
    schoolsTitle: 'Dos escuelas, una marea',
    schools: [
      { name: 'Prepa Tec, Campus Santa Anita', where: 'Guadalajara, Jalisco', note: 'Stingbots, Jellybots y Krakenbots' },
      { name: 'Colegio Valle de Filadelfia, Campus Santa Cruz Atizapán', where: 'Estado de México', note: 'Los cuatro Dragonflies' },
    ],
    coachesTitle: 'Quién nos guía',
  },
  first: {
    more: 'una competencia',
    title: '¿Qué es FIRST?',
    body:
      'FIRST (For Inspiration and Recognition of Science and Technology) es el programa internacional de robótica que fundó Dean Kamen en 1989. ' +
      'Cada temporada trae un reto nuevo, y cada equipo tiene unas semanas para diseñar, construir y programar un robot que lo resuelva.',
    pillars: [
      { title: 'La competencia', body: 'Las alianzas cambian en cada partido: tu rival de la mañana puede ser tu aliado de la tarde. Se gana con ingeniería, estrategia y trabajo en equipo.' },
      { title: 'La comunidad', body: 'Gracious Professionalism y Coopertition: competir con todo y ayudar con todo al mismo tiempo. Prestarle una pieza al equipo rival también es parte del juego.' },
      { title: 'Más que robots', body: 'El premio más importante de FIRST no es para el mejor robot. Es el FIRST Impact Award, para el equipo que más transforma a su comunidad.' },
    ],
    ladderTitle: 'Tres programas, un solo camino',
    ladderHint: 'Pasa el cursor o toca cada nivel',
    levels: {
      FLL: { ages: '9 a 16 años', body: 'Robots LEGO sobre una mesa de juego y un proyecto de innovación. Aquí empieza todo.' },
      FTC: { ages: '12 a 18 años', body: 'Robots medianos diseñados desde cero y alianzas de dos contra dos.' },
      FRC: { ages: '14 a 18 años', body: 'El “deporte de la mente”: robots de tamaño industrial, alianzas de tres contra tres y estadios llenos.' },
    } as Record<Program, { ages: string; body: string }>,
    depth: ['Orilla', 'Mar abierto', 'Profundo'],
    path: 'El camino natural va de FLL a FTC y luego a FRC, pero no es una fila: si FIRST lo permite, puedes estar en FTC y en FRC al mismo tiempo. Queremos más puertas, no más filtros.',
  },
  teams: {
    more: 'un número',
    title: 'Siete equipos. Una sola marea.',
    body: 'Cada equipo tiene su criatura, su color y su programa. Todos reman hacia el mismo lado.',
    labels: { program: 'Programa', number: 'Número', since: 'Desde', home: 'Sede', highlight: 'Destacado', squads: 'Equipos', stats: 'Ver estadísticas', wip: 'en formación', team: 'Equipo' },
    detail: {
      stingbots: {
        tagline: 'El equipo que empezó todo.',
        body: 'Nuestro equipo de FRC desde 2017. Dos veces en el Campeonato Mundial de FIRST en Houston y ganador del Regional FIRST Impact Award en 2025. Sus robots se llaman Tequila.',
        home: 'Prepa Tec Santa Anita',
        highlight: 'Regional FIRST Impact Award 2025',
      },
      jellybots: {
        tagline: 'La tripulación de FTC.',
        body: 'Nacieron en 2024 para abrir FIRST Tech Challenge a más estudiantes. Robots más compactos, la misma hambre de subir.',
        home: 'Prepa Tec Santa Anita',
        highlight: '',
      },
      krakenbots: {
        tagline: 'Novatos, sin red.',
        body: 'Un equipo formado solo por novatos de FRC. Diseñan y construyen su propio robot para el offseason México All Star, sin ayuda de los veteranos. Primero aprenden enfrentando el reto solos; después siguen creciendo de la mano de los experimentados y sus coaches.',
        home: 'Prepa Tec Santa Anita',
        highlight: 'Offseason México All Star',
      },
      dragonflies: {
        tagline: 'Cuatro equipos, un solo vuelo.',
        body: 'Nuestros equipos de FIRST LEGO League Challenge. Compiten desde 2021 y cada temporada suman al menos tres trofeos y dos pases a nivel mundial. En 2026 se unieron a TideCrew.',
        home: 'Colegio Valle de Filadelfia, Atizapán',
        highlight: 'Más de 10 victorias regionales',
      },
    } as Record<Team['id'], { tagline: string; body: string; home: string; highlight: string }>,
    noNumber: 'Cuatro equipos',
  },
  history: {
    more: 'trofeos',
    title: 'Cada temporada nos dejó algo.',
    body: 'Premios y eventos de la tripulación, temporada por temporada.',
    robot: 'Robot',
    note: 'En FLL Challenge, los Dragonflies suman al menos tres trofeos y dos pases a nivel mundial cada temporada desde 2021.',
  },
  impact: {
    more: 'robots',
    title: 'Lo que construimos fuera de la cancha.',
    lead: 'En FIRST, el reconocimiento más alto no es para el mejor robot: es el FIRST Impact Award, para el equipo que más transforma a su comunidad.',
    award: 'Regional FIRST Impact Award',
    awardWhere: 'Regional Laguna · 2025',
    programs: [
      { name: 'Alcanzando STEAM', body: 'Clases extracurriculares de ciencia, tecnología, ingeniería, arte y matemáticas que llevamos a otros colegios.' },
      { name: 'RoboLeague', body: 'Acercamos el reto de FRC a estudiantes de otras escuelas: lo adaptamos a una versión mini y les damos talleres para programar y manejar un robot.' },
      { name: 'TideChallenge', body: 'Un reto offseason diseñado por nosotros y abierto a otros equipos, para que nadie se quede sin construir entre temporadas.' },
    ],
  },
  challenge: {
    more: 'un offseason',
    season: 'Offseason 2026',
    body: 'Diseñamos nuestro propio reto y lo abrimos a todos los equipos. Los detalles salen con el manual: ni un spoiler antes.',
    next: 'Siguiente hito',
    units: ['días', 'horas', 'min', 'seg'],
    done: 'Listo',
    upcoming: 'Próximo',
    now: 'Siguiente',
    over: 'El reto ya se jugó. Gracias por remar con nosotros.',
    milestones: {
      manual: 'Publicación del manual',
      qaOpen: 'Abren las preguntas',
      qaClose: 'Cierran las preguntas',
      event: 'Día del reto',
    } as Record<MilestoneId, string>,
    cta: 'Ir al hub del reto',
  },
  join: {
    more: 'un club',
    title: 'Hay un lugar para ti en la marea.',
    tabs: [
      {
        id: 'students', label: 'Estudiantes', title: 'Súbete a un equipo',
        body: 'Los equipos de TideCrew están abiertos a estudiantes de Prepa Tec, Campus Santa Anita, y del Colegio Valle de Filadelfia, Campus Santa Cruz Atizapán. El ingreso es por el proceso interno de cada escuela: escríbenos y te contamos cómo y cuándo.',
        cta: 'Quiero entrar', subject: 'Quiero unirme a TideCrew',
      },
      {
        id: 'mentors', label: 'Mentores', title: 'Comparte lo que sabes',
        body: 'Ingeniería, programación, diseño, comunicación o negocios: si quieres acompañar a estudiantes en FIRST, ponte en contacto con el equipo.',
        cta: 'Quiero ser mentor', subject: 'Mentoría en TideCrew',
      },
      {
        id: 'teams', label: 'Otros equipos', title: 'Rememos juntos',
        body: 'Apoyo, conocimiento y comunidad. Si tu equipo FIRST necesita una mano, una pieza o una idea, escríbenos. Y este offseason, juega TideChallenge con nosotros.',
        cta: 'Escribir al equipo', subject: 'Hola desde otro equipo FIRST',
      },
      {
        id: 'companies', label: 'Empresas', title: 'Impulsa la marea',
        body: 'Tu apoyo se convierte en viajes a competencias, material de taller y programas como RoboLeague y Alcanzando STEAM. Más estudiantes en FIRST, y más lejos.',
        cta: 'Quiero apoyar', subject: 'Apoyo a TideCrew',
      },
    ],
    direct: 'O escríbenos directo',
    copy: 'Copiar correo',
    copied: 'Copiado',
    follow: 'Síguenos',
  },
  footer: {
    line: 'Robótica FIRST · Guadalajara · Atizapán',
    coaches: 'Coaches',
    contact: 'Contacto',
    follow: 'Síguenos',
    top: 'Volver a la superficie',
  },
};

export type Copy = typeof es;

const en: Copy = {
  nav: {
    tidecrew: 'What is TideCrew', first: 'FIRST', teams: 'Teams', history: 'Track record', impact: 'Impact',
    challenge: 'TideChallenge', join: 'Join', menu: 'Menu', close: 'Close', sections: 'Sections', sound: 'Ocean sound',
  },
  loader: { text: 'Bringing the tide in', skip: 'Skip' },
  more: 'More than',
  hero: {
    kicker: 'FIRST Robotics · Guadalajara & Atizapán',
    lead: "TideCrew is an alliance of seven FIRST teams in Mexico. Since 2017 we've built robots, competed at home and abroad, and opened the door to more students every season.",
    ctaTeams: 'Meet the teams',
    ctaJoin: 'Join us',
    scroll: 'Scroll to dive in',
    touch: 'Touch the water',
  },
  about: {
    more: 'a team',
    title: 'An alliance of FIRST teams.',
    statement:
      'We bring students of different ages and FIRST programs into a single crew. ' +
      'The goal is to take them to the highest level of competition, and to help them grow into everything they can be along the way.',
    stats: [
      { value: '7', count: true, label: 'teams across three FIRST programs' },
      { value: '2', count: true, label: 'schools, from Jalisco to the State of Mexico' },
      { value: '2017', count: false, label: 'Stingbots 6702 rookie year' },
      { value: '2', count: true, label: 'FIRST Championships, in 2023 and 2025' },
    ],
    sharedTitle: 'What we share',
    shared: ['Workshop', 'Mentors', 'Training', 'Resources', 'Know-how'],
    originTitle: 'How it started',
    origin: 'To widen what we could offer in FIRST: so students of every age get the chance to live this competition and this community.',
    schoolsTitle: 'Two schools, one tide',
    schools: [
      { name: 'Prepa Tec, Santa Anita Campus', where: 'Guadalajara, Jalisco', note: 'Stingbots, Jellybots and Krakenbots' },
      { name: 'Colegio Valle de Filadelfia, Santa Cruz Atizapán Campus', where: 'State of Mexico', note: 'All four Dragonflies' },
    ],
    coachesTitle: 'Who leads us',
  },
  first: {
    more: 'a competition',
    title: 'What is FIRST?',
    body:
      'FIRST (For Inspiration and Recognition of Science and Technology) is the international robotics program Dean Kamen founded in 1989. ' +
      'Every season brings a new challenge, and every team gets a few weeks to design, build and program a robot that solves it.',
    pillars: [
      { title: 'The competition', body: "Alliances change every match: this morning's rival can be this afternoon's partner. You win with engineering, strategy and teamwork." },
      { title: 'The community', body: 'Gracious Professionalism and Coopertition: compete all-out and help all-out at the same time. Lending a part to the other team is part of the game.' },
      { title: 'More than robots', body: "FIRST's highest honor doesn't go to the best robot. It's the FIRST Impact Award, for the team that does the most for its community." },
    ],
    ladderTitle: 'Three programs, one path',
    ladderHint: 'Hover or tap each level',
    levels: {
      FLL: { ages: 'Ages 9 to 16', body: 'LEGO robots on a game table, plus an innovation project. This is where it all begins.' },
      FTC: { ages: 'Ages 12 to 18', body: 'Mid-size robots designed from scratch, in two-versus-two alliances.' },
      FRC: { ages: 'Ages 14 to 18', body: 'The “varsity sport for the mind”: industrial-size robots, three-versus-three alliances and packed arenas.' },
    },
    depth: ['Shore', 'Open sea', 'The deep'],
    path: "The natural path runs from FLL to FTC to FRC, but it isn't a queue: where FIRST allows it, you can be on an FTC and an FRC team at once. We want more doors, not more filters.",
  },
  teams: {
    more: 'a number',
    title: 'Seven teams. One tide.',
    body: 'Every team has its own creature, its own color and its own program. All of them row the same way.',
    labels: { program: 'Program', number: 'Number', since: 'Since', home: 'Home', highlight: 'Highlight', squads: 'Teams', stats: 'See stats', wip: 'forming', team: 'Team' },
    detail: {
      stingbots: {
        tagline: 'The team that started it all.',
        body: 'Our FRC team since 2017. Twice at the FIRST Championship in Houston, and winners of the Regional FIRST Impact Award in 2025. Their robots are all named Tequila.',
        home: 'Prepa Tec Santa Anita',
        highlight: 'Regional FIRST Impact Award 2025',
      },
      jellybots: {
        tagline: 'The FTC crew.',
        body: 'Born in 2024 to open FIRST Tech Challenge to more students. Smaller robots, the same hunger to rise.',
        home: 'Prepa Tec Santa Anita',
        highlight: '',
      },
      krakenbots: {
        tagline: 'Rookies, no safety net.',
        body: 'A team made only of FRC rookies. They design and build their own robot for the México All Star offseason, with no help from the veterans. First they learn by facing the challenge alone; then they keep growing alongside the experienced crew and their coaches.',
        home: 'Prepa Tec Santa Anita',
        highlight: 'México All Star offseason',
      },
      dragonflies: {
        tagline: 'Four teams, one flight.',
        body: 'Our FIRST LEGO League Challenge teams. Competing since 2021, they bring home at least three trophies and two world-level advancements every season. They joined TideCrew in 2026.',
        home: 'Colegio Valle de Filadelfia, Atizapán',
        highlight: '10+ regional wins',
      },
    },
    noNumber: 'Four teams',
  },
  history: {
    more: 'trophies',
    title: 'Every season left us something.',
    body: 'The crew’s awards and events, season by season.',
    robot: 'Robot',
    note: 'In FLL Challenge, the Dragonflies have earned at least three trophies and two world-level advancements every season since 2021.',
  },
  impact: {
    more: 'robots',
    title: 'What we build off the field.',
    lead: "In FIRST, the highest honor doesn't go to the best robot: it's the FIRST Impact Award, for the team that does the most for its community.",
    award: 'Regional FIRST Impact Award',
    awardWhere: 'Laguna Regional · 2025',
    programs: [
      { name: 'Alcanzando STEAM', body: 'After-school classes in science, technology, engineering, art and math that we take to other schools.' },
      { name: 'RoboLeague', body: 'We bring the FRC challenge to students from other schools: a mini version of the game, plus workshops to learn to program and drive a robot.' },
      { name: 'TideChallenge', body: 'An offseason challenge we designed and opened to other teams, so nobody goes without building between seasons.' },
    ],
  },
  challenge: {
    more: 'an offseason',
    season: 'Offseason 2026',
    body: "We designed our own challenge and we're opening it to every team. The details arrive with the manual: not a single spoiler before.",
    next: 'Next milestone',
    units: ['days', 'hrs', 'min', 'sec'],
    done: 'Done',
    upcoming: 'Upcoming',
    now: 'Next',
    over: 'The challenge has been played. Thanks for riding with us.',
    milestones: {
      manual: 'Manual release',
      qaOpen: 'Q&A opens',
      qaClose: 'Q&A closes',
      event: 'Challenge day',
    },
    cta: 'Go to the challenge hub',
  },
  join: {
    more: 'a club',
    title: "There's a place for you in the tide.",
    tabs: [
      {
        id: 'students', label: 'Students', title: 'Get on a team',
        body: "TideCrew teams are open to students at Prepa Tec, Santa Anita Campus, and Colegio Valle de Filadelfia, Santa Cruz Atizapán Campus. You join through each school's internal process: write to us and we'll tell you how and when.",
        cta: 'I want in', subject: 'I want to join TideCrew',
      },
      {
        id: 'mentors', label: 'Mentors', title: 'Share what you know',
        body: 'Engineering, programming, design, communications or business: if you want to walk alongside students in FIRST, get in touch with the team.',
        cta: 'I want to mentor', subject: 'Mentoring at TideCrew',
      },
      {
        id: 'teams', label: 'Other teams', title: "Let's row together",
        body: "Support, know-how and community. If your FIRST team needs a hand, a part or an idea, write to us. And this offseason, play TideChallenge with us.",
        cta: 'Write to the team', subject: 'Hello from another FIRST team',
      },
      {
        id: 'companies', label: 'Companies', title: 'Power the tide',
        body: 'Your support becomes trips to competitions, workshop materials and programs like RoboLeague and Alcanzando STEAM. More students in FIRST, going further.',
        cta: 'I want to support', subject: 'Supporting TideCrew',
      },
    ],
    direct: 'Or write to us directly',
    copy: 'Copy email',
    copied: 'Copied',
    follow: 'Follow us',
  },
  footer: {
    line: 'FIRST Robotics · Guadalajara · Atizapán',
    coaches: 'Coaches',
    contact: 'Contact',
    follow: 'Follow us',
    top: 'Back to the surface',
  },
};

export const COPY: Record<'es' | 'en', Copy> = { es, en };
