"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import {
  finnLedigSlug,
  hentArrangementMedId,
  hentPameldinger,
  lagreArrangement,
  slettArrangement,
  slettPamelding,
  slettSerie,
  type ArrangementInput,
  type BildeEndring,
} from "@/lib/data";
import { sendOppsummering, sendTilPameldte } from "@/lib/brevo";
import { genererBilde } from "@/lib/gemini";
import { krevAdmin, demomodus } from "@/lib/auth";
import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";
import { lagSlug } from "@skjold/delt";

export type Svar = { ok: boolean; melding?: string };

/* ── Innlogging ──────────────────────────────────────────────────────── */

export async function loggInn(_forrige: Svar, data: FormData): Promise<Svar> {
  if (demomodus()) return { ok: false, melding: "Databasen er ikke satt opp ennå." };

  const epost = String(data.get("epost") ?? "").trim();
  const passord = String(data.get("passord") ?? "");
  if (!epost || !passord) return { ok: false, melding: "Fyll inn e-post og passord." };

  try {
    await signIn("credentials", { epost, passord, redirectTo: "/admin" });
  } catch (feil) {
    // signIn kaster en omdirigering ved suksess — den skal boble videre.
    if (feil instanceof AuthError) {
      return { ok: false, melding: "Feil e-post eller passord." };
    }
    throw feil;
  }

  return { ok: true };
}

export async function loggUt() {
  await signOut({ redirectTo: "/admin/logg-inn" });
}

/* ── Arrangementer ───────────────────────────────────────────────────── */

type ArrangementUtenSlug = Omit<ArrangementInput, "slug">;

function lesArrangement(data: FormData): ArrangementUtenSlug | string {
  const tittel = String(data.get("tittel") ?? "").trim();
  const starter = String(data.get("starter") ?? "");
  if (!tittel) return "Arrangementet trenger et navn.";
  if (!starter) return "Sett et tidspunkt for når det starter.";

  const tall = (n: string) => {
    const v = String(data.get(n) ?? "").trim();
    return v === "" ? null : Number(v);
  };
  const tekst = (n: string) => {
    const v = String(data.get(n) ?? "").trim();
    return v === "" ? null : v;
  };
  const tid = (n: string) => {
    const v = String(data.get(n) ?? "").trim();
    return v === "" ? null : new Date(v).toISOString();
  };

  const kapasitet = tall("kapasitet");
  if (kapasitet !== null && (!Number.isInteger(kapasitet) || kapasitet < 1))
    return "Antall plasser må være et helt tall, eller stå tomt for ubegrenset.";

  return {
    tittel,
    ingress: tekst("ingress"),
    beskrivelse: tekst("beskrivelse"),
    starter: new Date(starter).toISOString(),
    slutter: tid("slutter"),
    sted: String(data.get("sted") ?? "").trim() || "Skjold kirke",
    kapasitet,
    pamelding_stenger: tid("pamelding_stenger"),
    tillat_flere: data.get("tillat_flere") === "på",
    sporr_om_kost: data.get("sporr_om_kost") === "på",
    krev_telefon: data.get("krev_telefon") === "på",
    krev_epost: data.get("krev_epost") === "på",
    oppsummering_dager_for:
      data.get("oppsummering_dager_for") === "av"
        ? null
        : Number(data.get("oppsummering_dager_for") ?? 1),
    ansvarlig_navn: tekst("ansvarlig_navn"),
    ansvarlig_epost: tekst("ansvarlig_epost"),
    publisert: data.get("publisert") === "på",
  };
}

/** Tolker de skjulte feltene fra BildeVelger. */
function lesBildeEndring(data: FormData): BildeEndring {
  if (data.get("bilde_fjern") === "på") return null;
  const dataUrl = String(data.get("bilde_data") ?? "");
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return undefined;
  return { mimeType: match[1], data: Buffer.from(match[2], "base64") };
}

/**
 * Genererer et headline-bilde til bruk i BildeVelger, uten å lagre noe —
 * arrangementet finnes kanskje ikke i databasen ennå. Selve bytene sendes
 * tilbake som en data-URL og følger med resten av skjemaet ved lagring.
 */
export async function genererBildeAction(
  tittel: string,
): Promise<{ ok: true; dataUrl: string } | { ok: false; feil: string }> {
  await krevAdmin();
  if (!tittel.trim()) return { ok: false, feil: "Skriv inn et navn på arrangementet først." };

  const svar = await genererBilde(tittel.trim());
  if (!svar.ok) return { ok: false, feil: svar.grunn };

  return {
    ok: true,
    dataUrl: `data:${svar.bilde.mimeType};base64,${svar.bilde.data.toString("base64")}`,
  };
}

/** Flytter en «YYYY-MM-DDTHH:mm»-e.l. inputverdi et antall hele dager. */
function skyvDager(naiv: string, dager: number): string {
  if (!naiv || dager === 0) return naiv;
  const [datoDel, resten] = naiv.split("T");
  const [aar, maned, dag] = datoDel.split("-").map(Number);
  const ny = new Date(aar, maned - 1, dag + dager);
  const p = (n: number) => String(n).padStart(2, "0");
  const nyDatoDel = `${ny.getFullYear()}-${p(ny.getMonth() + 1)}-${p(ny.getDate())}`;
  return resten ? `${nyDatoDel}T${resten}` : nyDatoDel;
}

const MAKS_FOREKOMSTER = 52;

/**
 * Leser gjentakelsesfeltene og regner ut hvor mange dager hver forekomst
 * skal flyttes fra den første. Selve gjentakelsesregelen lagres aldri —
 * bare de ferdige datoene, som hver blir en helt vanlig, selvstendig rad.
 */
function lesGjentakelse(data: FormData): number[] | string | null {
  if (data.get("gjenta") !== "på") return null;

  const hverUker = Number(data.get("gjenta_hver_uker") ?? 1);
  if (!Number.isInteger(hverUker) || hverUker < 1 || hverUker > 52) {
    return "Ugyldig intervall for gjentakelse.";
  }

  const til = String(data.get("gjenta_til") ?? "").trim();
  if (!til) return "Sett en sluttdato for gjentakelsen.";

  const startDatoDel = String(data.get("starter") ?? "").split("T")[0];
  if (!startDatoDel) return "Sett et starttidspunkt først.";

  const [aar0, maned0, dag0] = startDatoDel.split("-").map(Number);
  const [aarT, manedT, dagT] = til.split("-").map(Number);
  const sisteDato = new Date(aarT, manedT - 1, dagT);

  if (sisteDato < new Date(aar0, maned0 - 1, dag0)) {
    return "Sluttdatoen for gjentakelsen må være etter startdatoen.";
  }

  const offsets: number[] = [];
  for (let k = 0; offsets.length < MAKS_FOREKOMSTER; k++) {
    const dagerOffset = k * hverUker * 7;
    if (new Date(aar0, maned0 - 1, dag0 + dagerOffset) > sisteDato) break;
    offsets.push(dagerOffset);
  }
  return offsets.length > 0 ? offsets : "Fant ingen datoer innenfor perioden du valgte.";
}

export async function lagreArrangementAction(_forrige: Svar, data: FormData): Promise<Svar> {
  await krevAdmin();

  const resultat = lesArrangement(data);
  if (typeof resultat === "string") return { ok: false, melding: resultat };

  const id = String(data.get("id") ?? "") || null;
  const bildeEndring = lesBildeEndring(data);

  // Gjentakelse er bare et alternativ når man oppretter et helt nytt
  // arrangement — å gjøre et allerede lagret om til en serie i etterkant
  // er en annen, mer forvirrende operasjon vi ikke tilbyr.
  const gjentakelse = id ? null : lesGjentakelse(data);
  if (typeof gjentakelse === "string") return { ok: false, melding: gjentakelse };

  if (id || !gjentakelse) {
    // Nettadressen lages av tittelen og settes én gang. Den står fast når
    // tittelen endres senere, ellers ville lenker folk har delt slutte å virke.
    let slug: string;
    if (id) {
      const eksisterende = await hentArrangementMedId(id);
      if (!eksisterende) return { ok: false, melding: "Fant ikke arrangementet." };
      slug = eksisterende.slug;
    } else {
      slug = await finnLedigSlug(lagSlug(resultat.tittel) || "arrangement");
    }

    let lagretId: string;
    try {
      lagretId = await lagreArrangement(id, { ...resultat, slug }, bildeEndring);
    } catch (feil) {
      console.error("Kunne ikke lagre arrangement", feil);
      return { ok: false, melding: "Arrangementet ble ikke lagret. Prøv igjen." };
    }

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/arrangementer");
    revalidatePath(`/arrangement/${slug}`);
    redirect(`/admin/arrangement/${lagretId}?lagret=${id ? "endret" : "ny"}`);
  }

  // Gjentakelse: samme innhold, én rad per forekomst, delt serie-id.
  const serieId = randomUUID();
  const raStarter = String(data.get("starter") ?? "");
  const raSlutter = String(data.get("slutter") ?? "").trim();
  const raFrist = String(data.get("pamelding_stenger") ?? "").trim();

  let forsteId: string | null = null;
  try {
    for (const dagerOffset of gjentakelse) {
      const starter = new Date(skyvDager(raStarter, dagerOffset)).toISOString();
      const slutter = raSlutter
        ? new Date(skyvDager(raSlutter, dagerOffset)).toISOString()
        : null;
      const pameldingStenger = raFrist
        ? new Date(skyvDager(raFrist, dagerOffset)).toISOString()
        : null;

      const slug = await finnLedigSlug(lagSlug(resultat.tittel) || "arrangement");
      const nyId = await lagreArrangement(
        null,
        { ...resultat, slug, starter, slutter, pamelding_stenger: pameldingStenger },
        bildeEndring,
        serieId,
      );
      forsteId ??= nyId;
    }
  } catch (feil) {
    console.error("Kunne ikke lagre arrangementserien", feil);
    return { ok: false, melding: "Serien ble ikke lagret. Prøv igjen." };
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/arrangementer");
  redirect(`/admin/arrangement/${forsteId}?lagret=ny&antall=${gjentakelse.length}`);
}

export async function slettSerieAction(data: FormData) {
  await krevAdmin();
  const serieId = String(data.get("serie_id") ?? "");
  if (!serieId) return;
  await slettSerie(serieId);
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/arrangementer");
  redirect("/admin/arrangementer");
}

export async function slettArrangementAction(data: FormData) {
  await krevAdmin();
  const id = String(data.get("id") ?? "");
  if (!id) return;
  await slettArrangement(id);
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/arrangementer");
  redirect("/admin/arrangementer");
}

export async function slettPameldingAction(data: FormData) {
  await krevAdmin();
  const id = String(data.get("pamelding_id") ?? "");
  const arrangementId = String(data.get("arrangement_id") ?? "");
  if (!id) return;
  await slettPamelding(id);
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/admin/arrangement/${arrangementId}`);
}

/* ── Melding til påmeldte ────────────────────────────────────────────── */

export async function sendMeldingAction(_forrige: Svar, data: FormData): Promise<Svar> {
  await krevAdmin();

  const arrangementId = String(data.get("arrangement_id") ?? "");
  const emne = String(data.get("emne") ?? "").trim();
  const tekst = String(data.get("tekst") ?? "").trim();

  if (!emne || !tekst) return { ok: false, melding: "Både emne og melding må fylles ut." };

  const arrangement = await hentArrangementMedId(arrangementId);
  if (!arrangement) return { ok: false, melding: "Fant ikke arrangementet." };

  const pameldinger = await hentPameldinger(arrangementId);
  const mottakere = pameldinger
    .filter((p) => p.kontakt_epost)
    .map((p) => ({ email: p.kontakt_epost!, name: p.kontakt_navn }));

  if (mottakere.length === 0)
    return { ok: false, melding: "Ingen av de påmeldte har oppgitt e-postadresse." };

  if (demomodus())
    return {
      ok: true,
      melding: `Demovisning: meldingen ville gått til ${mottakere.length} mottakere.`,
    };

  const svar = await sendTilPameldte(arrangement, mottakere, emne, tekst);
  if (!svar.sendt)
    return {
      ok: false,
      melding:
        svar.grunn === "ikke konfigurert"
          ? "Brevo er ikke satt opp. Legg inn BREVO_API_KEY i miljøvariablene."
          : `Meldingen ble ikke sendt (${svar.grunn}).`,
    };

  return {
    ok: true,
    melding: `Sendt til ${mottakere.length} ${mottakere.length === 1 ? "mottaker" : "mottakere"}.`,
  };
}

/* ── Oppsummering til ansvarlig ──────────────────────────────────────── */

/** Sender oppsummeringen slik den ser ut akkurat nå, så man kan se den før den går. */
export async function sendTestoppsummeringAction(
  _forrige: Svar,
  data: FormData,
): Promise<Svar> {
  await krevAdmin();

  const arrangementId = String(data.get("arrangement_id") ?? "");
  const arrangement = await hentArrangementMedId(arrangementId);
  if (!arrangement) return { ok: false, melding: "Fant ikke arrangementet." };

  if (!arrangement.ansvarlig_epost)
    return {
      ok: false,
      melding: "Arrangementet har ingen ansvarlig med e-postadresse. Fyll inn det først.",
    };

  const pameldinger = await hentPameldinger(arrangementId);

  // Ingen demosperre her: hele poenget med knappen er at e-posten faktisk
  // sendes, og adressen er den ansvarlige man selv har lagt inn.
  const svar = await sendOppsummering(arrangement, pameldinger, { test: true });
  if (!svar.sendt)
    return {
      ok: false,
      melding:
        svar.grunn === "ikke konfigurert"
          ? "Brevo er ikke satt opp. Legg inn BREVO_API_KEY i miljøvariablene."
          : `Testen ble ikke sendt (${svar.grunn}).`,
    };

  return { ok: true, melding: `Testutgave sendt til ${arrangement.ansvarlig_epost}.` };
}
