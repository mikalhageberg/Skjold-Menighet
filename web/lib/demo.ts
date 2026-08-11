import "server-only";
import type { Arrangement, PameldingMedDeltakere } from "@skjold/delt";

/**
 * Demodata som brukes når Supabase ikke er satt opp ennå, slik at
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
      ingress: "Vafler, allsang og et kåseri om Skjold-slekter.",
      beskrivelse:
        "Formiddagstreffet er for alle som har tid på formiddagen. Vi begynner med kaffe og vafler, synger noen kjente sanger, og denne gangen kommer Ingrid Bruvik for å fortelle om slektene i Skjold.\n\nTreffet varer omtrent to timer. Det koster ingenting, men vi setter ut en kollektkurv til dekning av bevertningen.\n\nTrenger du skyss, ring menighetskontoret på 52 76 12 00, så ordner vi det.",
      starter: om(3, 11, 0),
      slutter: om(3, 13, 0),
      sted: "Menighetssalen",
      kapasitet: 45,
      pamelding_stenger: om(2, 20, 0),
      tillat_flere: true,
      sporr_om_kost: false,
      krev_telefon: true,
      krev_epost: false,
      oppsummering_dager_for: 1,
      ansvarlig_navn: "Marit Lund",
      ansvarlig_epost: "marit@skjold-menighet.no",
      publisert: true,
      opprettet: om(-20, 9),
    },
    {
      id: "d2",
      slug: "kirkekaffe-sondag",
      tittel: "Kirkekaffe",
      ingress: "Etter gudstjenesten. Ingen påmelding nødvendig, men det hjelper oss å vite antall.",
      beskrivelse:
        "Bli igjen etter gudstjenesten. Vi dekker langbord bak i kirkerommet med kaffe, saft og noe å bite i.\n\nDu trenger ikke melde deg på for å komme, men et anslag hjelper oss å bake nok.",
      starter: om(5, 12, 0),
      slutter: om(5, 13, 30),
      sted: "Skjold kirke",
      kapasitet: null,
      pamelding_stenger: null,
      tillat_flere: true,
      sporr_om_kost: false,
      krev_telefon: false,
      krev_epost: false,
      oppsummering_dager_for: 1,
      ansvarlig_navn: "Olav Rygg",
      ansvarlig_epost: "olav@skjold-menighet.no",
      publisert: true,
      opprettet: om(-14, 9),
    },
    {
      id: "d3",
      slug: "familiemiddag-torsdag",
      tittel: "Familiemiddag",
      ingress: "Varm middag for hele familien. Vi trenger antall innen tirsdag.",
      beskrivelse:
        "Kjøttkaker med ertestuing, og noe grønt til dem som vil ha. Barna spiser først, så er det lek i kjelleren mens de voksne får kaffe.\n\nVi må vite hvor mange vi lager mat til, så meld på hele familien – også barna.",
      starter: om(11, 16, 30),
      slutter: om(11, 18, 30),
      sted: "Menighetssalen",
      kapasitet: 80,
      pamelding_stenger: om(9, 12, 0),
      tillat_flere: true,
      sporr_om_kost: true,
      krev_telefon: false,
      krev_epost: false,
      oppsummering_dager_for: 1,
      ansvarlig_navn: "Hanne Vik",
      ansvarlig_epost: "hanne@skjold-menighet.no",
      publisert: true,
      opprettet: om(-9, 9),
    },
    {
      id: "d4",
      slug: "babysang-host",
      tittel: "Babysang",
      ingress: "Ti torsdager fra september. For barn fra 0 til 1 år med en voksen.",
      beskrivelse:
        "Sang, rim og regler i kirkerommet, etterfulgt av lunsj og god tid til å prate.\n\nPåmeldingen gjelder hele høstsemesteret. Har du spørsmål, ring Kari på 52 76 12 00.",
      starter: om(26, 11, 0),
      slutter: om(26, 13, 0),
      sted: "Skjold kirke",
      kapasitet: 14,
      pamelding_stenger: om(24, 12, 0),
      tillat_flere: false,
      sporr_om_kost: false,
      krev_telefon: false,
      krev_epost: true,
      oppsummering_dager_for: 1,
      ansvarlig_navn: "Kari Nesheim",
      ansvarlig_epost: "kari@skjold-menighet.no",
      publisert: true,
      opprettet: om(-30, 9),
    },
    {
      id: "d5",
      slug: "konsert-host",
      tittel: "Høstkonsert med Skjold kantori",
      ingress: "Kantoriet og elever fra kulturskolen. Fri entré, kollekt ved utgangen.",
      beskrivelse:
        "Skjold kantori inviterer til høstkonsert. På programmet står nordiske salmetoner, folketoner fra Rogaland og et par nyere korverk.\n\nKirken er åpen fra en halvtime før.",
      starter: om(40, 19, 0),
      slutter: om(40, 20, 30),
      sted: "Skjold kirke",
      kapasitet: 200,
      pamelding_stenger: null,
      tillat_flere: true,
      sporr_om_kost: false,
      krev_telefon: false,
      krev_epost: false,
      oppsummering_dager_for: 1,
      ansvarlig_navn: "Jon Eide",
      ansvarlig_epost: "jon@skjold-menighet.no",
      publisert: true,
      opprettet: om(-5, 9),
    },
    {
      id: "d6",
      slug: "julemesse",
      tittel: "Julemesse",
      ingress: "Utlodning, kaker og grøt til inntekt for menighetsarbeidet.",
      beskrivelse: "Vi fyller menighetssalen med boder, kaker og loddbøker. Kom innom.",
      starter: om(120, 12, 0),
      slutter: om(120, 16, 0),
      sted: "Menighetssalen",
      kapasitet: null,
      pamelding_stenger: null,
      tillat_flere: true,
      sporr_om_kost: false,
      krev_telefon: false,
      krev_epost: false,
      oppsummering_dager_for: 1,
      ansvarlig_navn: "Marit Lund",
      ansvarlig_epost: "marit@skjold-menighet.no",
      publisert: false,
      opprettet: om(-2, 9),
    },
    {
      id: "d7",
      slug: "lysmesse",
      tittel: "Lysmesse",
      ingress: "Konfirmantene bærer lys inn i det mørke kirkerommet. Grøt etterpå.",
      beskrivelse:
        "Årets konfirmanter har laget hele gudstjenesten selv. Etterpå er det risgrøt i menighetssalen.\n\nTa med lykt hvis dere går hjemmefra – det er mørkt på veien opp.",
      starter: om(118, 18, 0),
      slutter: om(118, 20, 0),
      sted: "Skjold kirke",
      kapasitet: 200,
      pamelding_stenger: om(116, 12, 0),
      tillat_flere: true,
      sporr_om_kost: true,
      krev_telefon: false,
      krev_epost: false,
      oppsummering_dager_for: 1,
      ansvarlig_navn: "Jon Eide",
      ansvarlig_epost: "jon@skjold-menighet.no",
      publisert: true,
      opprettet: om(-1, 9),
    },
    {
      id: "d8",
      slug: "kirkekaffe-med-fullt-hus",
      tittel: "Tur til Haugesund domkirke",
      ingress: "Buss fra kirken, omvisning og middag. Fullt – vi fører venteliste.",
      beskrivelse:
        "Vi tar bussen til Haugesund, får omvisning i domkirken og spiser middag før vi kjører hjem.",
      starter: om(19, 9, 30),
      slutter: om(19, 17, 0),
      sted: "Avreise fra kirkebakken",
      kapasitet: 5,
      pamelding_stenger: om(15, 12, 0),
      tillat_flere: true,
      sporr_om_kost: true,
      krev_telefon: false,
      krev_epost: false,
      oppsummering_dager_for: 1,
      ansvarlig_navn: "Olav Rygg",
      ansvarlig_epost: "olav@skjold-menighet.no",
      publisert: true,
      opprettet: om(-6, 9),
    },
  ];
}

type Lager = {
  arrangementer: Arrangement[];
  pameldinger: PameldingMedDeltakere[];
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

function lagPameldinger(): PameldingMedDeltakere[] {
  const navn: [string, string, string[], string][] = [
    ["Ingrid Bruvik", "952 14 077", ["Ingrid Bruvik", "Sverre Bruvik"], "d1"],
    ["Torbjørn Aase", "918 33 210", ["Torbjørn Aase"], "d1"],
    ["Solveig Haaland", "476 90 118", ["Solveig Haaland", "Astrid Haaland", "Nils Haaland"], "d1"],
    ["Bjørg Tveit", "992 45 630", ["Bjørg Tveit"], "d3"],
    ["Kåre Sandvik", "913 76 204", ["Kåre Sandvik", "Randi Sandvik"], "d3"],
    ["Gerd Ims", "901 22 845", ["Gerd Ims", "Målfrid Ims", "Sigrun Ims"], "d8"],
    ["Håkon Vestbø", "466 71 309", ["Håkon Vestbø", "Liv Vestbø"], "d8"],
  ];
  return navn.map(([kontakt, telefon, deltakere, arrangement], i) => ({
    id: `p${i}`,
    arrangement_id: arrangement,
    kontakt_navn: kontakt,
    kontakt_telefon: telefon,
    kontakt_epost: null,
    melding: i === 2 ? "Astrid bruker rullator, trenger plass ved enden av bordet." : null,
    avmeldt: null,
    opprettet: om(-i - 1, 14),
    deltakere: deltakere.map((n, j) => ({
      id: `p${i}-d${j}`,
      pamelding_id: `p${i}`,
      navn: n,
      er_kontakt: j === 0,
      kosthold: i === 3 && j === 0 ? "Glutenfritt" : null,
    })),
  }));
}
