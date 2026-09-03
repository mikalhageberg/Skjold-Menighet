import "server-only";
import { randomUUID } from "node:crypto";
import { harDatabase, hentDb } from "./db";

/**
 * De som har bedt om å få Android-appen tilsendt.
 *
 * Android-appen ligger i lukket test hos Google Play, og Google slipper
 * bare inn adresser som er lastet opp i Play Console på forhånd. Derfor
 * kan vi ikke bare vise en Play-lenke: adressen må innom oss først.
 *
 * En tester er «ventende» til den ansvarlige har lastet opp lista i Play
 * Console og trykt «Lagt til alle foreløpige e-poster» på /android. Da
 * settes lagt_til, lenken går ut på e-post, og lista er tom igjen for
 * neste runde.
 */

export type Androidtester = {
  id: string;
  epost: string;
  opprettet: string;
  lagt_til: string | null;
};

/* ── Demomodus ───────────────────────────────────────────────────────── */
// Uten database ligger testerne i minnet, på samme måte som resten av
// demodataene, slik at hele flyten kan prøves med `npm run dev`.

const globalt = globalThis as unknown as { __skjoldTestere?: Androidtester[] };

function demolager(): Androidtester[] {
  return (globalt.__skjoldTestere ??= []);
}

/* ── Adressen ────────────────────────────────────────────────────────── */

// Bevisst romslig: det er Google som avgjør om adressen duger, og et for
// strengt filter her stenger ute folk med helt vanlige adresser.
const EPOST = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Renser og godkjenner en adresse. Gir null når den ikke kan brukes. */
export function ryddEpost(ra: string): string | null {
  const epost = ra.trim().toLowerCase();
  if (epost.length > 254 || !EPOST.test(epost)) return null;
  return epost;
}

/* ── Lesing ──────────────────────────────────────────────────────────── */

export type Testeroversikt = {
  /** Ikke lagt inn i Play Console ennå — dette er CSV-fila. */
  ventende: Androidtester[];
  /** Lagt inn og varslet. Nyeste først. */
  ferdige: Androidtester[];
};

export async function hentTestere(): Promise<Testeroversikt> {
  const alle = harDatabase()
    ? (hentDb()
        .prepare(
          `select id, epost, opprettet, lagt_til
             from android_testere
            order by opprettet`,
        )
        .all() as Androidtester[])
    : [...demolager()].sort((a, b) => a.opprettet.localeCompare(b.opprettet));

  return {
    ventende: alle.filter((t) => !t.lagt_til),
    ferdige: alle.filter((t) => t.lagt_til).reverse(),
  };
}

/* ── Skriving ────────────────────────────────────────────────────────── */

export type Paameldingssvar =
  | { ok: true; ny: boolean }
  | { ok: false; feil: string };

/**
 * Tar imot en adresse fra nedlastingssiden.
 *
 * Står adressen der fra før, sier vi det samme som til alle andre — den
 * som har prøvd to ganger skal ikke lure på om det gikk galt, og en
 * ny rad ville uansett bare gitt dobbel e-post senere.
 */
export async function meldPaaTest(ra: string): Promise<Paameldingssvar> {
  const epost = ryddEpost(ra);
  if (!epost) {
    return { ok: false, feil: "Skriv e-postadressen slik den ser ut, for eksempel navn@example.no." };
  }

  const na = new Date().toISOString();

  if (!harDatabase()) {
    const lager = demolager();
    if (lager.some((t) => t.epost === epost)) return { ok: true, ny: false };
    lager.push({ id: randomUUID(), epost, opprettet: na, lagt_til: null });
    return { ok: true, ny: true };
  }

  try {
    const resultat = hentDb()
      .prepare(
        `insert into android_testere (id, epost, opprettet, lagt_til)
         values (?, ?, ?, null)
         on conflict(epost) do nothing`,
      )
      .run(randomUUID(), epost, na);
    return { ok: true, ny: resultat.changes > 0 };
  } catch (feil) {
    console.error("Kunne ikke lagre Android-tester", feil);
    return { ok: false, feil: "Adressen ble ikke lagret. Prøv igjen om litt." };
  }
}

/**
 * Merker testerne som lagt inn i Play Console og varslet.
 *
 * Kalles med én og én id etter at e-posten faktisk gikk av gårde, slik at
 * en adresse Brevo ikke fikk sendt til blir stående på lista og kommer med
 * neste gang knappen trykkes.
 */
export async function merkLagtTil(ider: string[]) {
  if (ider.length === 0) return;
  const na = new Date().toISOString();

  if (!harDatabase()) {
    for (const t of demolager()) {
      if (ider.includes(t.id)) t.lagt_til = na;
    }
    return;
  }

  const db = hentDb();
  const setning = db.prepare(`update android_testere set lagt_til = ? where id = ?`);
  const alle = db.transaction((liste: string[]) => {
    for (const id of liste) setning.run(na, id);
  });
  alle(ider);
}
