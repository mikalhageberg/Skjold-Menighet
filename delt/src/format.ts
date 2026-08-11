const TZ = "Europe/Oslo";

const ukedagLang = new Intl.DateTimeFormat("nb-NO", { weekday: "long", timeZone: TZ });
const dagOgManed = new Intl.DateTimeFormat("nb-NO", { day: "numeric", month: "long", timeZone: TZ });
const dagOgManedKort = new Intl.DateTimeFormat("nb-NO", {
  day: "numeric",
  month: "short",
  timeZone: TZ,
});
const klokkeslett = new Intl.DateTimeFormat("nb-NO", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TZ,
});
const manedOgAr = new Intl.DateTimeFormat("nb-NO", { month: "long", year: "numeric", timeZone: TZ });
const dagTall = new Intl.DateTimeFormat("nb-NO", { day: "numeric", timeZone: TZ });

export function ukedag(d: Date) {
  return ukedagLang.format(d);
}

export function dato(d: Date) {
  return dagOgManed.format(d);
}

export function datoKort(d: Date) {
  return dagOgManedKort.format(d).replace(".", "");
}

export function dag(d: Date) {
  // nb-NO setter punktum etter dagen («13.»). Vi vil bare ha tallet.
  return dagTall.format(d).replace(/\D/g, "");
}

export function klokka(d: Date) {
  return klokkeslett.format(d);
}

export function maned(d: Date) {
  return manedOgAr.format(d);
}

/** «onsdag 13. august kl. 11.00» */
export function langDato(d: Date) {
  return `${ukedag(d)} ${dato(d)} kl. ${klokka(d).replace(":", ".")}`;
}

export function tidsrom(start: Date, slutt: Date | null) {
  const fra = klokka(start).replace(":", ".");
  if (!slutt) return `kl. ${fra}`;
  return `kl. ${fra}–${klokka(slutt).replace(":", ".")}`;
}

/** «om 3 dager», «i dag», «i morgen» */
export function nartid(d: Date, na = new Date()) {
  const startDag = (x: Date) =>
    Date.UTC(x.getFullYear(), x.getMonth(), x.getDate()) / 86400000;
  const diff = startDag(d) - startDag(na);
  if (diff === 0) return "i dag";
  if (diff === 1) return "i morgen";
  if (diff < 0) return "har vært";
  if (diff < 7) return `om ${diff} dager`;
  if (diff < 14) return "om en uke";
  return `om ${Math.round(diff / 7)} uker`;
}

/** For datetime-local-felt i admin. */
export function tilInputVerdi(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const deler = new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  }).format(d);
  return deler.replace(" ", "T");
}

export function lagSlug(tekst: string) {
  return tekst
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/å/g, "a")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}
