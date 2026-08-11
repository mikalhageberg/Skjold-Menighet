/**
 * Designsystemet i appen.
 *
 * Fargene er hentet fra kirkerommet: kalket vegg, gran og messing, med de
 * liturgiske paramentfargene som aksent på hvert kort. Teksten er stor og
 * trykkflatene romslige, fordi mange av dem som skal bruke dette er godt
 * voksne — 17px er minstemål for brødtekst, 52px for alt man skal treffe.
 */

export const farge = {
  kalk: "#EFF2EE",
  kalkDyp: "#E5EAE5",
  papir: "#FAFBF8",
  gran: "#16302A",
  granMyk: "#3F5B53",
  granSvak: "#748982",
  strek: "#D3DBD5",
  strekSvak: "#E3E9E4",
  messing: "#8F6716",
  messingLys: "#ECDFC2",
  rod: "#99332A",
} as const;

export const skrift = {
  // Fraunces til titler — utskåret, med litt uro i formene.
  display: "Fraunces_500Medium",
  displayHalvfet: "Fraunces_600SemiBold",
  // Schibsted Grotesk til alt som skal leses raskt.
  tekst: "SchibstedGrotesk_400Regular",
  tekstMedium: "SchibstedGrotesk_500Medium",
  tekstHalvfet: "SchibstedGrotesk_600SemiBold",
} as const;

export const storrelse = {
  mega: 34,
  stor: 26,
  mellom: 21,
  brod: 17,
  liten: 15,
  etikett: 12,
} as const;

export const rom = {
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

/** Minste trykkflate. Under dette bommer folk. */
export const TREFF = 52;

export const radius = {
  kort: 4,
  knapp: 4,
  liten: 2,
} as const;
