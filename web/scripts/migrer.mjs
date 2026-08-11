#!/usr/bin/env node
/**
 * Setter opp databasen fra database/schema.sql.
 *
 * Kjør:  npm run db:migrer
 *
 * Trygt å kjøre om igjen — skjemaet er skrevet med «if not exists», så
 * det gjør ingenting med data som allerede ligger der.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const her = dirname(fileURLToPath(import.meta.url));
const skjemafil = resolve(her, "../../database/schema.sql");

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL mangler.");
  console.error("Lokalt: legg den i web/.env.local. På Railway settes den av seg selv.");
  process.exit(1);
}

const sql = postgres(url, {
  ssl: url.includes("localhost") || url.includes("127.0.0.1") ? false : "require",
  max: 1,
  // «drop ... if exists» gir beskjeder vi ikke trenger å se.
  onnotice: () => {},
});

try {
  const skjema = readFileSync(skjemafil, "utf8");
  await sql.unsafe(skjema);

  const [{ antall }] = await sql`
    select count(*)::int as antall
      from information_schema.tables
     where table_schema = 'public'
       and table_name in ('arrangementer', 'pameldinger', 'deltakere', 'enheter', 'administratorer')
  `;

  console.log(`Databasen er klar. ${antall} av 5 tabeller på plass.`);

  const [{ admin }] = await sql`select count(*)::int as admin from administratorer`;
  if (admin === 0) {
    console.log("\nIngen administratorer ennå. Legg til den første med:");
    console.log("  npm run ny-admin");
  }
} catch (feil) {
  console.error("Migreringen feilet:", feil.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
