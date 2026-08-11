import "server-only";
import postgres, { type Sql } from "postgres";

/**
 * Tilkoblingen til Postgres.
 *
 * På Railway settes DATABASE_URL av seg selv når du legger til en
 * Postgres-tjeneste. Uten den kjører appen i demomodus med data i minnet,
 * så `npm run dev` virker før noe er satt opp.
 *
 * Spørringene skrives som `sql\`select ...\``. Alt som settes inn med ${}
 * blir en parameter, ikke tekst, så det finnes ingen vei inn for
 * SQL-innsprøytning.
 */

export function harDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

function lagKlient(): Sql {
  const url = process.env.DATABASE_URL;
  if (!url) {
    // Alle kall er bak harDatabase(). Skulle noe likevel slippe gjennom,
    // vil vi ha en tydelig feil og ikke en «undefined is not a function».
    return new Proxy({} as Sql, {
      get() {
        throw new Error("DATABASE_URL mangler — appen kjører i demomodus.");
      },
      apply() {
        throw new Error("DATABASE_URL mangler — appen kjører i demomodus.");
      },
    });
  }

  return postgres(url, {
    // Railway og de fleste andre krever TLS, men med eget sertifikat.
    ssl: url.includes("localhost") || url.includes("127.0.0.1") ? false : "require",
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
    connection: { timezone: "Europe/Oslo" },
  });
}

/** Klienten. postgres.js kobler seg ikke opp før første spørring. */
export const sql: Sql = lagKlient();
