export type Arrangement = {
  id: string;
  slug: string;
  tittel: string;
  ingress: string | null;
  beskrivelse: string | null;
  starter: string;
  slutter: string | null;
  sted: string;
  kapasitet: number | null;
  pamelding_stenger: string | null;
  tillat_flere: boolean;
  sporr_om_kost: boolean;
  krev_telefon: boolean;
  krev_epost: boolean;
  /** Antall dager før start oppsummeringen til ansvarlig sendes. null = ikke send. */
  oppsummering_dager_for: number | null;
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
  antall_pameldte: number;
};

export type Deltaker = {
  id: string;
  pamelding_id: string;
  navn: string;
  er_kontakt: boolean;
  kosthold: string | null;
};

export type Pamelding = {
  id: string;
  arrangement_id: string;
  kontakt_navn: string;
  kontakt_telefon: string | null;
  kontakt_epost: string | null;
  melding: string | null;
  avmeldt: string | null;
  opprettet: string;
};

export type PameldingMedDeltakere = Pamelding & {
  deltakere: Deltaker[];
};

/* ── Det appen sender og får tilbake ─────────────────────────────────── */

export type DeltakerInn = {
  navn: string;
  kosthold: string | null;
};

export type PameldingInn = {
  slug: string;
  kontaktNavn: string;
  kontaktTelefon: string | null;
  kontaktEpost: string | null;
  melding: string | null;
  deltakere: DeltakerInn[];
  /** Expo-push-token, hvis brukeren har sagt ja til påminnelser. */
  pushToken?: string | null;
};

export type PameldingSvar =
  | { ok: true; pameldingId: string; antall: number }
  | { ok: false; feil: string; feltfeil?: Record<string, string> };

export type AvmeldingSvar = { ok: true } | { ok: false; feil: string };
