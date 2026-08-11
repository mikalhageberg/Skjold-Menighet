import "server-only";
import Database from "better-sqlite3";
import { accessSync, constants, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

/**
 * Tilkoblingen til databasen — én SQLite-fil, som ligger på et Railway-volum
 * slik at den overlever redeploy og restart.
 *
 * Uten DATABASE_PATH kjører appen i demomodus med data i minnet, så
 * `npm run dev` virker før noe er satt opp.
 *
 * WAL-modus lar lesing og skriving skje samtidig uten å blokkere hverandre.
 * Fremmednøkler er skrudd på, så en slettet påmelding tar deltakerne sine
 * med seg, og en slettet enhet nulles ut i stedet for å knekke noe.
 */

export function harDatabase() {
  return Boolean(process.env.DATABASE_PATH);
}

let db: Database.Database | null = null;

export function hentDb(): Database.Database {
  const filsti = process.env.DATABASE_PATH;
  if (!filsti) {
    throw new Error("DATABASE_PATH mangler — appen kjører i demomodus.");
  }
  if (!db) {
    const absoluttSti = resolve(filsti);
    const mappe = dirname(absoluttSti);

    if (!existsSync(mappe)) {
      mkdirSync(mappe, { recursive: true });
    }
    try {
      accessSync(mappe, constants.W_OK);
    } catch {
      throw new Error(
        `Mappa "${mappe}" er ikke skrivbar. Sjekk at DATABASE_PATH matcher volumets Mount Path på Railway.`,
      );
    }

    try {
      db = new Database(absoluttSti);
    } catch (feil) {
      const melding = feil instanceof Error ? feil.message : String(feil);
      throw new Error(
        `Klarte ikke å åpne databasefila "${absoluttSti}": ${melding}. ` +
          `Sjekk at DATABASE_PATH matcher volumets Mount Path på Railway.`,
      );
    }
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
  }
  return db;
}
