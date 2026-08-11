#!/usr/bin/env node
/**
 * Setter opp databasen fra database/schema.sql.
 *
 * Kjør:  npm run db:migrer
 *
 * Trygt å kjøre om igjen — skjemaet er skrevet med «if not exists», så
 * det gjør ingenting med data som allerede ligger der.
 */
import { existsSync, mkdirSync, readFileSync } from "node:fs";
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

const mappe = dirname(filsti);
if (!existsSync(mappe)) mkdirSync(mappe, { recursive: true });

const db = new Database(filsti);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

try {
  const skjema = readFileSync(skjemafil, "utf8");
  db.exec(skjema);

  const tabeller = ["arrangementer", "pameldinger", "deltakere", "enheter", "administratorer"];
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
