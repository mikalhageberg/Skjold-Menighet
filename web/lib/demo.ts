import "server-only";
import type { Arrangement, Pamelding } from "@skjold/delt";

/**
 * Demodata som brukes når databasen ikke er satt opp ennå, slik at
 * `npm run dev` viser en levende app fra første minutt. Alt som
 * skrives her ligger i minnet og forsvinner når serveren stopper.
 */

function om(dager: number, time: number, minutt = 0) {
  const d = new Date();
  d.setDate(d.getDate() + dager);
  d.setHours(time, minutt, 0, 0);
  return d.toISOString();
}

function lagArrangementer(): Arrangement[] {
  return [
    {
      id: "d1",
      slug: "formiddagstreff-august",
      tittel: "Formiddagstreff",
      ingress: "Vi trenger folk til vaffelsteking, kaffe og opprydding.",
      beskrivelse:
        "Formiddagstreffet samler rundt førti stykker, og vi trenger fire som tar imot, steker vafler og koker kaffe.\n\nDu møter en halvtime før og blir til rundt to timer etter. Har du bakt noe, tar vi gjerne imot det også — skriv det i «Jeg bidrar med».\n\nTrenger du skyss, si fra til Marit.",
      starter: om(3, 11, 0),
      slutter: om(3, 13, 0),
      sted: "Menighetssalen",
      trengs: 4,
      pamelding_stenger: om(2, 20, 0),
      krev_telefon: true,
      krev_epost: false,
      ansvarlig_navn: "Marit Lund",
      ansvarlig_epost: "marit@skjold-menighet.no",
      publisert: true,
      bilde_generert: null,
      serie_id: null,
      opprettet: om(-20, 9),
    },
    {
      id: "d2",
      slug: "kirkekaffe-sondag",
      tittel: "Kirkekaffe",
      ingress: "To til å dekke bord og rydde etter gudstjenesten.",
      beskrivelse:
        "Vi dekker langbord bak i kirkerommet med kaffe, saft og noe å bite i.\n\nDet holder at to stiller. Kommer det flere, går det bare raskere å rydde.",
      starter: om(5, 12, 0),
      slutter: om(5, 13, 30),
      sted: "Skjold kirke",
      trengs: 2,
      pamelding_stenger: null,
      krev_telefon: false,
      krev_epost: false,
      ansvarlig_navn: "Olav Rygg",
      ansvarlig_epost: "olav@skjold-menighet.no",
      publisert: true,
      bilde_generert: null,
      serie_id: null,
      opprettet: om(-14, 9),
    },
    {
      id: "d3",
      slug: "familiemiddag-torsdag",
      tittel: "Familiemiddag",
      ingress: "Kjøkkenvakt: seks som lager, serverer og vasker opp.",
      beskrivelse:
        "Kjøttkaker med ertestuing til rundt åtti. Barna spiser først, så er det lek i kjelleren mens de voksne får kaffe.\n\nSkriv gjerne i «Jeg bidrar med» om du helst vil stå på kjøkkenet, servere eller ta oppvasken.",
      starter: om(11, 16, 30),
      slutter: om(11, 18, 30),
      sted: "Menighetssalen",
      trengs: 6,
      pamelding_stenger: om(9, 12, 0),
      krev_telefon: false,
      krev_epost: false,
      ansvarlig_navn: "Hanne Vik",
      ansvarlig_epost: "hanne@skjold-menighet.no",
      publisert: true,
      bilde_generert: null,
      serie_id: null,
      opprettet: om(-9, 9),
    },
    {
      id: "d4",
      slug: "babysang-host",
      tittel: "Babysang",
      ingress: "Én medhjelper til lunsjen, ti torsdager framover.",
      beskrivelse:
        "Sang, rim og regler i kirkerommet, etterfulgt av lunsj. Kari tar sangen; vi trenger én til å smøre og rydde.\n\nDette gjelder hele høstsemesteret.",
      starter: om(26, 11, 0),
      slutter: om(26, 13, 0),
      sted: "Skjold kirke",
      trengs: 1,
      pamelding_stenger: om(24, 12, 0),
      krev_telefon: false,
      krev_epost: true,
      ansvarlig_navn: "Kari Nesheim",
      ansvarlig_epost: "kari@skjold-menighet.no",
      publisert: true,
      bilde_generert: null,
      serie_id: null,
      opprettet: om(-30, 9),
    },
    {
      id: "d5",
      slug: "konsert-host",
      tittel: "Høstkonsert med Skjold kantori",
      ingress: "Dørvakter, billettbord og rigging av stoler.",
      beskrivelse:
        "Skjold kantori inviterer til høstkonsert. Vi trenger folk som møter en time før for å rigge stoler, står i døra og teller opp kollekten etterpå.",
      starter: om(40, 19, 0),
      slutter: om(40, 20, 30),
      sted: "Skjold kirke",
      trengs: 5,
      pamelding_stenger: null,
      krev_telefon: false,
      krev_epost: false,
      ansvarlig_navn: "Jon Eide",
      ansvarlig_epost: "jon@skjold-menighet.no",
      publisert: true,
      bilde_generert: null,
      serie_id: null,
      opprettet: om(-5, 9),
    },
    {
      id: "d6",
      slug: "julemesse",
      tittel: "Julemesse",
      ingress: "Boder, loddsalg, kaker og kjøkken — vi trenger mange.",
      beskrivelse: "Vi fyller menighetssalen med boder, kaker og loddbøker.",
      starter: om(120, 12, 0),
      slutter: om(120, 16, 0),
      sted: "Menighetssalen",
      trengs: null,
      pamelding_stenger: null,
      krev_telefon: false,
      krev_epost: false,
      ansvarlig_navn: "Marit Lund",
      ansvarlig_epost: "marit@skjold-menighet.no",
      publisert: false,
      bilde_generert: null,
      serie_id: null,
      opprettet: om(-2, 9),
    },
    {
      id: "d7",
      slug: "lysmesse",
      tittel: "Lysmesse",
      ingress: "Grøtkokere og noen som tar imot i døra.",
      beskrivelse:
        "Årets konfirmanter har laget hele gudstjenesten selv. Etterpå er det risgrøt i menighetssalen, og den koker seg ikke selv.",
      starter: om(118, 18, 0),
      slutter: om(118, 20, 0),
      sted: "Skjold kirke",
      trengs: 4,
      pamelding_stenger: om(116, 12, 0),
      krev_telefon: false,
      krev_epost: false,
      ansvarlig_navn: "Jon Eide",
      ansvarlig_epost: "jon@skjold-menighet.no",
      publisert: true,
      bilde_generert: null,
      serie_id: null,
      opprettet: om(-1, 9),
    },
    {
      id: "d8",
      slug: "tur-til-haugesund",
      tittel: "Tur til Haugesund domkirke",
      ingress: "To turledere. Begge plassene er tatt.",
      beskrivelse:
        "Vi tar bussen til Haugesund, får omvisning i domkirken og spiser middag før vi kjører hjem. Turlederne teller passasjerer og holder styr på tidene.",
      starter: om(19, 9, 30),
      slutter: om(19, 17, 0),
      sted: "Avreise fra kirkebakken",
      trengs: 2,
      pamelding_stenger: om(15, 12, 0),
      krev_telefon: false,
      krev_epost: false,
      ansvarlig_navn: "Olav Rygg",
      ansvarlig_epost: "olav@skjold-menighet.no",
      publisert: true,
      bilde_generert: null,
      serie_id: null,
      opprettet: om(-6, 9),
    },
  ];
}

type Lager = {
  arrangementer: Arrangement[];
  pameldinger: Pamelding[];
};

const globalt = globalThis as unknown as { __skjoldDemo?: Lager };

export function demolager(): Lager {
  if (!globalt.__skjoldDemo) {
    const arrangementer = lagArrangementer();
    globalt.__skjoldDemo = {
      arrangementer,
      pameldinger: lagPameldinger(),
    };
  }
  return globalt.__skjoldDemo;
}

function lagPameldinger(): Pamelding[] {
  // Siste feltet er om nummeret deles med de andre frivillige. De fleste
  // sier ja, men ikke alle — og demodataene skal vise begge deler.
  const frivillige: [string, string, string | null, string, boolean][] = [
    ["Ingrid Bruvik", "952 14 077", "Tar med to plater sukkerbrød", "d1", true],
    ["Torbjørn Aase", "918 33 210", "Kaffe og rigging", "d1", true],
    ["Solveig Haaland", "476 90 118", null, "d1", false],
    ["Bjørg Tveit", "992 45 630", "Står gjerne på kjøkkenet", "d3", true],
    ["Kåre Sandvik", "913 76 204", "Tar oppvasken", "d3", false],
    ["Gerd Ims", "901 22 845", "Turleder", "d8", true],
    ["Håkon Vestbø", "466 71 309", "Turleder", "d8", true],
  ];
  return frivillige.map(([navn, telefon, bidrag, arrangement, delNummer], i) => ({
    id: `p${i}`,
    arrangement_id: arrangement,
    navn,
    telefon,
    epost: null,
    bidrag,
    del_nummer: delNummer,
    avmeldt: null,
    opprettet: om(-i - 1, 14),
  }));
}
