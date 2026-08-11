import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Hvem eier denne telefonen.
 *
 * Dette er ingen konto — ingenting sendes til serveren, ingen passord, ingen
 * kode på SMS. Man skriver navnet sitt én gang når appen åpnes første gang,
 * og slipper å skrive det om igjen for hver påmelding. Telefon og e-post er
 * frivillig, og spørres bare om når et arrangement faktisk krever det.
 */

const NOKKEL = "skjold.profil.v1";

export type Profil = {
  navn: string;
  telefon: string;
  epost: string;
  /** Når profilen ble laget. Brukes til å vite at velkomsten er gjort. */
  opprettet: string;
};

export const TOM_PROFIL: Profil = { navn: "", telefon: "", epost: "", opprettet: "" };

export async function hentProfil(): Promise<Profil | null> {
  try {
    const rå = await AsyncStorage.getItem(NOKKEL);
    if (!rå) return null;
    const p = JSON.parse(rå) as Profil;
    return p.navn?.trim() ? p : null;
  } catch {
    return null;
  }
}

export async function lagreProfil(profil: Omit<Profil, "opprettet">) {
  const eksisterende = await hentProfil();
  const ny: Profil = {
    navn: profil.navn.trim(),
    telefon: profil.telefon.trim(),
    epost: profil.epost.trim(),
    opprettet: eksisterende?.opprettet || new Date().toISOString(),
  };
  try {
    await AsyncStorage.setItem(NOKKEL, JSON.stringify(ny));
  } catch {
    // Fullt lager. Appen fungerer videre, man må bare skrive navnet på nytt.
  }
  return ny;
}

export async function glemProfil() {
  try {
    await AsyncStorage.removeItem(NOKKEL);
  } catch {
    // Se over.
  }
}
