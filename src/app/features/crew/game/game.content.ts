/**
 * TideChallenge — Season & Challenge materials hub (/game).
 *
 * Publishing a document:
 *   1. Drop the file in  public/docs/tidechallenge/   (e.g. manual-v1.pdf)
 *   2. Set its `href` below to '/docs/tidechallenge/manual-v1.pdf' and fill `updated`.
 *   An item without `href` shows as "Próximamente".
 *
 */

export const CHALLENGE = {
  name: 'TideChallenge',
  season: 'Offseason 2026',
  summary:
    'Un reto offseason diseñado por TideCrew para seguir construyendo entre temporadas. ' +
    'Lo abrimos a cualquier equipo que quiera jugarlo: aquí vive todo lo que necesitas.',
  contact: 'santi.arzate@tec.mx',
};

/** Labels for the shared milestones (dates live in landing.content.ts → MILESTONES). */
export const MILESTONE_LABELS: Record<string, { label: string; hint: string }> = {
  manual: { label: 'Publicación del manual', hint: 'Reglas, campo y puntuación.' },
  qaOpen: { label: 'Abren las preguntas', hint: 'Envía dudas sobre las reglas.' },
  qaClose: { label: 'Cierran las preguntas', hint: 'Última respuesta oficial.' },
  event: { label: 'Día del reto', hint: 'A la cancha.' },
};

export type Kind = 'PDF' | 'CAD' | 'Video' | 'Enlace' | 'Formulario' | 'ZIP';

export interface Material {
  title: string;
  desc: string;
  kind: Kind;
  href?: string;
  updated?: string;  // 'YYYY-MM-DD'
  version?: string;
  size?: string;     // '2.4 MB'
  /** ISO time before which the link stays locked (spoiler-free until Kickoff). */
  releaseAt?: string;
  /** Title shown once released (e.g. with the game's name). */
  revealTitle?: string;
  /** Short label shown instead of "Próximamente" when there's no link here. */
  note?: string;
}

/** Kickoff: the manual, the drawings and the game's name go public at this time. */
export const RELEASE_AT = '2026-10-26T16:15:00-06:00';
export const GAME_NAME = 'FROZEN BLITZ';

export interface Section {
  id: string;
  title: string;
  intro?: string;
  items: Material[];
  empty?: string;
}

export const SECTIONS: Section[] = [
  {
    id: 'manual',
    title: 'Manual del juego',
    intro: 'Reglas, puntuación, campo y robot. Si algo no está en el manual, pregúntalo en la sección de preguntas.',
    items: [
      {
        title: 'Manual del juego', revealTitle: 'Manual de FROZEN BLITZ', kind: 'PDF',
        desc: 'Juego, arena, reglas de robot, inspección y torneo. 105 páginas, en inglés.',
        href: '/docs/tidechallenge/frozen-blitz-manual-v1.4-28910b62.pdf', version: '1.4', updated: '2026-10-26', size: '4.7 MB',
        releaseAt: RELEASE_AT,
      },
      {
        title: 'Resumen del juego', revealTitle: 'FROZEN BLITZ en una página', kind: 'PDF',
        desc: 'Una página para explicar el reto a tu equipo en cinco minutos: campo, puntuación y reglas clave. En inglés.',
        href: '/docs/tidechallenge/frozen-blitz-one-pager-28910b62.pdf', updated: '2026-10-26', size: '0.8 MB',
        releaseAt: RELEASE_AT,
      },
    ],
  },
  {
    id: 'campo',
    title: 'Campo y elementos',
    intro: 'Todo lo necesario para construir una réplica del campo en tu taller.',
    items: [
      {
        title: 'Planos del campo', kind: 'PDF',
        desc: 'Las 13 láminas del campo con sus cotas (FB-00 a FB-12). Si algo difiere del CAD, manda el CAD.',
        href: '/docs/tidechallenge/frozen-blitz-field-drawings-v1.4-28910b62.pdf', version: '1.4', updated: '2026-10-26', size: '4.2 MB',
        releaseAt: RELEASE_AT,
      },
      {
        title: 'CAD del campo', kind: 'CAD',
        desc: 'El ensamble completo del campo en STEP (AP214), listo para SolidWorks, Onshape, Fusion o Inventor. Si algo difiere de los planos, manda el CAD.',
        href: '/docs/tidechallenge/frozen-blitz-field-cad-v1.4-28910b62.zip', version: '1.4', updated: '2026-10-26', size: '5.1 MB (ZIP)',
        releaseAt: RELEASE_AT,
      },
    ],
  },
  {
    id: 'animacion',
    title: 'Animación del juego',
    items: [
      {
        title: 'Animación oficial', revealTitle: 'Animación de FROZEN BLITZ', kind: 'Video',
        desc: 'El reto en movimiento: cómo se arma un ICE CREAM, cómo se entrega y cómo se puntúa, de principio a fin de un match.',
        href: 'https://youtu.be/w3Zc0Jyki6M', updated: '2026-10-26',
        releaseAt: RELEASE_AT,
      },
    ],
  },
  {
    id: 'actualizaciones',
    title: 'Actualizaciones',
    intro: 'Los Team Updates salen cada jueves antes de las 10:00 pm (hora de Guadalajara), desde el primer jueves después del Kickoff hasta el jueves previo al evento. Se anuncian en la comunidad de WhatsApp y quedan aquí.',
    items: [],
    empty: 'Todavía no hay actualizaciones. Cuando se publique la primera, aparecerá aquí con su fecha.',
  },
  {
    id: 'preguntas',
    title: 'Preguntas y respuestas',
    intro: '¿Una regla no queda clara? Cada equipo registrado recibe un código para preguntar. Todas las respuestas son oficiales y públicas.',
    items: [
      { title: 'Q&A oficial', desc: 'Busca respuestas publicadas o, con tu código de equipo, envía una pregunta.', kind: 'Enlace', href: '/game/qa' },
    ],
  },
  {
    id: 'registro',
    title: 'Registro de equipos',
    intro: 'Abierto a los equipos FIRST amigos de TideCrew. Registra a tu equipo y te enviaremos por correo el código para entrar al Q&A.',
    items: [],
  },
];
