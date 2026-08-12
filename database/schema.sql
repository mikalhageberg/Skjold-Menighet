-- ═══════════════════════════════════════════════════════════════════════
-- Skjold menighet — databaseoppsett for SQLite
--
-- Kjøres med:  npm run db:migrer
-- Trygt å kjøre om igjen; alt er «if not exists».
--
-- Databasen er én fil, som regel liggende på et Railway-volum. Bare
-- serveren har tilgang til fila, så det finnes ingen vei utenom serveren
-- til påmeldingslistene.
--
-- SQLite har ingen egen boolean- eller tidssone-type: sant/usant lagres
-- som 0/1, og tidspunkt som ISO 8601-tekst (f.eks. 2026-08-12T07:00:00.000Z),
-- alltid generert i koden — aldri av databasen selv.
-- ═══════════════════════════════════════════════════════════════════════

-- ── Arrangementer ─────────────────────────────────────────────────────

create table if not exists arrangementer (
  id                text primary key,
  slug              text not null unique,
  tittel            text not null,
  ingress           text,
  beskrivelse       text,
  starter           text not null,
  slutter           text,
  sted              text not null default 'Skjold kirke',
  kapasitet         integer check (kapasitet is null or kapasitet > 0),
  pamelding_stenger text,
  tillat_flere      integer not null default 1,
  sporr_om_kost     integer not null default 0,
  -- Påmelding krever bare navn. Trenger arrangementet mer, skrus det på her.
  krev_telefon      integer not null default 0,
  krev_epost        integer not null default 0,
  -- Oppsummeringen til den ansvarlige: hvor mange dager før start den sendes.
  -- null betyr at den ikke sendes. Sendes kl. 08 den dagen, én gang.
  oppsummering_dager_for integer check (oppsummering_dager_for is null or oppsummering_dager_for between 0 and 60),
  oppsummering_sendt     text,
  ansvarlig_navn    text,
  ansvarlig_epost   text,
  publisert         integer not null default 0,
  -- AI-generert headline-bilde. bilde_generert er null når det ikke finnes
  -- noe bilde; ellers tidspunktet det sist ble satt, brukt som cache-nøkkel.
  bilde             blob,
  bilde_type        text,
  bilde_generert    text,
  -- Satt når arrangementet ble opprettet som del av en serie med gjentakelser.
  -- Selve gjentakelsesregelen lagres ikke — hver forekomst er en helt vanlig,
  -- selvstendig rad etter at serien er opprettet, og kan endres for seg.
  serie_id          text,
  opprettet         text not null,
  endret            text not null
);

create index if not exists arrangementer_starter_idx
  on arrangementer (starter)
  where publisert = 1;

-- arrangementer_serie_idx opprettes i migrer.mjs, etter at serie_id-kolonnen
-- er lagt til — en «create index» her ville feile på en database som ennå
-- ikke har fått kolonnen fra alter table-steget.

-- ── Enheter ───────────────────────────────────────────────────────────
-- Telefoner som har sagt ja til påminnelser. Én rad per installasjon.
-- Vi lagrer ingenting om personen, bare tokenet Expo bruker for å nå den.

create table if not exists enheter (
  id         text primary key,
  expo_token text not null unique,
  plattform  text,
  opprettet  text not null,
  sist_sett  text not null
);

-- ── Påmeldinger ───────────────────────────────────────────────────────
-- Én påmelding = én kontaktperson som melder på én eller flere deltakere.
-- Det er dette som gjør at man kan melde på naboen eller hele familien.

create table if not exists pameldinger (
  id                text primary key,
  arrangement_id    text not null references arrangementer(id) on delete cascade,
  enhet_id          text references enheter(id) on delete set null,
  kontakt_navn      text not null,
  kontakt_telefon   text,
  kontakt_epost     text,
  melding           text,
  avmeldt           text,
  paaminnelse_sendt text,
  opprettet         text not null
);

create index if not exists pameldinger_arrangement_idx
  on pameldinger (arrangement_id, opprettet);

create table if not exists deltakere (
  id           text primary key,
  pamelding_id text not null references pameldinger(id) on delete cascade,
  navn         text not null,
  er_kontakt   integer not null default 0,
  kosthold     text,
  opprettet    text not null
);

create index if not exists deltakere_pamelding_idx
  on deltakere (pamelding_id);

-- Brukes av påminnelsesjobben: finn påmeldinger som ennå ikke er varslet.
create index if not exists pameldinger_paaminnelse_idx
  on pameldinger (arrangement_id)
  where avmeldt is null and paaminnelse_sendt is null;

-- ── Administratorer ───────────────────────────────────────────────────
-- De som skal inn på /admin. Passordet lagres aldri, bare en argon2-hash.
-- Legg til folk med:  npm run ny-admin

create table if not exists administratorer (
  id             text primary key,
  epost          text not null unique,
  navn           text,
  passord_hash   text not null,
  opprettet      text not null,
  sist_innlogget text
);
