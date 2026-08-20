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
import { randomUUID } from "node:crypto";
import Database from "better-sqlite3";
import { hash } from "@node-rs/argon2";

const filsti = process.env.DATABASE_PATH;
if (!filsti) {
  console.error("DATABASE_PATH mangler. Kjør npm run db:migrer først.");
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

const db = new Database(filsti);
db.pragma("foreign_keys = ON");

try {
  const brukernavn = (await les.question("Brukernavn: ")).trim().toLowerCase();
  // Vidt nok til at gamle e-postadresser fortsatt går inn — de er
  // brukernavn nå, og folk skal ikke låses ute av en navneendring.
  if (brukernavn.length < 3) throw new Error("Brukernavnet må være minst 3 tegn.");
  if (/\s/.test(brukernavn)) throw new Error("Brukernavnet kan ikke inneholde mellomrom.");

  const navn = (await les.question("Navn: ")).trim();

  const passord = await lesSkjult("Passord (minst 10 tegn): ");
  if (passord.length < 10) throw new Error("Passordet må være minst 10 tegn.");

  const igjen = await lesSkjult("Gjenta passordet: ");
  if (passord !== igjen) throw new Error("Passordene var ikke like.");

  const passordHash = await hash(passord);
  const na = new Date().toISOString();

  const eksisterende = db
    .prepare(`select id from administratorer where brukernavn = ?`)
    .get(brukernavn);

  if (eksisterende) {
    db.prepare(
      `update administratorer set passord_hash = ?, navn = coalesce(?, navn) where brukernavn = ?`,
    ).run(
      passordHash,
      navn || null,
      brukernavn,
    );
    console.log(`\nPassordet til ${brukernavn} er endret.`);
  } else {
    db.prepare(
      `insert into administratorer (id, brukernavn, navn, passord_hash, opprettet)
       values (?, ?, ?, ?, ?)`,
    ).run(randomUUID(), brukernavn, navn || null, passordHash, na);
    console.log(`\n${brukernavn} kan nå logge inn på /admin.`);
  }
} catch (feil) {
  console.error("\n" + feil.message);
  process.exitCode = 1;
} finally {
  les.close();
  db.close();
}
