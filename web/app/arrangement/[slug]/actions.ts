"use server";

import { registrerPamelding } from "@/lib/pamelding";

export type Skjemastatus =
  | { steg: "skjema"; feil?: string; feltfeil?: Record<string, string> }
  | { steg: "kvittert"; antall: number; kontaktEpost: string | null };

export async function meldPa(
  _forrige: Skjemastatus,
  data: FormData,
): Promise<Skjemastatus> {
  const navn = data.getAll("deltaker_navn").map((n) => String(n));
  const kosthold = data.getAll("deltaker_kosthold").map((n) => String(n));
  const kontaktEpost = String(data.get("kontakt_epost") ?? "").trim();

  const svar = await registrerPamelding({
    slug: String(data.get("slug") ?? ""),
    kontaktNavn: String(data.get("kontakt_navn") ?? ""),
    kontaktTelefon: String(data.get("kontakt_telefon") ?? ""),
    kontaktEpost,
    melding: String(data.get("melding") ?? ""),
    deltakere: navn.map((n, i) => ({
      navn: n,
      kosthold: kosthold[i] ?? null,
    })),
  });

  if (!svar.ok) {
    return svar.feltfeil
      ? { steg: "skjema", feltfeil: svar.feltfeil }
      : { steg: "skjema", feil: svar.feil };
  }

  return {
    steg: "kvittert",
    antall: svar.antall,
    kontaktEpost: kontaktEpost || null,
  };
}
