import { Image, Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import {
  dag,
  frivilligtekst,
  klokka,
  maned,
  manedKort,
  pameldingsstatus,
  sesongFor,
  tidsrom,
  ukedag,
  type ArrangementMedAntall,
} from "@skjold/delt";
import { Tekst } from "@/design/Grunnelementer";
import { farge, MAKS_TITTELSKALA, radius, rom, skrift } from "@/design/tema";
import { useTekstskala } from "@/design/tekstskala";
import { API_BASE } from "@/lib/api";

/**
 * Én oppgave som trenger folk, som ett kort.
 *
 * Kanten til venstre har den liturgiske fargen for tiden i kirkeåret
 * arrangementet faller i — grønn i treenighetstiden, fiolett i advent og
 * faste. Det er det eneste stedet farge brukes, så bladingen blir rolig
 * samtidig som året merkes.
 */
export function Arrangementskort({
  arrangement,
  pameldt,
  fra = "Vi trenger deg",
}: {
  arrangement: ArrangementMedAntall;
  /** Om du selv står på lista til denne. */
  pameldt?: boolean;
  /** Fanenavnet man kommer fra, så tilbakeknappen på arrangementssiden viser riktig tekst. */
  fra?: string;
}) {
  const router = useRouter();
  const { stor } = useTekstskala();
  const start = new Date(arrangement.starter);
  const sesong = sesongFor(start);
  const status = pameldingsstatus(arrangement);
  // Rødt bare når noe nært i tid fortsatt mangler folk. Var alt som manglet
  // noen rødt, ville hele lista lyse, og da sier fargen ingenting.
  const haster =
    status.apen &&
    status.mangler !== null &&
    start.getTime() < Date.now() + 7 * 86400000;

  return (
    <Pressable
        onPress={() =>
          router.push(`/arrangement/${arrangement.slug}?fra=${encodeURIComponent(fra)}`)
        }
        accessibilityRole="button"
        accessibilityLabel={`${arrangement.tittel}, ${ukedag(start)} ${dag(start)}. ${
          maned(start).split(" ")[0]
        } klokka ${klokka(start)}. ${frivilligtekst(arrangement)}`}
        style={({ pressed }) => [stil.kort, pressed && stil.trykket]}
      >
        <View style={[stil.kant, { backgroundColor: sesong.farge }]} />

        <View style={stil.innhold}>
          {arrangement.bilde_generert ? (
            <Image
              source={{
                uri: `${API_BASE}/api/offentlig/bilde/${arrangement.id}?v=${encodeURIComponent(arrangement.bilde_generert)}`,
              }}
              style={stil.bilde}
              accessibilityIgnoresInvertColors
            />
          ) : null}

          {/* Med stor tekst legger datoen seg over tittelen i stedet for ved
              siden av, så tittelen får hele bredden. Ellers brekkes lange
              ord som «Formiddagstreff» midt i. Tittel, tid og sted kuttes
              aldri av — det er nettopp det man trenger for å bestemme seg. */}
          <View style={stor ? stil.toppStor : stil.topp}>
            <View style={stor ? stil.datoStor : stil.dato}>
              {/* Måneden står under tallet, så man ser hvilken 25. det er
                  uten å lete etter månedsoverskriften over. */}
              <View style={stil.dagOgManed}>
                <Tekst
                  style={stil.datoTall}
                  numberOfLines={1}
                  maxFontSizeMultiplier={MAKS_TITTELSKALA}
                >
                  {dag(start)}
                </Tekst>
                <Tekst variant="etikett" farget="myk">
                  {manedKort(start)}
                </Tekst>
              </View>
              <Tekst variant="etikett" farget="myk">
                {ukedag(start).slice(0, 3)}
              </Tekst>
            </View>

            <View style={stil.tittelfelt}>
              <Tekst variant="mellom" halvfet>
                {arrangement.tittel}
              </Tekst>
              <Tekst variant="liten" farget="myk">
                {tidsrom(start, arrangement.slutter ? new Date(arrangement.slutter) : null)}
              </Tekst>
              <Tekst variant="liten" farget="myk">
                {arrangement.sted}
              </Tekst>
            </View>
          </View>

          {/* Ingressen er en smakebit; hele står på arrangementssiden. Med
              stor tekst rommer tre linjer bare en håndfull ord, så den får
              litt mer plass. */}
          {arrangement.ingress ? (
            <Tekst variant="liten" farget="myk" numberOfLines={stor ? 5 : 3}>
              {arrangement.ingress}
            </Tekst>
          ) : null}

          <View style={stil.bunn}>
            <Tekst variant="liten" farget={haster ? "rod" : "myk"}>
              {frivilligtekst(arrangement)}
            </Tekst>
            {pameldt ? (
              <View style={stil.merke}>
                <Tekst variant="etikett" farget="messing">
                  Du har sagt ja
                </Tekst>
              </View>
            ) : null}
          </View>
        </View>
    </Pressable>
  );
}

const stil = StyleSheet.create({
  kort: {
    flexDirection: "row",
    backgroundColor: farge.papir,
    borderWidth: 1,
    borderColor: farge.strek,
    borderRadius: radius.kort,
    overflow: "hidden",
  },
  trykket: { backgroundColor: farge.kalkDyp },
  kant: { width: 4 },
  innhold: { flex: 1, padding: rom.l, gap: rom.m },
  bilde: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: radius.liten,
    backgroundColor: farge.kalkDyp,
  },
  topp: { flexDirection: "row", gap: rom.l, alignItems: "flex-start" },
  toppStor: { gap: rom.s },
  dato: { minWidth: 32, alignItems: "center" },
  datoStor: { flexDirection: "row", alignItems: "baseline", gap: rom.s },
  dagOgManed: { alignItems: "center" },
  datoTall: {
    fontFamily: skrift.display,
    fontSize: 28,
    lineHeight: 30,
    color: farge.gran,
    fontVariant: ["tabular-nums"],
  },
  tittelfelt: { flex: 1, gap: 2 },
  bunn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: rom.m,
    flexWrap: "wrap",
  },
  merke: {
    borderWidth: 1,
    borderColor: farge.messing,
    borderRadius: radius.liten,
    paddingHorizontal: rom.s,
    paddingVertical: 2,
  },
});
