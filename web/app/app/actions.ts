"use server";

import { meldPaaTest } from "@/lib/testere";

export type Teststatus =
  | { steg: "skjema"; feil?: string }
  | { steg: "kvittert" };

/**
 * Adressen fra nedlastingssiden. Ingenting sendes her og nå — lenken går
 * ut først når den ansvarlige har lagt adressene inn i Play Console og
 * trykt knappen på /android.
 */
export async function meldPaaAndroidtest(
  _forrige: Teststatus,
  data: FormData,
): Promise<Teststatus> {
  const svar = await meldPaaTest(String(data.get("epost") ?? ""));
  if (!svar.ok) return { steg: "skjema", feil: svar.feil };

  // Kjent adresse gir samme kvittering som en ny. Den som trykker to
  // ganger skal ikke bli i tvil om at det gikk bra.
  return { steg: "kvittert" };
}
