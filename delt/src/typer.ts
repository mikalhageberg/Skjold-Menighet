export type Arrangement = {
  id: string;
  slug: string;
  tittel: string;
  ingress: string | null;
  beskrivelse: string | null;
  starter: string;
  slutter: string | null;
  sted: string;
  /** Hvor mange frivillige oppgaven trenger. null = ingen øvre grense. */
  trengs: number | null;
  pamelding_stenger: string | null;
  /** Påmelding krever bare navn. Trenger oppgaven mer, skrus det på her. */
  krev_telefon: boolean;
  krev_epost: boolean;
  ansvarlig_navn: string | null;
  ansvarlig_epost: string | null;
  publisert: boolean;
  /**
   * Tidspunktet et AI-generert headline-bilde sist ble satt, eller null om
   * arrangementet ikke har noe. Selve bildet hentes separat via
   * /api/offentlig/bilde/{id} — brukes også som cache-nøkkel i URL-en.
   */
  bilde_generert: string | null;
  /**
   * Satt når arrangementet ble opprettet som del av en serie med
   * gjentakelser — delt av alle forekomstene serien ble laget med. Hver
   * forekomst er ellers en helt vanlig, selvstendig rad.
   */
  serie_id: string | null;
  opprettet: string;
};

export type ArrangementMedAntall = Arrangement & {
  antall_frivillige: number;
};

/**
 * Én frivillig som har meldt seg, slik de andre ser henne.
 *
 * Telefonnummeret er bare med når tre ting stemmer samtidig: oppgaven
 * krever nummer, hun har krysset av for å dele det, og den som spør står
 * selv på lista. Ellers er det null. E-postadressen deles aldri.
 */
export type Frivillig = {
  navn: string;
  bidrag: string | null;
  telefon: string | null;
};

export type Pamelding = {
  id: string;
  arrangement_id: string;
  navn: string;
  telefon: string | null;
  epost: string | null;
  /** «Jeg bidrar med» — hva den frivillige har sagt at hun tar. */
  bidrag: string | null;
  /** Om hun har sagt ja til at nummeret vises til de andre på oppgaven. */
  del_nummer: boolean;
  avmeldt: string | null;
  opprettet: string;
};

/* ── Det appen sender og får tilbake ─────────────────────────────────── */

export type PameldingInn = {
  slug: string;
  navn: string;
  telefon: string | null;
  epost: string | null;
  bidrag: string | null;
  /** Om nummeret skal vises til de andre frivillige. Avslått som standard. */
  delNummer?: boolean;
  /** Expo-push-token, så telefonen kan få påminnelsen dagen før. */
  pushToken?: string | null;
};

export type PameldingSvar =
  | { ok: true; pameldingId: string }
  | { ok: false; feil: string; feltfeil?: Record<string, string> };

export type AvmeldingSvar = { ok: true } | { ok: false; feil: string };
