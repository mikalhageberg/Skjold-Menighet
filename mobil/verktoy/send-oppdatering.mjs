#!/usr/bin/env node
/**
 * Sender en oppdatering over lufta (EAS Update) til appen som er ute.
 *
 *   npm run oppdater -- "Større tekst uten avkutting"
 *   npm run oppdater -- --sjekk      (bare se om det er trygt, send ingenting)
 *
 * Kjøres fra roten av repoet. Kommandoen ligger i rot-package.json og ikke
 * i mobil/ med vilje: skriptene i mobil/package.json er med i appens
 * fingeravtrykk, så å legge den der ville i seg selv gjort at ingen
 * oppdatering lenger passet til byggene som er ute.
 *
 * Bare JavaScript og bilder kan sendes slik. Endres native-koden — en ny
 * modul, en ny tillatelse, noe i app.json som havner i selve appen — må
 * det bygges på nytt og sendes gjennom butikkene. Sendes en oppdatering
 * som trenger native-kode appen ikke har, krasjer den ved oppstart hos
 * alle som får den.
 *
 * Derfor sjekker skriptet det først: det regner ut fingeravtrykket av
 * native-koden slik den er nå, og sammenligner med det siste
 * produksjonsbygget for hver plattform. Er de like, er alt siden bygget
 * ren JavaScript, og oppdateringen er trygg. Er de ulike, stopper det.
 *
 * Det sender også med de samme miljøvariablene som produksjonsbygget
 * fikk i eas.json. «eas update» leser dem nemlig ikke selv — den tar det
 * som ligger i skallet — og en EXPO_PUBLIC_API_BASE som peker på en
 * maskin på hjemmenettet ville ellers blitt sendt til alle brukerne.
 */

import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const MOBIL = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PROFIL = "produksjon";

const bareSjekk = process.argv.includes("--sjekk");
const melding = process.argv.slice(2).filter((a) => a !== "--sjekk").join(" ").trim();
if (!melding && !bareSjekk) {
  console.error('Skriv hva oppdateringen gjør:  npm run oppdater -- "Større tekst uten avkutting"');
  process.exit(1);
}

const eas = JSON.parse(readFileSync(resolve(MOBIL, "eas.json"), "utf8"));
const profil = eas.build?.[PROFIL];
if (!profil?.channel) {
  console.error(`Fant ingen kanal for byggeprofilen «${PROFIL}» i eas.json.`);
  process.exit(1);
}

function kjor(kommando, argumenter) {
  return execFileSync(kommando, argumenter, {
    cwd: MOBIL,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function fingeravtrykk(plattform) {
  const ut = kjor("npx", ["expo-updates", "fingerprint:generate", "--platform", plattform]);
  return JSON.parse(ut).hash;
}

function sisteBygg(plattform) {
  const ut = kjor("eas", [
    "build:list",
    "--platform", plattform,
    "--channel", profil.channel,
    "--status", "finished",
    "--limit", "1",
    "--json",
    "--non-interactive",
  ]);
  return JSON.parse(ut)[0];
}

console.log(`Sjekker at native-koden er den samme som i siste bygg på «${profil.channel}» …\n`);

let trygt = true;
for (const plattform of ["android", "ios"]) {
  const bygg = sisteBygg(plattform);
  const navn = plattform === "ios" ? "iOS    " : "Android";
  if (!bygg) {
    console.log(`  ${navn}  ingen ferdige bygg på kanalen — hopper over`);
    continue;
  }
  const iBygget = bygg.fingerprint?.hash;
  const naa = fingeravtrykk(plattform);
  const hvilket = `bygg ${bygg.appBuildVersion} fra ${bygg.createdAt.slice(0, 10)}`;
  if (!iBygget) {
    console.log(`  ${navn}  ${hvilket} har ikke noe fingeravtrykk å sammenligne med`);
    trygt = false;
  } else if (iBygget !== naa) {
    console.log(`  ${navn}  ENDRET siden ${hvilket}`);
    trygt = false;
  } else {
    console.log(`  ${navn}  samme som ${hvilket}`);
  }
}

if (!trygt) {
  console.error(
    "\nNative-koden er ikke den samme som i appen som er ute, så dette kan ikke" +
      "\nsendes over lufta. Øk «version» i app.json, bygg på nytt med" +
      "\n  eas build --profile produksjon --platform all" +
      "\nog send det gjennom butikkene.",
  );
  process.exit(1);
}

if (bareSjekk) {
  console.log("\nTrygt å sende over lufta. Ingenting er sendt.");
  process.exit(0);
}

console.log(`\nSender «${melding}» til kanalen «${profil.channel}» …\n`);

const resultat = spawnSync(
  "eas",
  ["update", "--channel", profil.channel, "--message", melding, "--non-interactive"],
  {
    cwd: MOBIL,
    stdio: "inherit",
    // Det produksjonsbygget fikk, og ikke det som tilfeldigvis ligger i skallet.
    env: { ...process.env, ...profil.env },
  },
);
process.exit(resultat.status ?? 1);
