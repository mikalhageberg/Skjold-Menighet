import "server-only";
import { harDatabase, sql } from "./db";
import { demolager } from "./demo";
import type {
  Arrangement,
  ArrangementMedAntall,
  PameldingMedDeltakere,
} from "@skjold/delt";

export { harDatabase };

/* ── Lesing ──────────────────────────────────────────────────────────── */

/**
 * Alle spørringer henter antall påmeldte i samme runde. Uten det ville
 * en liste med tolv arrangementer blitt tretten spørringer.
 */
const medAntall = () => sql`
  select a.*,
         coalesce(t.antall, 0)::int as antall_pameldte
    from arrangementer a
    left join (
      select p.arrangement_id, count(d.id) as antall
        from pameldinger p
        join deltakere d on d.pamelding_id = p.id
       where p.avmeldt is null
       group by p.arrangement_id
    ) t on t.arrangement_id = a.id
`;

export async function hentKommende(): Promise<ArrangementMedAntall[]> {
  const grense = new Date(Date.now() - 3 * 3600_000);

  if (!harDatabase()) {
    const { arrangementer, pameldinger } = demolager();
    return arrangementer
      .filter((a) => a.publisert && new Date(a.starter) >= grense)
      .sort((a, b) => a.starter.localeCompare(b.starter))
      .map((a) => ({ ...a, antall_pameldte: tellDemo(pameldinger, a.id) }));
  }

  const rader = await sql`
    ${medAntall()}
    where a.publisert and a.starter >= ${grense}
    order by a.starter asc
  `;
  return rader as unknown as ArrangementMedAntall[];
}

export async function hentAlle(): Promise<ArrangementMedAntall[]> {
  if (!harDatabase()) {
    const { arrangementer, pameldinger } = demolager();
    return [...arrangementer]
      .sort((a, b) => b.starter.localeCompare(a.starter))
      .map((a) => ({ ...a, antall_pameldte: tellDemo(pameldinger, a.id) }));
  }

  const rader = await sql`${medAntall()} order by a.starter desc`;
  return rader as unknown as ArrangementMedAntall[];
}

export async function hentArrangement(slug: string): Promise<ArrangementMedAntall | null> {
  if (!harDatabase()) {
    const { arrangementer, pameldinger } = demolager();
    const a = arrangementer.find((x) => x.slug === slug);
    return a ? { ...a, antall_pameldte: tellDemo(pameldinger, a.id) } : null;
  }

  const [rad] = await sql`${medAntall()} where a.slug = ${slug} limit 1`;
  return (rad as unknown as ArrangementMedAntall) ?? null;
}

export async function hentArrangementMedId(id: string): Promise<ArrangementMedAntall | null> {
  if (!harDatabase()) {
    const { arrangementer, pameldinger } = demolager();
    const a = arrangementer.find((x) => x.id === id);
    return a ? { ...a, antall_pameldte: tellDemo(pameldinger, a.id) } : null;
  }

  const [rad] = await sql`${medAntall()} where a.id = ${id} limit 1`;
  return (rad as unknown as ArrangementMedAntall) ?? null;
}

export async function hentPameldinger(arrangementId: string): Promise<PameldingMedDeltakere[]> {
  if (!harDatabase()) {
    return demolager()
      .pameldinger.filter((p) => p.arrangement_id === arrangementId && !p.avmeldt)
      .sort((a, b) => a.opprettet.localeCompare(b.opprettet));
  }

  // Deltakerne samles til en json-liste i databasen, så vi slipper å sy
  // sammen to resultatsett her.
  const rader = await sql`
    select p.*,
           coalesce(
             (select json_agg(d order by d.er_kontakt desc, d.opprettet)
                from deltakere d
               where d.pamelding_id = p.id),
             '[]'::json
           ) as deltakere
      from pameldinger p
     where p.arrangement_id = ${arrangementId}
       and p.avmeldt is null
     order by p.opprettet asc
  `;
  return rader as unknown as PameldingMedDeltakere[];
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

  // Påmeldingen og deltakerne må komme inn samlet. Går det galt halvveis,
  // skal det ikke ligge igjen en påmelding uten navn på.
  return sql.begin(async (tx) => {
    const [pamelding] = await tx`
      insert into pameldinger
        (arrangement_id, enhet_id, kontakt_navn, kontakt_telefon, kontakt_epost, melding)
      values
        (${input.arrangementId}, ${input.enhetId ?? null}, ${input.kontaktNavn},
         ${input.kontaktTelefon}, ${input.kontaktEpost}, ${input.melding})
      returning id
    `;

    await tx`
      insert into deltakere ${tx(
        input.deltakere.map((d, i) => ({
          pamelding_id: pamelding.id as string,
          navn: d.navn,
          er_kontakt: i === 0,
          kosthold: d.kosthold,
        })),
      )}
    `;

    return pamelding.id as string;
  }) as Promise<string>;
}

export async function slettPamelding(id: string) {
  if (!harDatabase()) {
    const lager = demolager();
    lager.pameldinger = lager.pameldinger.filter((p) => p.id !== id);
    return;
  }
  await sql`delete from pameldinger where id = ${id}`;
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

  if (id) {
    await sql`update arrangementer set ${sql(input)} where id = ${id}`;
    return id;
  }
  const [rad] = await sql`insert into arrangementer ${sql(input)} returning id`;
  return rad.id as string;
}

export async function slettArrangement(id: string) {
  if (!harDatabase()) {
    const lager = demolager();
    lager.arrangementer = lager.arrangementer.filter((a) => a.id !== id);
    lager.pameldinger = lager.pameldinger.filter((p) => p.arrangement_id !== id);
    return;
  }
  await sql`delete from arrangementer where id = ${id}`;
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
    const rader = await sql`select slug from arrangementer where slug like ${basis + "%"}`;
    rader.forEach((r) => brukte.add(r.slug as string));
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

  const [rad] = await sql`
    insert into enheter (expo_token, plattform)
    values (${token}, ${plattform})
    on conflict (expo_token)
      do update set sist_sett = now(), plattform = coalesce(${plattform}, enheter.plattform)
    returning id
  `;
  return rad.id as string;
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

  const rader = await sql`
    select p.id as pamelding_id, e.expo_token, a.tittel, a.starter, a.sted
      from pameldinger p
      join enheter e on e.id = p.enhet_id
      join arrangementer a on a.id = p.arrangement_id
     where p.avmeldt is null
       and p.paaminnelse_sendt is null
       and a.publisert
       and a.starter between now() + interval '20 hours' and now() + interval '28 hours'
  `;
  return rader as unknown as Paaminnelse[];
}

export async function merkPaaminnelseSendt(pameldingIder: string[]) {
  if (!harDatabase() || pameldingIder.length === 0) return;
  await sql`update pameldinger set paaminnelse_sendt = now() where id in ${sql(pameldingIder)}`;
}

/** Push-tokens til alle som er påmeldt et arrangement. */
export async function hentTokensFor(arrangementId: string): Promise<string[]> {
  if (!harDatabase()) return [];
  const rader = await sql`
    select distinct e.expo_token
      from pameldinger p
      join enheter e on e.id = p.enhet_id
     where p.arrangement_id = ${arrangementId} and p.avmeldt is null
  `;
  return rader.map((r) => r.expo_token as string);
}

/* ── Oppsummering til ansvarlig ──────────────────────────────────────── */

/** Husker hvilke som er sendt i demomodus, der databasen ikke finnes. */
const demoSendte = new Set<string>();

/**
 * Arrangementer der oppsummeringen er slått på, ikke sendt ennå, og som
 * ikke har vært. Cron-jobben avgjør selv hvilke som er forfalt.
 */
export async function hentKandidaterForOppsummering(): Promise<ArrangementMedAntall[]> {
  const grense = new Date(Date.now() - 6 * 3600_000);

  if (!harDatabase()) {
    const { arrangementer, pameldinger } = demolager();
    return arrangementer
      .filter(
        (a) =>
          a.publisert &&
          a.oppsummering_dager_for !== null &&
          a.ansvarlig_epost &&
          new Date(a.starter) >= grense &&
          !demoSendte.has(a.id),
      )
      .map((a) => ({ ...a, antall_pameldte: tellDemo(pameldinger, a.id) }));
  }

  const rader = await sql`
    ${medAntall()}
    where a.publisert
      and a.oppsummering_dager_for is not null
      and a.ansvarlig_epost is not null
      and a.oppsummering_sendt is null
      and a.starter >= ${grense}
  `;
  return rader as unknown as ArrangementMedAntall[];
}

export async function merkOppsummeringSendt(id: string) {
  if (!harDatabase()) {
    demoSendte.add(id);
    return;
  }
  await sql`update arrangementer set oppsummering_sendt = now() where id = ${id}`;
}

/* ── Hjelpere ────────────────────────────────────────────────────────── */

function tellDemo(pameldinger: PameldingMedDeltakere[], arrangementId: string) {
  return pameldinger
    .filter((p) => p.arrangement_id === arrangementId && !p.avmeldt)
    .reduce((sum, p) => sum + p.deltakere.length, 0);
}
