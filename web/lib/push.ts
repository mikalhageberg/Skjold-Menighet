import "server-only";

/**
 * Push-varsler via Expo. Vi sender til Expos tjeneste, som videresender til
 * Apple og Google. Ingen nøkler trengs her — tokenet identifiserer telefonen.
 *
 * Som med e-post: en feilet utsending skal aldri velte det som utløste den.
 */

const API = "https://exp.host/--/api/v2/push/send";

export type Varsel = {
  til: string[];
  tittel: string;
  tekst: string;
  /** Sendes med tilbake til appen, så den kan åpne riktig arrangement. */
  data?: Record<string, string>;
};

export function gyldigToken(token: string) {
  return /^Expo(nent)?PushToken\[[^\]]+\]$/.test(token);
}

export async function sendVarsel({ til, tittel, tekst, data }: Varsel) {
  const tokens = [...new Set(til)].filter(gyldigToken);
  if (tokens.length === 0) return { sendt: 0, feilet: 0 };

  let sendt = 0;
  let feilet = 0;

  // Expo tar imot inntil 100 meldinger per kall.
  for (let i = 0; i < tokens.length; i += 100) {
    const bolk = tokens.slice(i, i + 100).map((to) => ({
      to,
      title: tittel,
      body: tekst,
      sound: "default",
      priority: "high",
      ...(data ? { data } : {}),
    }));

    try {
      const svar = await fetch(API, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify(bolk),
      });

      if (!svar.ok) {
        console.error(`[push] ${svar.status}: ${await svar.text()}`);
        feilet += bolk.length;
        continue;
      }

      const kropp = (await svar.json()) as {
        data?: { status: string; message?: string }[];
      };
      for (const kvittering of kropp.data ?? []) {
        if (kvittering.status === "ok") sendt++;
        else {
          feilet++;
          console.warn(`[push] avvist: ${kvittering.message ?? "ukjent grunn"}`);
        }
      }
    } catch (feil) {
      console.error("[push] Nettverksfeil", feil);
      feilet += bolk.length;
    }
  }

  return { sendt, feilet };
}
