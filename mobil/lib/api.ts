import { Platform } from "react-native";
import Constants from "expo-constants";
import type {
  ArrangementMedAntall,
  AvmeldingSvar,
  Frivillig,
  PameldingInn,
  PameldingSvar,
} from "@skjold/delt";

/**
 * Appen snakker med det samme nettstedet som admin kjører på. Ingen nøkler
 * ligger i appen — serveren eier databasen, appen spør bare pent.
 *
 * Under utvikling på fysisk telefon må EXPO_PUBLIC_API_BASE peke på maskinens
 * IP-adresse på nettverket; «localhost» finnes ikke på telefonen.
 */
export const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE ??
  (Constants.expoConfig?.extra?.apiBase as string | undefined) ??
  "http://localhost:3000";

export class ApiFeil extends Error {
  constructor(melding: string) {
    super(melding);
    this.name = "ApiFeil";
  }
}

async function hent<T>(sti: string, init?: RequestInit): Promise<T> {
  let svar: Response;
  try {
    svar = await fetch(`${API_BASE}${sti}`, {
      ...init,
      headers: { accept: "application/json", ...(init?.headers ?? {}) },
    });
  } catch {
    throw new ApiFeil("Får ikke kontakt. Sjekk at du har nett, og prøv igjen.");
  }

  let kropp: unknown;
  try {
    kropp = await svar.json();
  } catch {
    throw new ApiFeil("Fikk et svar vi ikke forsto. Prøv igjen om litt.");
  }

  if (!svar.ok) {
    const feil = (kropp as { feil?: string })?.feil;
    throw new ApiFeil(feil ?? "Noe gikk galt. Prøv igjen om litt.");
  }
  return kropp as T;
}

export async function hentArrangementer(): Promise<ArrangementMedAntall[]> {
  const { arrangementer } = await hent<{ arrangementer: ArrangementMedAntall[] }>(
    "/api/offentlig/arrangementer",
  );
  return arrangementer;
}

/**
 * Ett arrangement med lista over hvem som alt har sagt ja.
 *
 * `pameldingId` er ens egen påmelding til nettopp dette arrangementet, om
 * man har en. Den viser serveren at man står på lista selv, og er det som
 * avgjør om telefonnumrene til de andre følger med. Uten den kommer lista
 * uten numre — som er det en tilfeldig forbipasserende skal få.
 */
export async function hentArrangement(
  slug: string,
  pameldingId?: string | null,
): Promise<{ arrangement: ArrangementMedAntall; frivillige: Frivillig[] }> {
  const svar = await hent<{ arrangement: ArrangementMedAntall; frivillige?: Frivillig[] }>(
    `/api/offentlig/arrangementer/${encodeURIComponent(slug)}`,
    pameldingId ? { headers: { "x-pamelding-id": pameldingId } } : undefined,
  );
  return { arrangement: svar.arrangement, frivillige: svar.frivillige ?? [] };
}

/**
 * Melder telefonen inn så den kan få varsler — også om ting den ennå ikke
 * har sagt ja til. Uten dette ville «det trengs en frivillig» bare nådd dem
 * som alt står på en liste, og det er motsatt av hvem vi vil nå.
 *
 * Feiler stille: appen skal virke like godt uten varsler.
 */
export async function registrerEnhet(token: string): Promise<void> {
  try {
    await hent<{ ok: boolean }>("/api/offentlig/enheter", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, plattform: Platform.OS }),
    });
  } catch {
    // Neste gang appen åpnes prøver vi igjen.
  }
}

export async function meldPa(input: PameldingInn): Promise<PameldingSvar> {
  try {
    return await hent<PameldingSvar>("/api/offentlig/pameldinger", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch (feil) {
    if (feil instanceof ApiFeil) return { ok: false, feil: feil.message };
    throw feil;
  }
}

export async function meldAv(pameldingId: string): Promise<AvmeldingSvar> {
  try {
    return await hent<AvmeldingSvar>(
      `/api/offentlig/pameldinger/${encodeURIComponent(pameldingId)}`,
      { method: "DELETE" },
    );
  } catch (feil) {
    if (feil instanceof ApiFeil) return { ok: false, feil: feil.message };
    throw feil;
  }
}
