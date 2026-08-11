-- ═══════════════════════════════════════════════════════════════════════
-- Skjold menighet — databaseoppsett for Postgres
--
-- Kjøres med:  npm run db:migrer
-- Trygt å kjøre om igjen; alt er «if not exists» eller «or replace».
--
-- Sikkerhetsmodellen: bare serveren snakker med databasen, med én
-- tilkobling som ingen andre har. Verken nettleseren eller appen ser
-- databasen, så det finnes ingen vei utenom serveren til påmeldingslistene.
-- ═══════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ── Arrangementer ─────────────────────────────────────────────────────

create table if not exists arrangementer (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,
  tittel            text not null,
  ingress           text,
  beskrivelse       text,
  starter           timestamptz not null,
  slutter           timestamptz,
  sted              text not null default 'Skjold kirke',
  kapasitet         integer check (kapasitet is null or kapasitet > 0),
  pamelding_stenger timestamptz,
  tillat_flere      boolean not null default true,
  sporr_om_kost     boolean not null default false,
  -- Påmelding krever bare navn. Trenger arrangementet mer, skrus det på her.
  krev_telefon      boolean not null default false,
  krev_epost        boolean not null default false,
  -- Oppsummeringen til den ansvarlige: hvor mange dager før start den sendes.
  -- null betyr at den ikke sendes. Sendes kl. 08 den dagen, én gang.
  oppsummering_dager_for integer check (oppsummering_dager_for between 0 and 60),
  oppsummering_sendt     timestamptz,
  ansvarlig_navn    text,
  ansvarlig_epost   text,
  publisert         boolean not null default false,
  opprettet         timestamptz not null default now(),
  endret            timestamptz not null default now()
);

create index if not exists arrangementer_starter_idx
  on arrangementer (starter)
  where publisert;

-- ── Enheter ───────────────────────────────────────────────────────────
-- Telefoner som har sagt ja til påminnelser. Én rad per installasjon.
-- Vi lagrer ingenting om personen, bare tokenet Expo bruker for å nå den.

create table if not exists enheter (
  id         uuid primary key default gen_random_uuid(),
  expo_token text not null unique,
  plattform  text,
  opprettet  timestamptz not null default now(),
  sist_sett  timestamptz not null default now()
);

-- ── Påmeldinger ───────────────────────────────────────────────────────
-- Én påmelding = én kontaktperson som melder på én eller flere deltakere.
-- Det er dette som gjør at man kan melde på naboen eller hele familien.

create table if not exists pameldinger (
  id                uuid primary key default gen_random_uuid(),
  arrangement_id    uuid not null references arrangementer(id) on delete cascade,
  enhet_id          uuid references enheter(id) on delete set null,
  kontakt_navn      text not null,
  kontakt_telefon   text,
  kontakt_epost     text,
  melding           text,
  avmeldt           timestamptz,
  paaminnelse_sendt timestamptz,
  opprettet         timestamptz not null default now()
);

create index if not exists pameldinger_arrangement_idx
  on pameldinger (arrangement_id, opprettet);

create table if not exists deltakere (
  id           uuid primary key default gen_random_uuid(),
  pamelding_id uuid not null references pameldinger(id) on delete cascade,
  navn         text not null,
  er_kontakt   boolean not null default false,
  kosthold     text,
  opprettet    timestamptz not null default now()
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
  id           uuid primary key default gen_random_uuid(),
  epost        text not null unique,
  navn         text,
  passord_hash text not null,
  opprettet    timestamptz not null default now(),
  sist_innlogget timestamptz
);

-- ── Automatikk ────────────────────────────────────────────────────────

create or replace function sett_endret()
returns trigger
language plpgsql
as $$
begin
  new.endret = now();
  return new;
end;
$$;

drop trigger if exists arrangementer_endret on arrangementer;
create trigger arrangementer_endret
  before update on arrangementer
  for each row execute function sett_endret();
