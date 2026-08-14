import "server-only";
import { randomUUID } from "node:crypto";
import { harDatabase, hentDb } from "./db";
import { demolager } from "./demo";
import type {
  Arrangement,
  ArrangementMedAntall,
  Frivillig,
  Pamelding,
} from "@skjold/delt";

export { harDatabase };

/* ── Rå rader fra SQLite ─────────────────────────────────────────────── */
// SQLite har ingen boolean-type — sant/usant kommer tilbake som 0/1,
// og må gjøres om ved grensen mot resten av appen.

type ArrangementRad = Omit<Arrangement, "krev_telefon" | "krev_epost" | "publisert"> & {
  krev_telefon: number;
  krev_epost: number;
  publisert: number;
  nyhetsvarsel_sendt: string | null;
  endret: string;
};

function fraArrangementRad(rad: ArrangementRad, antallFrivillige: number): ArrangementMedAntall {
  return {
    id: rad.id,
    slug: rad.slug,
    tittel: rad.tittel,
    ingress: rad.ingress,
    beskrivelse: rad.beskrivelse,
    starter: rad.starter,
    slutter: rad.slutter,
    sted: rad.sted,
    trengs: rad.trengs,
    pamelding_stenger: rad.pamelding_stenger,
    krev_telefon: Boolean(rad.krev_telefon),
    krev_epost: Boolean(rad.krev_epost),
    ansvarlig_navn: rad.ansvarlig_navn,
    ansvarlig_epost: rad.ansvarlig_epost,
    publisert: Boolean(rad.publisert),
    bilde_generert: rad.bilde_generert,
    serie_id: rad.serie_id,
    opprettet: rad.opprettet,
    antall_frivillige: antallFrivillige,
  };
}

/** Antall frivillige per arrangement, i én spørring. */
function tellFrivilligePerArrangement(ider: string[]): Map<string, number> {
  const kart = new Map<string, number>();
  if (ider.length === 0) return kart;

  const plassholdere = ider.map(() => "?").join(",");
  const rader = hentDb()
    .prepare(
      `select arrangement_id, count(*) as antall
         from pameldinger
        where avmeldt is null
          and arrangement_id in (${plassholdere})
        group by arrangement_id`,
    )
    .all(...ider) as { arrangement_id: string; antall: number }[];

  for (const r of rader) kart.set(r.arrangement_id, r.antall);
  return kart;
}

function medAntall(rader: ArrangementRad[]): ArrangementMedAntall[] {
  const antallKart = tellFrivilligePerArrangement(rader.map((r) => r.id));
  return rader.map((r) => fraArrangementRad(r, antallKart.get(r.id) ?? 0));
}

/* ── Lesing ──────────────────────────────────────────────────────────── */

export async function hentKommende(): Promise<ArrangementMedAntall[]> {
  const grense = new Date(Date.now() - 3 * 3600_000).toISOString();

  if (!harDatabase()) {
    const { arrangementer, pameldinger } = demolager();
    return arrangementer
      .filter((a) => a.publisert && a.starter >= grense)
      .sort((a, b) => a.starter.localeCompare(b.starter))
      .map((a) => ({ ...a, antall_frivillige: tellDemo(pameldinger, a.id) }));
  }

  const rader = hentDb()
    .prepare(`select * from arrangementer where publisert = 1 and starter >= ? order by starter asc`)
    .all(grense) as ArrangementRad[];
  return medAntall(rader);
}

export async function hentAlle(): Promise<ArrangementMedAntall[]> {
  if (!harDatabase()) {
    const { arrangementer, pameldinger } = demolager();
    return [...arrangementer]
      .sort((a, b) => b.starter.localeCompare(a.starter))
      .map((a) => ({ ...a, antall_frivillige: tellDemo(pameldinger, a.id) }));
  }

  const rader = hentDb()
    .prepare(`select * from arrangementer order by starter desc`)
    .all() as ArrangementRad[];
  return medAntall(rader);
}

export async function hentArrangement(slug: string): Promise<ArrangementMedAntall | null> {
  if (!harDatabase()) {
    const { arrangementer, pameldinger } = demolager();
    const a = arrangementer.find((x) => x.slug === slug);
    return a ? { ...a, antall_frivillige: tellDemo(pameldinger, a.id) } : null;
  }

  const rad = hentDb().prepare(`select * from arrangementer where slug = ?`).get(slug) as
    | ArrangementRad
    | undefined;
  if (!rad) return null;
  return fraArrangementRad(rad, tellFrivilligePerArrangement([rad.id]).get(rad.id) ?? 0);
}

export async function hentArrangementMedId(id: string): Promise<ArrangementMedAntall | null> {
  if (!harDatabase()) {
    const { arrangementer, pameldinger } = demolager();
    const a = arrangementer.find((x) => x.id === id);
    return a ? { ...a, antall_frivillige: tellDemo(pameldinger, a.id) } : null;
  }

  const rad = hentDb().prepare(`select * from arrangementer where id = ?`).get(id) as
    | ArrangementRad
    | undefined;
  if (!rad) return null;
  return fraArrangementRad(rad, tellFrivilligePerArrangement([rad.id]).get(rad.id) ?? 0);
}

/** Alt om dem som har meldt seg — til admin. Kontaktopplysninger og alt. */
export async function hentPameldinger(arrangementId: string): Promise<Pamelding[]> {
  if (!harDatabase()) {
    return demolager()
      .pameldinger.filter((p) => p.arrangement_id === arrangementId && !p.avmeldt)
      .sort((a, b) => a.opprettet.localeCompare(b.opprettet));
  }

  return hentDb()
    .prepare(
      `select * from pameldinger
        where arrangement_id = ? and avmeldt is null
        order by opprettet asc`,
    )
    .all(arrangementId) as Pamelding[];
}

/**
 * Lista alle ser: navn, hva hver enkelt bidrar med, og nummeret deres når
 * oppgaven krever ett. Poenget er at man skal kunne se om noen alt har
 * tatt kakebaksten før man melder seg — og kunne ringe den man deler
 * vakt med uten å gå veien om den ansvarlige.
 *
 * E-postadressen er ikke med. Den brukes til utsending fra admin, og har
 * ingenting med planlegging mellom frivillige å gjøre.
 */
export async function hentFrivillige(arrangementId: string): Promise<Frivillig[]> {
  const pameldinger = await hentPameldinger(arrangementId);
  return pameldinger.map((p) => ({ navn: p.navn, bidrag: p.bidrag, telefon: p.telefon }));
}

/** Påmeldingen slik den ligger i basen — med enheten, som aldri forlater serveren. */
export type PameldingRad = Pamelding & { enhet_id: string | null };

/** Én påmelding, uansett om den er avmeldt eller ikke — brukes til avmelding. */
export async function hentPameldingMedId(id: string): Promise<PameldingRad | null> {
  if (!harDatabase()) {
    const p = demolager().pameldinger.find((x) => x.id === id);
    return p ? { ...p, enhet_id: null } : null;
  }

  return (
    (hentDb().prepare(`select * from pameldinger where id = ?`).get(id) as
      | PameldingRad
      | undefined) ?? null
  );
}

/** Om denne telefonen alt står på lista — så ingen havner der to ganger. */
export async function harMeldtSeg(arrangementId: string, enhetId: string): Promise<boolean> {
  if (!harDatabase()) return false;
  const rad = hentDb()
    .prepare(
      `select 1 from pameldinger
        where arrangement_id = ? and enhet_id = ? and avmeldt is null
        limit 1`,
    )
    .get(arrangementId, enhetId);
  return Boolean(rad);
}

/* ── Skriving ────────────────────────────────────────────────────────── */

export type NyPamelding = {
  arrangementId: string;
  enhetId?: string | null;
  navn: string;
  telefon: string | null;
  epost: string | null;
  bidrag: string | null;
};

export async function opprettPamelding(input: NyPamelding): Promise<string> {
  const na = new Date().toISOString();

  if (!harDatabase()) {
    const lager = demolager();
    const id = `p${lager.pameldinger.length}-${Date.now()}`;
    lager.pameldinger.push({
      id,
      arrangement_id: input.arrangementId,
      navn: input.navn,
      telefon: input.telefon,
      epost: input.epost,
      bidrag: input.bidrag,
      avmeldt: null,
      opprettet: na,
    });
    return id;
  }

  const id = randomUUID();
  hentDb()
    .prepare(
      `insert into pameldinger
         (id, arrangement_id, enhet_id, navn, telefon, epost, bidrag, opprettet)
       values (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      input.arrangementId,
      input.enhetId ?? null,
      input.navn,
      input.telefon,
      input.epost,
      input.bidrag,
      na,
    );

  return id;
}

export async function slettPamelding(id: string) {
  if (!harDatabase()) {
    const lager = demolager();
    lager.pameldinger = lager.pameldinger.filter((p) => p.id !== id);
    return;
  }
  hentDb().prepare(`delete from pameldinger where id = ?`).run(id);
}

/**
 * Melder av uten å slette. Den ansvarlige skal fortsatt kunne se hvem som
 * hadde sagt ja, selv om plassen er ledig igjen.
 */
export async function avmeldPamelding(id: string) {
  const na = new Date().toISOString();
  if (!harDatabase()) {
    const pamelding = demolager().pameldinger.find((p) => p.id === id);
    if (pamelding) pamelding.avmeldt = na;
    return;
  }
  hentDb()
    .prepare(`update pameldinger set avmeldt = ? where id = ? and avmeldt is null`)
    .run(na, id);
}

export type ArrangementInput = Omit<
  Arrangement,
  "id" | "opprettet" | "bilde_generert" | "serie_id"
>;

/** undefined = ikke rør bildet, null = fjern det, ellers sett dette bildet. */
export type BildeEndring = { data: Buffer; mimeType: string } | null | undefined;

export async function lagreArrangement(
  id: string | null,
  input: ArrangementInput,
  bildeEndring?: BildeEndring,
  serieId?: string | null,
) {
  if (!harDatabase()) {
    const lager = demolager();
    if (id) {
      const i = lager.arrangementer.findIndex((a) => a.id === id);
      if (i >= 0) lager.arrangementer[i] = { ...lager.arrangementer[i], ...input };
      return id;
    }
    const nyId = `d${Date.now()}`;
    lager.arrangementer.push({
      ...input,
      bilde_generert: bildeEndring ? new Date().toISOString() : null,
      serie_id: serieId ?? null,
      id: nyId,
      opprettet: new Date().toISOString(),
    });
    return nyId;
  }

  const db = hentDb();
  const na = new Date().toISOString();
  const verdier = {
    slug: input.slug,
    tittel: input.tittel,
    ingress: input.ingress,
    beskrivelse: input.beskrivelse,
    starter: input.starter,
    slutter: input.slutter,
    sted: input.sted,
    trengs: input.trengs,
    pamelding_stenger: input.pamelding_stenger,
    krev_telefon: input.krev_telefon ? 1 : 0,
    krev_epost: input.krev_epost ? 1 : 0,
    ansvarlig_navn: input.ansvarlig_navn,
    ansvarlig_epost: input.ansvarlig_epost,
    publisert: input.publisert ? 1 : 0,
  };

  // Bildet er tungt, og de aller fleste lagringer rører det ikke i det
  // hele tatt — derfor egen håndtering i stedet for å alltid skrive over.
  const bildeFelt =
    bildeEndring === undefined
      ? null
      : bildeEndring === null
        ? { bilde: null, bilde_type: null, bilde_generert: null }
        : { bilde: bildeEndring.data, bilde_type: bildeEndring.mimeType, bilde_generert: na };

  if (id) {
    db.prepare(
      `update arrangementer set
         slug = @slug, tittel = @tittel, ingress = @ingress, beskrivelse = @beskrivelse,
         starter = @starter, slutter = @slutter, sted = @sted, trengs = @trengs,
         pamelding_stenger = @pamelding_stenger,
         krev_telefon = @krev_telefon, krev_epost = @krev_epost,
         ansvarlig_navn = @ansvarlig_navn, ansvarlig_epost = @ansvarlig_epost,
         publisert = @publisert, endret = @endret
       where id = @id`,
    ).run({ ...verdier, endret: na, id });

    if (bildeFelt) {
      db.prepare(
        `update arrangementer set bilde = @bilde, bilde_type = @bilde_type, bilde_generert = @bilde_generert
         where id = @id`,
      ).run({ ...bildeFelt, id });
    }
    return id;
  }

  const nyId = randomUUID();
  db.prepare(
    `insert into arrangementer
       (id, slug, tittel, ingress, beskrivelse, starter, slutter, sted, trengs,
        pamelding_stenger, krev_telefon, krev_epost,
        ansvarlig_navn, ansvarlig_epost, publisert,
        bilde, bilde_type, bilde_generert, serie_id, opprettet, endret)
     values
       (@id, @slug, @tittel, @ingress, @beskrivelse, @starter, @slutter, @sted, @trengs,
        @pamelding_stenger, @krev_telefon, @krev_epost,
        @ansvarlig_navn, @ansvarlig_epost, @publisert,
        @bilde, @bilde_type, @bilde_generert, @serie_id, @opprettet, @endret)`,
  ).run({
    ...verdier,
    ...(bildeFelt ?? { bilde: null, bilde_type: null, bilde_generert: null }),
    serie_id: serieId ?? null,
    id: nyId,
    opprettet: na,
    endret: na,
  });
  return nyId;
}

/** De andre forekomstene i samme serie, til navigering fra én forekomst. */
export async function hentArrangementerISerie(
  serieId: string,
  unntattId?: string,
): Promise<{ id: string; tittel: string; starter: string }[]> {
  if (!harDatabase()) {
    return demolager()
      .arrangementer.filter((a) => a.serie_id === serieId && a.id !== unntattId)
      .sort((a, b) => a.starter.localeCompare(b.starter))
      .map((a) => ({ id: a.id, tittel: a.tittel, starter: a.starter }));
  }
  return hentDb()
    .prepare(
      `select id, tittel, starter from arrangementer
        where serie_id = ? and id != ?
        order by starter asc`,
    )
    .all(serieId, unntattId ?? "") as { id: string; tittel: string; starter: string }[];
}

/** Sletter alle forekomstene i en serie, inkludert påmeldingene deres. */
export async function slettSerie(serieId: string) {
  if (!harDatabase()) {
    const lager = demolager();
    const ider = new Set(
      lager.arrangementer.filter((a) => a.serie_id === serieId).map((a) => a.id),
    );
    lager.arrangementer = lager.arrangementer.filter((a) => a.serie_id !== serieId);
    lager.pameldinger = lager.pameldinger.filter((p) => !ider.has(p.arrangement_id));
    return;
  }
  hentDb().prepare(`delete from arrangementer where serie_id = ?`).run(serieId);
}

/** Bildebytene til et arrangement, til /api/offentlig/bilde/{id}. */
export async function hentBilde(id: string): Promise<GenerertBildeRad | null> {
  if (!harDatabase()) return null;
  const rad = hentDb()
    .prepare(`select bilde, bilde_type from arrangementer where id = ?`)
    .get(id) as { bilde: Buffer | null; bilde_type: string | null } | undefined;
  if (!rad?.bilde || !rad.bilde_type) return null;
  return { data: rad.bilde, mimeType: rad.bilde_type };
}

type GenerertBildeRad = { data: Buffer; mimeType: string };

export async function slettArrangement(id: string) {
  if (!harDatabase()) {
    const lager = demolager();
    lager.arrangementer = lager.arrangementer.filter((a) => a.id !== id);
    lager.pameldinger = lager.pameldinger.filter((p) => p.arrangement_id !== id);
    return;
  }
  hentDb().prepare(`delete from arrangementer where id = ?`).run(id);
}

/**
 * Nettadressen lages av tittelen, ikke for hånd. Finnes den allerede — to
 * kirkekaffer heter det samme — legger vi på et tall til den er ledig.
 */
export async function finnLedigSlug(basis: string): Promise<string> {
  const brukte = new Set<string>();

  if (!harDatabase()) {
    demolager().arrangementer.forEach((a) => brukte.add(a.slug));
  } else {
    const rader = hentDb()
      .prepare(`select slug from arrangementer where slug like ?`)
      .all(`${basis}%`) as { slug: string }[];
    rader.forEach((r) => brukte.add(r.slug));
  }

  if (!brukte.has(basis)) return basis;
  for (let n = 2; n < 200; n++) {
    if (!brukte.has(`${basis}-${n}`)) return `${basis}-${n}`;
  }
  return `${basis}-${Date.now()}`;
}

/* ── Enheter (telefoner som skal ha varsler) ─────────────────────────── */

/** Lagrer eller oppdaterer en Expo-push-token, og gir tilbake enhetens id. */
export async function lagreEnhet(token: string, plattform: string | null) {
  if (!harDatabase()) return `demo-enhet-${token.slice(-8)}`;

  const na = new Date().toISOString();
  const rad = hentDb()
    .prepare(
      `insert into enheter (id, expo_token, plattform, opprettet, sist_sett)
       values (?, ?, ?, ?, ?)
       on conflict(expo_token) do update set
         sist_sett = excluded.sist_sett,
         plattform = coalesce(excluded.plattform, enheter.plattform)
       returning id`,
    )
    .get(randomUUID(), token, plattform, na, na) as { id: string };
  return rad.id;
}

export type Paaminnelse = {
  pamelding_id: string;
  expo_token: string;
  slug: string;
  tittel: string;
  starter: string;
  sted: string;
};

/**
 * Frivillige til arrangementer som starter om mellom 20 og 28 timer, der
 * telefonen skal ha påminnelse og den ikke er sendt fra før.
 */
export async function hentForfaltePaaminnelser(): Promise<Paaminnelse[]> {
  if (!harDatabase()) return [];

  const na = Date.now();
  const fra = new Date(na + 20 * 3600_000).toISOString();
  const til = new Date(na + 28 * 3600_000).toISOString();

  return hentDb()
    .prepare(
      `select p.id as pamelding_id, e.expo_token, a.slug, a.tittel, a.starter, a.sted
         from pameldinger p
         join enheter e on e.id = p.enhet_id
         join arrangementer a on a.id = p.arrangement_id
        where p.avmeldt is null
          and p.paaminnelse_sendt is null
          and a.publisert = 1
          and a.starter between ? and ?`,
    )
    .all(fra, til) as Paaminnelse[];
}

export async function merkPaaminnelseSendt(pameldingIder: string[]) {
  if (!harDatabase() || pameldingIder.length === 0) return;
  const plassholdere = pameldingIder.map(() => "?").join(",");
  hentDb()
    .prepare(`update pameldinger set paaminnelse_sendt = ? where id in (${plassholdere})`)
    .run(new Date().toISOString(), ...pameldingIder);
}

/** Push-tokens til de frivillige på ett arrangement. */
export async function hentTokensFor(arrangementId: string): Promise<string[]> {
  if (!harDatabase()) return [];
  const rader = hentDb()
    .prepare(
      `select distinct e.expo_token
         from pameldinger p
         join enheter e on e.id = p.enhet_id
        where p.arrangement_id = ? and p.avmeldt is null`,
    )
    .all(arrangementId) as { expo_token: string }[];
  return rader.map((r) => r.expo_token);
}

/**
 * Alle telefoner som har appen — mottakerne av «det trengs en frivillig».
 *
 * `unntattEnhetId` holder den som nettopp meldte avbud utenfor, og
 * `unntattArrangementId` holder dem som alt står på lista utenfor: de har
 * allerede sagt ja, og trenger ikke en oppfordring om å gjøre det igjen.
 */
export async function hentAlleTokens(
  {
    unntattEnhetId,
    unntattArrangementId,
  }: { unntattEnhetId?: string | null; unntattArrangementId?: string | null } = {},
): Promise<string[]> {
  if (!harDatabase()) return [];

  const betingelser: string[] = [];
  const verdier: string[] = [];
  if (unntattEnhetId) {
    betingelser.push(`e.id != ?`);
    verdier.push(unntattEnhetId);
  }
  if (unntattArrangementId) {
    betingelser.push(
      `not exists (
         select 1 from pameldinger p
          where p.enhet_id = e.id and p.arrangement_id = ? and p.avmeldt is null
       )`,
    );
    verdier.push(unntattArrangementId);
  }

  const rader = hentDb()
    .prepare(
      `select e.expo_token from enheter e
        ${betingelser.length ? `where ${betingelser.join(" and ")}` : ""}`,
    )
    .all(...verdier) as { expo_token: string }[];
  return rader.map((r) => r.expo_token);
}

/* ── Varsel om nye oppgaver ──────────────────────────────────────────── */

/** Husker hvilke som er varslet i demomodus, der databasen ikke finnes. */
const demoVarslet = new Set<string>();

/**
 * Publiserte arrangementer som ennå ikke har utløst et «her trengs det
 * frivillige»-varsel. Serier deler ett varsel, ikke ett per forekomst.
 */
export async function hentUvarsledeArrangementer(): Promise<ArrangementMedAntall[]> {
  const grense = new Date().toISOString();

  if (!harDatabase()) {
    const { arrangementer, pameldinger } = demolager();
    return arrangementer
      .filter((a) => a.publisert && a.starter >= grense && !demoVarslet.has(a.id))
      .map((a) => ({ ...a, antall_frivillige: tellDemo(pameldinger, a.id) }));
  }

  const rader = hentDb()
    .prepare(
      `select * from arrangementer
        where publisert = 1
          and nyhetsvarsel_sendt is null
          and starter >= ?
        order by starter asc`,
    )
    .all(grense) as ArrangementRad[];
  return medAntall(rader);
}

export async function merkNyhetsvarselSendt(ider: string[]) {
  if (ider.length === 0) return;
  if (!harDatabase()) {
    ider.forEach((id) => demoVarslet.add(id));
    return;
  }
  const plassholdere = ider.map(() => "?").join(",");
  hentDb()
    .prepare(`update arrangementer set nyhetsvarsel_sendt = ? where id in (${plassholdere})`)
    .run(new Date().toISOString(), ...ider);
}

/* ── Hjelpere ────────────────────────────────────────────────────────── */

function tellDemo(pameldinger: Pamelding[], arrangementId: string) {
  return pameldinger.filter((p) => p.arrangement_id === arrangementId && !p.avmeldt).length;
}
