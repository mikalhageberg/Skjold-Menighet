# Skjold menighet

Erstatter papirlistene på kjøkkenbenken. Folk ser hva som skjer i kirken og melder
på seg selv eller andre, og de ansvarlige får oversikt over hvem som kommer.

Tre deler i ett arbeidsområde:

| Mappe | Hva | Kjøres med |
| --- | --- | --- |
| `mobil/` | Appen til App Store og Google Play (Expo SDK 54 / React Native 0.81) | `npm run mobil` |
| `web/` | Nettsiden og admin (Next.js) — dette er det Railway kjører | `npm run web` |
| `delt/` | Kirkeåret, datoformat, datamodell og regler — brukes av begge | — |

Appen snakker med `web/` over et lite offentlig API. Det er bare ett sted som
kjenner databasen, og ingen nøkler ligger i appen.

## Kom i gang

```bash
npm install
```

Så, i to terminaler:

```bash
npm run web
```

```bash
npm run mobil
```

`npm run web` starter nettsiden og API-et på `http://localhost:3000`.
`npm run mobil` starter Expo — trykk `i` for iOS-simulator, `a` for Android,
eller `w` for å se appen i nettleseren.

Appen ligger på **SDK 54** fordi det er versjonen Expo Go på telefonen kjører.
Expo Go støtter bare én SDK om gangen, så hopper dere opp en versjon, må Expo Go
oppdateres i takt — eller dere går over til en development build.

Uten miljøvariabler kjører alt i **demomodus**: eksempeldata i minnet, admin åpen
uten innlogging, og e-post logges til konsollen i stedet for å sendes. Det er nok
til å se og teste hele flyten. Alt forsvinner når serveren stopper.

### Appen mot en telefon

`localhost` finnes ikke på telefonen. Kjører du appen på et fysisk apparat, sett
maskinens IP-adresse på nettverket:

```bash
EXPO_PUBLIC_API_BASE=http://192.168.1.42:3000 npm run mobil
```

## Appen

- **Velkomsten** — første gang appen åpnes spør vi om ett: hva heter du. Ingen
  konto, ingen kode, ingen passord. Navnet blir liggende på telefonen og fyller
  ut påmeldingene siden. Telefon og e-post er frivillig her, og kan endres når
  som helst under Mine påmeldinger.
- **Hva skjer** — ett arrangement per kort, gruppert etter måned. Kanten til
  venstre har den liturgiske fargen for tiden i kirkeåret.
- **Påmelding uten innlogging.** Én kontaktperson melder på én eller flere
  deltakere, så man kan melde på naboen, hele familien eller noen som ikke bruker
  smarttelefon. Til vanlig er påmelding bare å trykke — navnet er allerede der.
- **Mine påmeldinger** — lista ligger på telefonen, ingen konto trengs.
- **Push-varsler** — ett varsel dagen før, hvis man ber om det i påmeldingen.
- **Legg i kalenderen** — arrangementet inn i telefonens egen kalender med
  påminnelse.

### Hva påmeldingen krever

Navn er alt som kreves. Trenger et arrangement mer, krysser den ansvarlige av for
**Krev telefonnummer** eller **Krev e-postadresse** på arrangementet, og da — og
bare da — spør appen om det. Har man fylt inn nummeret sitt én gang, ligger det
klart neste gang noe krever det.

Dette er et bevisst valg: hvert felt til er en terskel for dem som synes mobil er
vanskelig, og det er den gruppa appen er til for.

### Bygge og sende inn

Krever [Expo-konto](https://expo.dev) og `npm i -g eas-cli`.

```bash
cd mobil && eas init
```

Det setter `extra.eas.projectId` i `app.json`. Bytt så `EXPO_PUBLIC_API_BASE`
i `eas.json` til den ekte adressen til nettsiden, og bygg:

```bash
eas build --profile produksjon --platform all
```

```bash
eas submit --profile produksjon --platform all
```

Tre profiler i `eas.json`: `utvikling` (development client mot localhost),
`test` (intern distribusjon), `produksjon` (til butikkene).

**Dette trenger dere før innsending:**

- Apple Developer Program, 99 USD i året, og en App Store Connect-app med
  pakke-id `no.skjoldmenighet.app`.
- Google Play Developer, 25 USD én gang.
- Personvernerklæring på en offentlig adresse — begge butikkene krever det, og
  appen samler inn navn og telefonnummer.
- Skjermbilder. `eas build` gir dere appen; skjermbildene tar dere i simulator.

Ikonene ligger i `mobil/assets/` og lages av `mobil/verktoy/lag-ikoner.py`.
Merket er et kirkevindu med kirkeåret som en farget søyle inni.

**Om Apples «minimum functionality»:** Apple avviser apper som bare er en
nettside i et skall. Push-varsler og kalenderintegrasjon er grunnen til at dette
er en app og ikke bare nettsiden — nevn dem i innsendingsnotatet.

## Nettsiden og admin

Samme innhold som appen, for dem som ikke laster ned noe. Admin ligger på
`/admin`: antall påmeldte, deltakerlister, CSV-nedlasting, meldingsutsending og
skjema for å opprette og redigere arrangementer. Arrangementer slettes fra lista
under **Alle arrangementer** — man trenger ikke åpne dem først.

Nettadressen til et arrangement lages av tittelen og settes én gang. Den står
fast når tittelen endres senere, slik at lenker folk har delt fortsetter å virke.
Heter to arrangementer det samme, får det andre et tall bak: `/kirkekaffe-2`.

### Databasen

SQLite — én fil, ikke en egen tjeneste å sette opp eller betale for. Fila skal
ligge på et **volum** (en persistent disk), ikke i selve koden, ellers
forsvinner den ved hver utrulling.

```bash
npm run db:migrer
```

Leser `database/schema.sql` og setter opp tabellene i fila `DATABASE_PATH`
peker på. Trygt å kjøre om igjen; alt er «if not exists», så data som ligger
der blir stående. På Railway kjøres den av seg selv ved hver utrulling, så
skjemaendringer følger med koden.

Uten `DATABASE_PATH` kjører appen i **demomodus** med eksempeldata i minnet, og
admin er åpen uten innlogging. Da virker `npm run web` før noe er satt opp.
Lokalt holder det å peke den på en mappe i prosjektet, f.eks.
`./data/skjold.db` — mappa opprettes automatisk.

#### Administratorer

```bash
npm run ny-admin
```

Spør om e-post, navn og passord, og legger personen i `administratorer`.
Passordet lagres aldri — bare en argon2-hash. Kjører du den med en e-post som
allerede finnes, settes nytt passord i stedet.

Det finnes med vilje ingen selvbetjent registrering. Folk kommer inn her, av noen
som allerede har tilgang til serveren.

#### Om sikkerheten

Bare serveren har databasefila. Verken nettleseren eller appen ser den, så det
finnes ingen vei utenom serveren til påmeldingslistene. Innloggingen er Auth.js
med økten i en signert cookie.

### Koble til Brevo

1. Lag en API-nøkkel på [brevo.com](https://brevo.com) under **SMTP & API → API Keys**.
2. Legg inn i `web/.env.local`:

   ```
   BREVO_API_KEY=xkeysib-...
   BREVO_SENDER_NAME=Skjold menighet
   BREVO_SENDER_EMAIL=post@skjold-menighet.no
   ```

3. Avsenderadressen må være verifisert i Brevo under **Senders & IP**.

E-post går bare to veier: **oppsummeringen** til den ansvarlige før hvert
arrangement, og meldinger admin sender ut selv. Den som melder seg på får
**ingen** bekreftelses-e-post — kvitteringen i appen kommer med én gang.

E-post kan aldri velte en påmelding: feiler utsendingen, er påmeldingen likevel
lagret, og feilen logges.

### Oppsummering til den ansvarlige

Ingen får e-post når noen melder seg på — med femti påmeldte blir det femti
meldinger, og da leser man ingen av dem. I stedet går **én** e-post til den
ansvarlige før arrangementet, med antall påmeldte, hvem som kommer, allergier og
kommentarer.

Når den sendes velges per arrangement i admin: samme morgen, dagen før, to eller
tre dager før, eller en uke før — eventuelt av. Den går ut kl. 08 norsk tid den
dagen, og bare én gang. Regnet ut fra kalenderdatoen i Oslo, ikke klokkeslettet
arrangementet starter, så en middag kl. 16.30 og en frokost kl. 09 får e-posten
til samme tid.

Knappen **Send testutgave nå** på arrangementssiden sender den samme e-posten med
de påmeldingene som finnes akkurat da, så den ansvarlige kan se hva hun får.
Testen påvirker ikke den ekte utsendingen.

### Påminnelser og utsending

`GET /api/varsler/paaminnelser` gjør to ting: sender push til alle som er påmeldt
noe som starter om mellom 20 og 28 timer, og sender oppsummeringene som har
forfalt. Begge merkes som sendt, så ingenting går ut to ganger. Ruta er beskyttet
av `CRON_SECRET` og skal kjøres én gang i timen — se cron-jobben under
utrullingen nedenfor.

### Legge det ut på Railway

Alt ligger i ett repo. Railway bygger og kjører `web/`; appen i `mobil/` går til
butikkene og hører ikke hjemme på serveren.

1. **Nytt prosjekt** på [railway.com](https://railway.com) → *Deploy from GitHub
   repo* → velg dette repoet. Railway finner flere `package.json`-filer i
   arbeidsområdet og foreslår én tjeneste per mappe — behold bare **web**, og
   hopp over `@skjold/delt` (ikke en kjørbar app, bare delt kode) og `mobil`
   (går til app-butikkene, ikke til Railway).
2. På **web**-tjenesten: sjekk under *Settings* → *Source* at **Root
   Directory** er satt til repo-roten (tom, eller `/`) — ikke `web`.
   Arbeidsområdet krever at `npm install` kjøres fra roten for at `web` skal
   finne koden den låner fra `delt`.
3. **Legg til et volum**: samme tjeneste, *Settings* → *Volumes* → *Add
   Volume*, med *Mount Path* `/data`. Dette er disken databasefila bor på —
   uten den forsvinner alt ved neste utrulling.
4. **Miljøvariabler** på web-tjenesten:

   | Variabel | Verdi |
   | --- | --- |
   | `DATABASE_PATH` | `/data/skjold.db` |
   | `AUTH_SECRET` | `openssl rand -base64 32` |
   | `CRON_SECRET` | `openssl rand -base64 32` |
   | `BREVO_API_KEY` | fra Brevo |
   | `BREVO_SENDER_NAME` | Skjold menighet |
   | `BREVO_SENDER_EMAIL` | en **verifisert** avsender i Brevo |

   `PORT` settes av Railway selv. Ikke rør den.
5. **Generer en adresse** under *Settings* → *Networking* → *Generate Domain*.
6. **Første administrator.** Åpne Railway-terminalen på web-tjenesten og kjør
   `npm run ny-admin`.

`railway.json` sier hvordan det bygges og startes. Startkommandoen kjører
migreringen først, så databasen er i takt med koden ved hver utrulling.

#### Om avbrudd ved deploy

Et volum kan bare festes til én kjørende beholder om gangen, så Railway kan
ikke gjøre en helt sømløs utrulling av denne tjenesten — den gamle beholderen
må stoppe før den nye kan feste seg til volumet og starte. I praksis et par
sekunders avbrudd per deploy, ikke noe en menighet merker. Skulle dere en dag
trenge flere samtidige instanser av `web`, er det tidspunktet å vurdere en
ekte databasetjeneste i stedet.

#### Cron-jobben

Påminnelser og oppsummeringer trenger et kall hver time. I Railway: *New* →
*Cron Job* i samme prosjekt, med tidsplan `0 * * * *` og kommando:

```bash
curl -fsS -H "authorization: Bearer $CRON_SECRET" "$APP_URL/api/varsler/paaminnelser"
```

Sett `CRON_SECRET` til det samme som på web-tjenesten, og `APP_URL` til adressen
fra punkt 4.

#### Appen mot serveren

Når adressen finnes, bytt `EXPO_PUBLIC_API_BASE` i `mobil/eas.json` fra
`http://localhost:3000` til den, for profilene `test` og `produksjon`. Da slutter
appen å være avhengig av at maskinen din står på.

## Designet

Fargene er hentet fra kirkerommet: kalket vegg, gran og messing. Hvert
arrangement er et kort med en kant i den liturgiske fargen for tiden det faller i
— grønn i treenighetstiden, fiolett i advent og faste, gull i jule- og
påsketiden, rød i pinsen. Datoene er regnet ut fra påskedag i
`delt/src/kirkeaar.ts`, så det følger med av seg selv år for år.

Skriftene er Fraunces til titler og Schibsted Grotesk til alt som skal leses
raskt. Brødteksten er 17–18px og trykkflatene minst 52px, fordi en stor del av
dem som skal bruke dette er godt voksne.

## Neste steg

Ting som bevisst er utelatt i første versjon:

- **Avmelding uten å ringe.** I dag melder admin av på vegne av folk. Appen vet
  hvilken påmelding som er din, så en «Meld av»-knapp under Mine påmeldinger er
  det neste jeg ville bygget.
- **Profilen følger ikke med til ny telefon.** Den ligger bare lokalt. Skal den
  flytte med, må det en ekte innlogging til — SMS-kode eller e-postlenke.
- **Venteliste.** Fulle arrangementer viser telefonnummeret til kontoret.
- **Gjentakende arrangementer.** Formiddagstreff hver tredje torsdag må legges
  inn én og én gang.
