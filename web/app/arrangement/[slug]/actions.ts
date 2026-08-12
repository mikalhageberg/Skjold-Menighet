"use server";

import { registrerPamelding } from "@/lib/pamelding";

export type Skjemastatus =
  | { steg: "skjema"; feil?: string; feltfeil?: Record<string, string> }
  | { steg: "kvittert" };

export async function meldPa(
  _forrige: Skjemastatus,
  data: FormData,
): Promise<Skjemastatus> {
  const svar = await registrerPamelding({
    slug: String(data.get("slug") ?? ""),
    navn: String(data.get("navn") ?? ""),
    telefon: String(data.get("telefon") ?? ""),
    epost: String(data.get("epost") ?? ""),
    bidrag: String(data.get("bidrag") ?? ""),
  });

  if (!svar.ok) {
    return svar.feltfeil
      ? { steg: "skjema", feltfeil: svar.feltfeil }
      : { steg: "skjema", feil: svar.feil };
  }

  return { steg: "kvittert" };
}
