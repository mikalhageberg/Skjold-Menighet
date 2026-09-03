import "server-only";

/**
 * Lenkene til appen i de to butikkene.
 *
 * De settes som miljøvariabler på Railway og ikke i koden, fordi de endrer
 * seg uten at appen gjør det: App Store-lenken finnes ikke før appen er
 * godkjent, og Play-lenken byttes den dagen den lukkede testen går over
 * til åpen utgivelse.
 *
 * Play-lenken sendes bare ut på e-post til dem som er lagt inn i
 * testgruppen — den skal aldri ligge synlig på nedlastingssiden, for da
 * ville folk møtt en butikkside som ikke slipper dem inn.
 */

function les(navn: string) {
  const verdi = (process.env[navn] ?? "").trim();
  // En halvutfylt miljøvariabel skal ikke bli til en knapp som ikke virker.
  return verdi.startsWith("http") ? verdi : null;
}

export function appStoreLenke() {
  return les("APP_STORE_URL");
}

export function googlePlayLenke() {
  return les("GOOGLE_PLAY_URL");
}
