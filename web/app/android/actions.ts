"use server";

import { revalidatePath } from "next/cache";
import { krevAdmin, demomodus } from "@/lib/auth";
import { harBrevo, sendTestlenke } from "@/lib/brevo";
import { googlePlayLenke } from "@/lib/lenker";
import { hentTestere, merkLagtTil } from "@/lib/testere";

export type Utsendingssvar = { ok: boolean; melding?: string };

/**
 * «Lagt til alle foreløpige e-poster.»
 *
 * Trykkes etter at CSV-fila er lastet opp i Play Console. Da går lenken ut
 * til alle som står på lista, og de merkes som lagt inn — som er det samme
 * som at CSV-fila nullstilles, siden fila er nettopp de umerkede.
 *
 * Én e-post per person, og hver merkes først når den faktisk gikk av
 * gårde. En adresse Brevo ikke fikk sendt til blir stående, så den kommer
 * med neste gang knappen trykkes i stedet for å bli glemt.
 */
export async function leggTilAlleAction(
  _forrige: Utsendingssvar,
  _data: FormData,
): Promise<Utsendingssvar> {
  await krevAdmin();

  const lenke = googlePlayLenke();
  if (!lenke) {
    return {
      ok: false,
      melding:
        "GOOGLE_PLAY_URL er ikke satt på serveren, så det finnes ingen lenke å sende. Legg den inn i miljøvariablene først.",
    };
  }

  const { ventende } = await hentTestere();
  if (ventende.length === 0) {
    return { ok: false, melding: "Lista er tom — det er ingen nye e-poster å sende til." };
  }

  if (demomodus()) {
    return {
      ok: true,
      melding: `Demovisning: lenken ville gått til ${ventende.length} adresser, og lista ville blitt nullstilt.`,
    };
  }

  if (!harBrevo()) {
    return {
      ok: false,
      melding:
        "Brevo er ikke satt opp. Legg inn BREVO_API_KEY i miljøvariablene, ellers kommer ingen e-post fram.",
    };
  }

  const sendt: string[] = [];
  for (const tester of ventende) {
    const svar = await sendTestlenke(tester.epost, lenke);
    if (svar.sendt) sendt.push(tester.id);
  }

  await merkLagtTil(sendt);
  revalidatePath("/android");

  const mislyktes = ventende.length - sendt.length;
  if (sendt.length === 0) {
    return {
      ok: false,
      melding: `Ingen av de ${ventende.length} e-postene gikk gjennom. Alle står igjen på lista, så du kan prøve på nytt.`,
    };
  }
  if (mislyktes > 0) {
    return {
      ok: true,
      melding: `Lenken gikk til ${sendt.length} av ${ventende.length}. De ${mislyktes} som ikke gikk gjennom står igjen på lista — prøv igjen om litt.`,
    };
  }
  return {
    ok: true,
    melding: `Lenken er sendt til ${sendt.length} ${
      sendt.length === 1 ? "person" : "personer"
    }. Lista er nullstilt og klar for nye.`,
  };
}
