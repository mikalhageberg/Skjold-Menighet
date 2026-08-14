#!/usr/bin/env node
/**
 * Setter opp databasen fra database/schema.sql.
 *
 * Kjør:  npm run db:migrer
 *
 * Trygt å kjøre om igjen — skjemaet er skrevet med «if not exists», så
 * det gjør ingenting med data som allerede ligger der.
 */
import { accessSync, constants, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const her = dirname(fileURLToPath(import.meta.url));
const skjemafil = resolve(her, "../../database/schema.sql");

const filsti = process.env.DATABASE_PATH;
if (!filsti) {
  console.error("DATABASE_PATH mangler.");
  console.error("Lokalt: legg den i web/.env.local, f.eks. ./data/skjold.db");
  console.error("På Railway: sett den til stien på volumet, f.eks. /data/skjold.db");
  process.exit(1);
}

const absoluttSti = resolve(filsti);
const mappe = dirname(absoluttSti);

if (!existsSync(mappe)) {
  try {
    mkdirSync(mappe, { recursive: true });
  } catch (feil) {
    console.error(`Klarte ikke å opprette mappa "${mappe}": ${feil.message}`);
    console.error("Sjekk at DATABASE_PATH peker inn i volumets monteringssti, og at den er skrivbar.");
    process.exit(1);
  }
}

try {
  accessSync(mappe, constants.W_OK);
} catch {
  console.error(`Mappa "${mappe}" finnes, men er ikke skrivbar for denne prosessen.`);
  console.error(
    "På Railway: sjekk at Mount Path på volumet er nøyaktig samme mappe som DATABASE_PATH peker inn i.",
  );
  process.exit(1);
}

let db;
try {
  db = new Database(absoluttSti);
} catch (feil) {
  console.error(`Klarte ikke å åpne databasefila "${absoluttSti}": ${feil.message}`);
  console.error(
    "Vanligste årsak: DATABASE_PATH matcher ikke volumets Mount Path på Railway, " +
      "eller mappa mangler skrivetilgang.",
  );
  process.exit(1);
}
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

try {
  const skjema = readFileSync(skjemafil, "utf8");
  db.exec(skjema);

  // «create table if not exists» oppretter ikke nye kolonner på en tabell
  // som alt finnes — det må gjøres med egne alter table-setninger her,
  // én gang per kolonne som er lagt til etter at databasen først ble satt opp.
  const kolonnerI = (tabell) =>
    db.prepare(`pragma table_info(${tabell})`).all().map((k) => k.name);

  const leggTilKolonne = (tabell, navn, type) => {
    if (kolonnerI(tabell).includes(navn)) return;
    db.exec(`alter table ${tabell} add column ${navn} ${type}`);
    console.log(`La til kolonnen "${navn}" i ${tabell}.`);
  };

  // Kolonner som byttet navn da appen gikk fra å være en påmelding for
  // gjester til å være en vaktliste for frivillige. «rename column» tar med
  // seg innholdet, så det som alt ligger der blir stående.
  const dopOm = (tabell, fra, til) => {
    const kolonner = kolonnerI(tabell);
    if (!kolonner.includes(fra) || kolonner.includes(til)) return;
    db.exec(`alter table ${tabell} rename column ${fra} to ${til}`);
    console.log(`Ga kolonnen "${fra}" i ${tabell} det nye navnet "${til}".`);
  };

  dopOm("arrangementer", "kapasitet", "trengs");
  dopOm("pameldinger", "kontakt_navn", "navn");
  dopOm("pameldinger", "kontakt_telefon", "telefon");
  dopOm("pameldinger", "kontakt_epost", "epost");
  dopOm("pameldinger", "melding", "bidrag");

  leggTilKolonne("arrangementer", "bilde", "blob");
  leggTilKolonne("arrangementer", "bilde_type", "text");
  leggTilKolonne("arrangementer", "bilde_generert", "text");
  leggTilKolonne("arrangementer", "serie_id", "text");
  leggTilKolonne("arrangementer", "nyhetsvarsel_sendt", "text");
  leggTilKolonne("pameldinger", "bidrag", "text");
  leggTilKolonne("pameldinger", "del_nummer", "integer not null default 0");

  // Arrangementer som fantes før varselet om nye oppgaver ble laget, skal
  // ikke utløse et varsel med det samme jobben neste gang kjører.
  const eldre = db
    .prepare(`update arrangementer set nyhetsvarsel_sendt = ? where nyhetsvarsel_sendt is null`)
    .run(new Date().toISOString());
  if (eldre.changes > 0) {
    console.log(`Merket ${eldre.changes} eksisterende arrangementer som allerede varslet.`);
  }

  // Tabellen «deltakere» hører til den gamle modellen, der én person kunne
  // melde på flere. Den røres ikke her — data skal ikke forsvinne av en
  // migrering. Er dere ferdige med den:  drop table deltakere;
  if (db.prepare(`select 1 from sqlite_master where type = 'table' and name = 'deltakere'`).get()) {
    console.log(
      'Tabellen "deltakere" er ikke lenger i bruk. Slett den selv når dere er ferdige med innholdet.',
    );
  }

  // Må opprettes her, ikke i schema.sql — den kjører før alter table-steget
  // over, og ville feilet mot en database som ennå ikke har serie_id.
  db.exec(`
    create index if not exists arrangementer_serie_idx
      on arrangementer (serie_id)
      where serie_id is not null
  `);

  const tabeller = ["arrangementer", "pameldinger", "enheter", "administratorer"];
  const finnes = tabeller.filter((navn) =>
    db.prepare(`select 1 from sqlite_master where type = 'table' and name = ?`).get(navn),
  );
  console.log(`Databasen er klar. ${finnes.length} av ${tabeller.length} tabeller på plass.`);

  const { antall } = db.prepare(`select count(*) as antall from administratorer`).get();
  if (antall === 0) {
    console.log("\nIngen administratorer ennå. Legg til den første med:");
    console.log("  npm run ny-admin");
  }
} catch (feil) {
  console.error("Migreringen feilet:", feil.message);
  process.exitCode = 1;
} finally {
  db.close();
}
