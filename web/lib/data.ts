import "server-only";
import { randomUUID } from "node:crypto";
import { harDatabase, hentDb } from "./db";
import { demolager } from "./demo";
import type {
  Arrangement,
  ArrangementMedAntall,
  PameldingMedDeltakere,
} from "@skjold/delt";

export { harDatabase };

/* ── Rå rader fra SQLite ─────────────────────────────────────────────── */
// SQLite har ingen boolean-type — sant/usant kommer tilbake som 0/1,
// og må gjøres om ved grensen mot resten av appen.

type ArrangementRad = Omit<
  Arrangement,
  "tillat_flere" | "sporr_om_kost" | "krev_telefon" | "krev_epost" | "publisert"
> & {
  tillat_flere: number;
  sporr_om_kost: number;
  krev_telefon: number;
  krev_epost: number;
  publisert: number;
  oppsummering_sendt: string | null;
  endret: string;
};

type PameldingRad = Omit<PameldingMedDeltakere, "deltakere">;

type DeltakerRad = {
  id: string;
  pamelding_id: string;
  navn: string;
  er_kontakt: number;
  kosthold: string | null;
};

function fraArrangementRad(rad: ArrangementRad, antallPameldte: number): ArrangementMedAntall {
  return {
    id: rad.id,
    slug: rad.slug,
    tittel: rad.tittel,
    ingress: rad.ingress,
    beskrivelse: rad.beskrivelse,
    starter: rad.starter,
    slutter: rad.slutter,
    sted: rad.sted,
    kapasitet: rad.kapasitet,
    pamelding_stenger: rad.pamelding_stenger,
    tillat_flere: Boolean(rad.tillat_flere),
    sporr_om_kost: Boolean(rad.sporr_om_kost),
    krev_telefon: Boolean(rad.krev_telefon),
    krev_epost: Boolean(rad.krev_epost),
    oppsummering_dager_for: rad.oppsummering_dager_for,
    ansvarlig_navn: rad.ansvarlig_navn,
    ansvarlig_epost: rad.ansvarlig_epost,
    publisert: Boolean(rad.publisert),
    opprettet: rad.opprettet,
    antall_pameldte: antallPameldte,
  };
}

/** Antall påmeldte deltakere per arrangement, i én spørring. */
function tellDeltakerePerArrangement(ider: string[]): Map<string, number> {
  const kart = new Map<string, number>();
  if (ider.length === 0) return kart;

  const plassholdere = ider.map(() => "?").join(",");
  const rader = hentDb()
    .prepare(
      `select p.arrangement_id as arrangement_id, count(*) as antall
         from deltakere d
         join pameldinger p on p.id = d.pamelding_id
        where p.avmeldt is null
          and p.arrangement_id in (${plassholdere})
        group by p.arrangement_id`,
    )
    .all(...ider) as { arrangement_id: string; antall: number }[];

  for (const r of rader) kart.set(r.arrangement_id, r.antall);
  return kart;
}

function medAntall(rader: ArrangementRad[]): ArrangementMedAntall[] {
  const antallKart = tellDeltakerePerArrangement(rader.map((r) => r.id));
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
      .map((a) => ({ ...a, antall_pameldte: tellDemo(pameldinger, a.id) }));
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
      .map((a) => ({ ...a, antall_pameldte: tellDemo(pameldinger, a.id) }));
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
    return a ? { ...a, antall_pameldte: tellDemo(pameldinger, a.id) } : null;
  }

  const rad = hentDb().prepare(`select * from arrangementer where slug = ?`).get(slug) as
    | ArrangementRad
    | undefined;
  if (!rad) return null;
  return fraArrangementRad(rad, tellDeltakerePerArrangement([rad.id]).get(rad.id) ?? 0);
}

export async function hentArrangementMedId(id: string): Promise<ArrangementMedAntall | null> {
  if (!harDatabase()) {
    const { arrangementer, pameldinger } = demolager();
    const a = arrangementer.find((x) => x.id === id);
    return a ? { ...a, antall_pameldte: tellDemo(pameldinger, a.id) } : null;
  }

  const rad = hentDb().prepare(`select * from arrangementer where id = ?`).get(id) as
    | ArrangementRad
    | undefined;
  if (!rad) return null;
  return fraArrangementRad(rad, tellDeltakerePerArrangement([rad.id]).get(rad.id) ?? 0);
}

export async function hentPameldinger(arrangementId: string): Promise<PameldingMedDeltakere[]> {
  if (!harDatabase()) {
    return demolager()
      .pameldinger.filter((p) => p.arrangement_id === arrangementId && !p.avmeldt)
      .sort((a, b) => a.opprettet.localeCompare(b.opprettet));
  }

  const db = hentDb();
  const pameldinger = db
    .prepare(`select * from pameldinger where arrangement_id = ? and avmeldt is null order by opprettet asc`)
    .all(arrangementId) as PameldingRad[];
  if (pameldinger.length === 0) return [];

  const ider = pameldinger.map((p) => p.id);
  const plassholdere = ider.map(() => "?").join(",");
  const deltakerrader = db
    .prepare(
      `select * from deltakere where pamelding_id in (${plassholdere}) order by er_kontakt desc, opprettet asc`,
    )
    .all(...ider) as DeltakerRad[];

  const perPamelding = new Map<string, PameldingMedDeltakere["deltakere"]>();
  for (const d of deltakerrader) {
    const liste = perPamelding.get(d.pamelding_id) ?? [];
    liste.push({
      id: d.id,
      pamelding_id: d.pamelding_id,
      navn: d.navn,
      er_kontakt: Boolean(d.er_kontakt),
      kosthold: d.kosthold,
    });
    perPamelding.set(d.pamelding_id, liste);
  }

  return pameldinger.map((p) => ({ ...p, deltakere: perPamelding.get(p.id) ?? [] }));
}

/* ── Skriving ────────────────────────────────────────────────────────── */

export type NyPamelding = {
  arrangementId: string;
  enhetId?: string | null;
  kontaktNavn: string;
  kontaktTelefon: string | null;
  kontaktEpost: string | null;
  melding: string | null;
  deltakere: { navn: string; kosthold: string | null }[];
};

export async function opprettPamelding(input: NyPamelding): Promise<string> {
  if (!harDatabase()) {
    const lager = demolager();
    const id = `p${lager.pameldinger.length}-${Date.now()}`;
    lager.pameldinger.push({
      id,
      arrangement_id: input.arrangementId,
      kontakt_navn: input.kontaktNavn,
      kontakt_telefon: input.kontaktTelefon,
      kontakt_epost: input.kontaktEpost,
      melding: input.melding,
      avmeldt: null,
      opprettet: new Date().toISOString(),
      deltakere: input.deltakere.map((d, i) => ({
        id: `${id}-${i}`,
        pamelding_id: id,
        navn: d.navn,
        er_kontakt: i === 0,
        kosthold: d.kosthold,
      })),
    });
    return id;
  }

  const db = hentDb();
  const id = randomUUID();
  const na = new Date().toISOString();

  // Påmeldingen og deltakerne må komme inn samlet. Går det galt halvveis,
  // skal det ikke ligge igjen en påmelding uten navn på.
  const settInn = db.transaction(() => {
    db.prepare(
      `insert into pameldinger
         (id, arrangement_id, enhet_id, kontakt_navn, kontakt_telefon, kontakt_epost, melding, opprettet)
       values (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      input.arrangementId,
      input.enhetId ?? null,
      input.kontaktNavn,
      input.kontaktTelefon,
      input.kontaktEpost,
      input.melding,
      na,
    );

    const settDeltaker = db.prepare(
      `insert into deltakere (id, pamelding_id, navn, er_kontakt, kosthold, opprettet)
       values (?, ?, ?, ?, ?, ?)`,
    );
    input.deltakere.forEach((d, i) => {
      settDeltaker.run(randomUUID(), id, d.navn, i === 0 ? 1 : 0, d.kosthold, na);
    });
  });
  settInn();

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

export type ArrangementInput = Omit<Arrangement, "id" | "opprettet">;

export async function lagreArrangement(id: string | null, input: ArrangementInput) {
  if (!harDatabase()) {
    const lager = demolager();
    if (id) {
      const i = lager.arrangementer.findIndex((a) => a.id === id);
      if (i >= 0) lager.arrangementer[i] = { ...lager.arrangementer[i], ...input };
      return id;
    }
    const nyId = `d${Date.now()}`;
    lager.arrangementer.push({ ...input, id: nyId, opprettet: new Date().toISOString() });
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
    kapasitet: input.kapasitet,
    pamelding_stenger: input.pamelding_stenger,
    tillat_flere: input.tillat_flere ? 1 : 0,
    sporr_om_kost: input.sporr_om_kost ? 1 : 0,
    krev_telefon: input.krev_telefon ? 1 : 0,
    krev_epost: input.krev_epost ? 1 : 0,
    oppsummering_dager_for: input.oppsummering_dager_for,
    ansvarlig_navn: input.ansvarlig_navn,
    ansvarlig_epost: input.ansvarlig_epost,
    publisert: input.publisert ? 1 : 0,
  };

  if (id) {
    db.prepare(
      `update arrangementer set
         slug = @slug, tittel = @tittel, ingress = @ingress, beskrivelse = @beskrivelse,
         starter = @starter, slutter = @slutter, sted = @sted, kapasitet = @kapasitet,
         pamelding_stenger = @pamelding_stenger, tillat_flere = @tillat_flere,
         sporr_om_kost = @sporr_om_kost, krev_telefon = @krev_telefon, krev_epost = @krev_epost,
         oppsummering_dager_for = @oppsummering_dager_for, ansvarlig_navn = @ansvarlig_navn,
         ansvarlig_epost = @ansvarlig_epost, publisert = @publisert, endret = @endret
       where id = @id`,
    ).run({ ...verdier, endret: na, id });
    return id;
  }

  const nyId = randomUUID();
  db.prepare(
    `insert into arrangementer
       (id, slug, tittel, ingress, beskrivelse, starter, slutter, sted, kapasitet,
        pamelding_stenger, tillat_flere, sporr_om_kost, krev_telefon, krev_epost,
        oppsummering_dager_for, ansvarlig_navn, ansvarlig_epost, publisert, opprettet, endret)
     values
       (@id, @slug, @tittel, @ingress, @beskrivelse, @starter, @slutter, @sted, @kapasitet,
        @pamelding_stenger, @tillat_flere, @sporr_om_kost, @krev_telefon, @krev_epost,
        @oppsummering_dager_for, @ansvarlig_navn, @ansvarlig_epost, @publisert, @opprettet, @endret)`,
  ).run({ ...verdier, id: nyId, opprettet: na, endret: na });
  return nyId;
}

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
 * formiddagstreff heter det samme — legger vi på et tall til den er ledig.
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

/* ── Enheter (telefoner som skal ha påminnelser) ─────────────────────── */

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
  tittel: string;
  starter: string;
  sted: string;
};

/**
 * Påmeldinger til arrangementer som starter om mellom 20 og 28 timer,
 * der telefonen skal ha påminnelse og den ikke er sendt fra før.
 */
export async function hentForfaltePaaminnelser(): Promise<Paaminnelse[]> {
  if (!harDatabase()) return [];

  const na = Date.now();
  const fra = new Date(na + 20 * 3600_000).toISOString();
  const til = new Date(na + 28 * 3600_000).toISOString();

  return hentDb()
    .prepare(
      `select p.id as pamelding_id, e.expo_token, a.tittel, a.starter, a.sted
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

/** Push-tokens til alle som er påmeldt et arrangement. */
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

/* ── Oppsummering til ansvarlig ──────────────────────────────────────── */

/** Husker hvilke som er sendt i demomodus, der databasen ikke finnes. */
const demoSendte = new Set<string>();

/**
 * Arrangementer der oppsummeringen er slått på, ikke sendt ennå, og som
 * ikke har vært. Cron-jobben avgjør selv hvilke som er forfalt.
 */
export async function hentKandidaterForOppsummering(): Promise<ArrangementMedAntall[]> {
  const grense = new Date(Date.now() - 6 * 3600_000).toISOString();

  if (!harDatabase()) {
    const { arrangementer, pameldinger } = demolager();
    return arrangementer
      .filter(
        (a) =>
          a.publisert &&
          a.oppsummering_dager_for !== null &&
          a.ansvarlig_epost &&
          a.starter >= grense &&
          !demoSendte.has(a.id),
      )
      .map((a) => ({ ...a, antall_pameldte: tellDemo(pameldinger, a.id) }));
  }

  const rader = hentDb()
    .prepare(
      `select * from arrangementer
        where publisert = 1
          and oppsummering_dager_for is not null
          and ansvarlig_epost is not null
          and oppsummering_sendt is null
          and starter >= ?`,
    )
    .all(grense) as ArrangementRad[];
  return medAntall(rader);
}

export async function merkOppsummeringSendt(id: string) {
  if (!harDatabase()) {
    demoSendte.add(id);
    return;
  }
  hentDb()
    .prepare(`update arrangementer set oppsummering_sendt = ? where id = ?`)
    .run(new Date().toISOString(), id);
}

/* ── Hjelpere ────────────────────────────────────────────────────────── */

function tellDemo(pameldinger: PameldingMedDeltakere[], arrangementId: string) {
  return pameldinger
    .filter((p) => p.arrangement_id === arrangementId && !p.avmeldt)
    .reduce((sum, p) => sum + p.deltakere.length, 0);
}
