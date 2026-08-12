import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Det telefonen husker mellom øktene.
 *
 * Uten innlogging er dette eneste måten «Mine vakter» kan finnes: vi lagrer
 * en kopi på telefonen når man sier ja til noe. Hvem telefonen tilhører
 * ligger i profil.ts.
 */

const NOKKEL_PAMELDINGER = "skjold.pameldinger.v1";

export type MinPamelding = {
  pameldingId: string;
  slug: string;
  tittel: string;
  starter: string;
  sted: string;
  /** «Jeg bidrar med», slik man skrev det. Vises i lista på telefonen. */
  bidrag: string | null;
  meldtPa: string;
};

async function les<T>(nokkel: string, standard: T): Promise<T> {
  try {
    const rå = await AsyncStorage.getItem(nokkel);
    return rå ? (JSON.parse(rå) as T) : standard;
  } catch {
    return standard;
  }
}

export async function hentMine(): Promise<MinPamelding[]> {
  const alle = await les<MinPamelding[]>(NOKKEL_PAMELDINGER, []);
  // Rydd bort det som har vært for mer enn en uke siden.
  const grense = Date.now() - 7 * 86400000;
  const aktuelle = alle.filter((p) => new Date(p.starter).getTime() > grense);
  if (aktuelle.length !== alle.length) await skrivMine(aktuelle);
  return aktuelle.sort((a, b) => a.starter.localeCompare(b.starter));
}

async function skrivMine(liste: MinPamelding[]) {
  try {
    await AsyncStorage.setItem(NOKKEL_PAMELDINGER, JSON.stringify(liste));
  } catch {
    // Fullt lager eller nektet tilgang. Påmeldingen er lagret hos menigheten
    // uansett, så vi lar det gå stille.
  }
}

export async function husk(pamelding: MinPamelding) {
  const alle = await les<MinPamelding[]>(NOKKEL_PAMELDINGER, []);
  await skrivMine([...alle.filter((p) => p.pameldingId !== pamelding.pameldingId), pamelding]);
}

export async function glem(pameldingId: string) {
  const alle = await les<MinPamelding[]>(NOKKEL_PAMELDINGER, []);
  await skrivMine(alle.filter((p) => p.pameldingId !== pameldingId));
}

export async function erPameldt(slug: string) {
  const alle = await hentMine();
  return alle.some((p) => p.slug === slug);
}
