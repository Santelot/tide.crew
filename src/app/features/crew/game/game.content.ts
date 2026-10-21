/**
 * TideChallenge — Season & Challenge materials hub (/game).
 *
 * Publishing a document:
 *   1. Drop the file in  public/docs/tidechallenge/   (e.g. manual-v1.pdf)
 *   2. Set its `href` below to '/docs/tidechallenge/manual-v1.pdf' and fill `updated`.
 *   An item without `href` shows as "Próximamente".
 *
 * Confirm every line marked  // CONFIRMAR
 */

export const CHALLENGE = {
  name: 'TideChallenge',
  season: 'Offseason 2026',
  summary:
    'Un reto offseason diseñado por TideCrew para seguir construyendo entre temporadas. ' +
    'Lo compartimos con cualquier equipo que quiera jugarlo: aquí vive todo lo que necesitas.',
  contact: 'mariana.gomezb@tec.mx',
};

export interface KeyDate {
  label: string;
  date?: string; // 'YYYY-MM-DD' — sin fecha = "Por anunciar"
}

export const KEY_DATES: KeyDate[] = [
  { label: 'Publicación del manual', date: '2026-10-26' },
  { label: 'Abren las preguntas', date: '2026-10-30' },
  { label: 'Cierran las preguntas', date: '2026-11-20' },
  { label: 'Día del reto', date: '2026-12-05' },
];

export type Kind = 'PDF' | 'CAD' | 'Video' | 'Enlace' | 'Formulario' | 'ZIP';

export interface Material {
  title: string;
  desc: string;
  kind: Kind;
  href?: string;
  updated?: string;  // 'YYYY-MM-DD'
  version?: string;
  size?: string;     // '2.4 MB'
}

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
      { title: 'Manual de TideChallenge', desc: 'El documento completo del reto.', kind: 'PDF' },
      { title: 'Resumen del juego', desc: 'Una página para explicar el reto a tu equipo en cinco minutos.', kind: 'PDF' },
    ],
  },
  {
    id: 'campo',
    title: 'Campo y elementos',
    intro: 'Todo lo necesario para construir una réplica del campo en tu taller.',
    items: [
      { title: 'Planos del campo', desc: 'Dimensiones y vistas acotadas.', kind: 'PDF' },
      { title: 'CAD del campo', desc: 'Modelo completo para diseñar alrededor de él.', kind: 'CAD' },
      { title: 'Lista de materiales', desc: 'Piezas y proveedores para armar los elementos de juego.', kind: 'PDF' },
    ],
  },
  {
    id: 'animacion',
    title: 'Animación del juego',
    items: [
      { title: 'Animación oficial', desc: 'El reto en movimiento, de principio a fin de un match.', kind: 'Video' },
    ],
  },
  {
    id: 'actualizaciones',
    title: 'Actualizaciones',
    intro: 'Cambios y aclaraciones al manual. Las actualizaciones tienen prioridad sobre el manual.',
    items: [],
    empty: 'Todavía no hay actualizaciones. Cuando se publique la primera, aparecerá aquí con su fecha.',
  },
  {
    id: 'preguntas',
    title: 'Preguntas y respuestas',
    intro: '¿Una regla no queda clara? Envíanos tu pregunta y publicaremos la respuesta para todos los equipos.',
    items: [
      { title: 'Enviar una pregunta', desc: 'Una pregunta por envío, citando la regla.', kind: 'Formulario' },
      { title: 'Respuestas publicadas', desc: 'Todas las respuestas oficiales en un solo documento.', kind: 'PDF' },
    ],
  },
  {
    id: 'registro',
    title: 'Registro de equipos',
    intro: 'Abierto a equipos FIRST de cualquier lugar.',
    items: [
      { title: 'Registrar mi equipo', desc: 'Nombre, número y contacto de un mentor.', kind: 'Formulario' },
    ],
  },
];
