#!/usr/bin/env node
/**
 * Legger til en administrator, eller setter nytt passord på en som finnes.
 *
 * Kjør:  npm run ny-admin
 *
 * Passordet skrives inn skjult og lagres aldri — bare en argon2-hash.
 * Det finnes med vilje ingen selvbetjent registrering; folk kommer inn
 * her, av noen som allerede har tilgang til serveren.
 */
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import postgres from "postgres";
import { hash } from "@node-rs/argon2";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL mangler. Kjør npm run db:migrer først.");
  process.exit(1);
}

const les = createInterface({ input: stdin, output: stdout });

/** Leser inn uten å vise tegnene. */
async function lesSkjult(spørsmål) {
  stdout.write(spørsmål);
  const varRå = stdin.isRaw;
  stdin.setRawMode?.(true);

  return new Promise((resolve) => {
    let svar = "";
    const påTast = (bit) => {
      const tegn = bit.toString("utf8");
      if (tegn === "\n" || tegn === "\r" || tegn === "\u0004") {
        stdin.setRawMode?.(varRå ?? false);
        stdin.removeListener("data", påTast);
        stdout.write("\n");
        resolve(svar);
      } else if (tegn === "\u0003") {
        // Ctrl+C
        stdout.write("\n");
        process.exit(1);
      } else if (tegn === "\u007f" || tegn === "\b") {
        svar = svar.slice(0, -1);
      } else {
        svar += tegn;
      }
    };
    stdin.on("data", påTast);
  });
}

const sql = postgres(url, {
  ssl: url.includes("localhost") || url.includes("127.0.0.1") ? false : "require",
  max: 1,
});

try {
  const epost = (await les.question("E-post: ")).trim().toLowerCase();
  if (!epost.includes("@")) throw new Error("Det ser ikke ut som en e-postadresse.");

  const navn = (await les.question("Navn: ")).trim();

  const passord = await lesSkjult("Passord (minst 10 tegn): ");
  if (passord.length < 10) throw new Error("Passordet må være minst 10 tegn.");

  const igjen = await lesSkjult("Gjenta passordet: ");
  if (passord !== igjen) throw new Error("Passordene var ikke like.");

  const passordHash = await hash(passord);

  const [rad] = await sql`
    insert into administratorer (epost, navn, passord_hash)
    values (${epost}, ${navn || null}, ${passordHash})
    on conflict (epost) do update
      set passord_hash = excluded.passord_hash,
          navn = coalesce(excluded.navn, administratorer.navn)
    returning epost, (xmax = 0) as ny
  `;

  console.log(
    rad.ny
      ? `\n${rad.epost} kan nå logge inn på /admin.`
      : `\nPassordet til ${rad.epost} er endret.`,
  );
} catch (feil) {
  console.error("\n" + feil.message);
  process.exitCode = 1;
} finally {
  les.close();
  await sql.end();
}
