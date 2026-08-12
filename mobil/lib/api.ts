import Constants from "expo-constants";
import type {
  ArrangementMedAntall,
  AvmeldingSvar,
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

export async function hentArrangement(slug: string): Promise<ArrangementMedAntall> {
  const { arrangement } = await hent<{ arrangement: ArrangementMedAntall }>(
    `/api/offentlig/arrangementer/${encodeURIComponent(slug)}`,
  );
  return arrangement;
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
