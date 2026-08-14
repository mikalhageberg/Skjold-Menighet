# Skjold menighet

Erstatter ringerunden. Menigheten legger ut det som trenger frivillige, folk med
appen får beskjed, og alle ser hele tiden hvem som har meldt seg — også når noen
melder avbud og det trengs en avløser.

Tre deler i ett arbeidsområde:

| Mappe | Hva | Kjøres med |
| --- | --- | --- |
| `mobil/` | Appen til App Store og Google Play (Expo SDK 54 / React Native 0.81) | `npm run mobil` |
| `web/` | Nettsiden og admin (Next.js) — dette er det Railway kjører | `npm run web` |
| `delt/` | Kirkeåret, datoformat, datamodell og regler — brukes av begge | — |

Appen snakker med `web/` over et lite offentlig API. Det er bare ett sted som
kjenner databasen, og ingen nøkler ligger i appen.

Ordbruk: et **arrangement** er en oppgave det trengs folk til, og en **påmelding**
er én frivillig som har sagt ja til én oppgave. Man melder bare på seg selv.

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
  ut skjemaene siden. Telefon og e-post er frivillig her, og kan endres når
  som helst under Mine vakter. Det er også her vi ber om lov til å sende varsler.
- **Vi trenger deg** — én oppgave per kort, gruppert etter måned. Kanten til
  venstre har den liturgiske fargen for tiden i kirkeåret. Under står hvor mange
  som mangler, i rødt når oppgaven er nær i tid og fortsatt ikke er dekket.
- **Å si ja uten innlogging.** Man melder bare seg selv, og til vanlig er det ett
  trykk — navnet er allerede der. Feltet **Jeg bidrar med** er valgfritt, og er
  der for at ikke tre skal komme med hver sin bløtkake.
- **Hvem har meldt seg** står åpent på hver oppgave, hele tiden: navn og hva hver
  enkelt bidrar med.
- **Telefonnumre deles bare mellom dem som deler vakta.** Tre ting må stemme
  samtidig før et nummer vises: oppgaven krever nummer, hun har krysset av for å
  dele det, og den som spør står selv på lista. Da er nummeret ett trykk fra en
  samtale, så to som skal samarbeide kan avtale seg imellom uten å gå veien om
  den ansvarlige. E-postadresser deles aldri.
- **Mine vakter** — lista ligger på telefonen, ingen konto trengs. Herfra melder
  man også avbud.
- **Legg i kalenderen** — vakta inn i telefonens egen kalender med påminnelse.

### De tre varslene

Push er den eneste veien menigheten når folk av seg selv. Derfor er det få og
korte varsler, og ingen av dem er e-post:

| Når | Hvem får det |
| --- | --- |
| Det er lagt ut en ny oppgave som trenger folk | Alle med appen. Én gang per oppgave — en hel serie deler ett varsel |
| Noen har meldt avbud | Alle med appen, unntatt hun som meldte avbud og de som alt står på lista |
| Dagen før en vakt du har sagt ja til | Bare du |

Avbudsvarselet er grunnen til at avbud er en knapp og ikke en telefonsamtale: den
som blir forhindret slipper å ringe rundt etter en avløser selv.

Fordi de to første varslene skal nå dem som *ikke* har sagt ja til noe ennå, melder
telefonen seg inn med `POST /api/offentlig/enheter` ved hver oppstart — ikke først
når noen melder seg på noe. Vi lagrer ingenting om personen, bare Expo-tokenet.
Sier man nei til varsler, virker resten av appen som før.

### Hva det krever å melde seg

Navn er alt som kreves. Trenger en oppgave mer, krysser den ansvarlige av for
**Krev telefonnummer** eller **Krev e-postadresse**, og da — og bare da — spør
appen om det. Har man fylt inn nummeret sitt én gang, ligger det klart neste gang
noe krever det.

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

Fire profiler i `eas.json`: `utvikling` (development client mot localhost),
`simulator` (kjører i iOS-simulatoren, og er den eneste som ikke krever et
betalt Apple-medlemskap), `test` (intern distribusjon) og `produksjon` (til
butikkene).

**Dette trenger dere før innsending:**

- Apple Developer Program, 99 USD i året, og en App Store Connect-app med
  pakke-id `no.skjoldmenighet.app`.
- Google Play Developer, 25 USD én gang.
- Personvernerklæringen ligger på `/personvern`, og appen lenker dit fra
  velkomsten og fra Mine vakter — Apple krever at den er å finne inne i appen,
  ikke bare i butikkoppføringen. Den bør leses av noen som kan personvern før
  dere sender inn, og må endres i samme slengen som dere endrer hva som lagres
  eller deles.
- **Sletterutinen står i erklæringen, men ingenting utfører den.** Teksten sier
  at oppgaver slettes ett til to døgn etter at de har vært; i dag må noen gjøre
  det for hånd fra **Alle arrangementer**. Enten holder dere rutinen, eller så
  bør cron-jobben rydde selv.
- **Serveren står i USA**, altså utenfor EØS. Overføringen trenger et grunnlag —
  Data Privacy Framework eller standard personvernbestemmelser. Railway kan
  kjøre i EU i stedet, og da faller hele spørsmålet bort; husk å endre
  erklæringen om dere flytter.
- Skjermbilder. `eas build` gir dere appen; skjermbildene tar dere i simulator.

Ikonene ligger i `mobil/assets/` og lages av `mobil/verktoy/lag-ikoner.py`.
Merket er et kirkevindu med kirkeåret som en farget søyle inni.

**Om Apples «minimum functionality»:** Apple avviser apper som bare er en
nettside i et skall. Push-varsler og kalenderintegrasjon er grunnen til at dette
er en app og ikke bare nettsiden — nevn dem i innsendingsnotatet. Avbudsvarselet
er det tydeligste eksemplet: det er hele grunnen til at appen finnes.

## Nettsiden og admin

Samme innhold som appen, for dem som ikke laster ned noe — også lista over hvem
som har meldt seg. Fra nett får man ingen varsler; det er appen som gjør det.
Admin ligger på `/admin`: hvor mange som mangler, frivilliglista med kontakt-
opplysninger, CSV-nedlasting, meldingsutsending og skjema for å opprette og
redigere arrangementer. Arrangementer slettes fra lista
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

Migreringen døper også om kolonnene fra den gamle modellen — `kapasitet` ble
`trengs`, `kontakt_navn` ble `navn`, `melding` ble `bidrag` — uten å miste noe,
og merker arrangementer som alt lå der som «allerede varslet», så ingen får
tolv varsler første gang den nye koden ruller ut. Tabellen `deltakere` hører til
modellen der én kunne melde på flere, og røres ikke. Er dere ferdige med
innholdet: `drop table deltakere;`

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
finnes ingen vei utenom serveren til det som ligger der. Innloggingen er Auth.js
med økten i en signert cookie.

Vær klar over hva som *med vilje* er åpent: navnene på frivilliglista, og hva
hver enkelt bidrar med, ligger på `/api/offentlig/arrangementer/{slug}` og på
arrangementssiden, uten innlogging. Det er lesbart for alle som kjenner
adressen. Det er prisen for en app helt uten kontoer, og den er tatt med vilje.

**Telefonnumrene er ikke en del av det.** De krever tre ting samtidig:

1. oppgaven krever nummer (`krev_telefon` på arrangementet),
2. den frivillige har krysset av for å dele det (`del_nummer` på påmeldingen,
   avslått som standard),
3. og den som spør står selv på lista.

Det siste vises ved å sende sin egen påmeldings-id i `x-pamelding-id`. Den ligger
bare på telefonen til den som har sagt ja, og er det nærmeste en nøkkel vi har.
Den er ingen ekte innlogging — den som får tak i en gyldig id, kommer inn — men
den skiller den som deler vakta fra hvem som helst, og det er skillet som betyr
noe her.

Arrangementssidene på nett er merket `noindex`. De navngir folk, og skal ikke
kunne søkes opp på navnet til en frivillig. Forsiden indekseres som før; den
viser hva som skjer, uten navn. Numrene skrives aldri inn i HTML-en i det hele
tatt, bare i API-svaret til appen.

E-postadresser deles aldri; de brukes bare til utsending fra admin.

Dette er teknikken. Selve personvernvurderingen — og personvernerklæringen
butikkene krever — hører hjemme hos menigheten som behandlingsansvarlig, og bør
nevne uttrykkelig at numre kan vises til andre frivillige.

### Koble til Brevo

1. Lag en API-nøkkel på [brevo.com](https://brevo.com) under **SMTP & API → API Keys**.
2. Legg inn i `web/.env.local`:

   ```
   BREVO_API_KEY=xkeysib-...
   BREVO_SENDER_NAME=Skjold menighet
   BREVO_SENDER_EMAIL=post@skjold-menighet.no
   ```

3. Avsenderadressen må være verifisert i Brevo under **Senders & IP**.

E-post går bare **én** vei: meldinger den ansvarlige skriver og sender selv fra
admin. Alt som går ut av seg selv er push til appen — se «De tre varslene»
ovenfor. Den som melder seg får **ingen** bekreftelses-e-post; kvitteringen i
appen kommer med én gang.

Utsending kan aldri velte det som utløste den: feiler e-posten eller pushen, er
påmeldingen eller avbudet likevel lagret, og feilen logges.

Den ansvarlige får heller ingen oppsummering på e-post lenger. Hun trenger den
ikke — lista står oppdatert i appen og i admin hele tiden, og kan lastes ned som
CSV når hun skal handle inn.

### Påminnelser og utsending

`GET /api/varsler/paaminnelser` gjør to ting: sender påminnelsen til alle som har
en vakt som starter om mellom 20 og 28 timer, og tar igjen «det trengs
frivillige»-varsler som ikke kom av gårde da arrangementet ble publisert. Begge
merkes som sendt, så ingenting går ut to ganger. Ruta er beskyttet av
`CRON_SECRET` og skal kjøres én gang i timen — se cron-jobben under utrullingen
nedenfor.

Varselet om en ny oppgave sendes til vanlig med én gang den ansvarlige
publiserer, ikke av cron-jobben. Jobben er sikkerhetsnettet.

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

Påminnelsene trenger et kall hver time. I Railway: *New* →
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

- **Profilen følger ikke med til ny telefon.** Den ligger bare lokalt. Skal den
  flytte med, må det en ekte innlogging til — SMS-kode eller e-postlenke.
- **Ingen kan skru av enkelte varsler.** Man sier ja eller nei til alt, i
  telefonens egne innstillinger. Blir det for mye, er det per-oppgave-typer som
  må til — ikke flere brytere i appen.
- **Faste vaktlister.** «Ingrid tar kirkekaffen hver tredje søndag» må legges inn
  som en serie, og Ingrid må si ja til hver enkelt.
- **Ingen ser hvem som pleier å stille.** Systemet husker ikke folk mellom
  oppgaver, så ingen kan se at noen har tatt fire vakter på rad — eller ingen.
