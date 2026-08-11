import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import {
  dag,
  klokka,
  maned,
  pameldingsstatus,
  plasstekst,
  sesongFor,
  tidsrom,
  ukedag,
  type ArrangementMedAntall,
} from "@skjold/delt";
import { Tekst } from "@/design/Grunnelementer";
import { farge, radius, rom, skrift } from "@/design/tema";

/**
 * Ett arrangement som ett kort.
 *
 * Kanten til venstre har den liturgiske fargen for tiden i kirkeåret
 * arrangementet faller i — grønn i treenighetstiden, fiolett i advent og
 * faste. Det er det eneste stedet farge brukes, så bladingen blir rolig
 * samtidig som året merkes.
 */
export function Arrangementskort({
  arrangement,
  pameldt,
}: {
  arrangement: ArrangementMedAntall;
  pameldt?: boolean;
}) {
  const router = useRouter();
  const start = new Date(arrangement.starter);
  const sesong = sesongFor(start);
  const status = pameldingsstatus(arrangement);
  const fullt = !status.apen && status.grunn === "fullt";

  return (
    <Pressable
        onPress={() => router.push(`/arrangement/${arrangement.slug}`)}
        accessibilityRole="button"
        accessibilityLabel={`${arrangement.tittel}, ${ukedag(start)} ${dag(start)}. ${
          maned(start).split(" ")[0]
        } klokka ${klokka(start)}. ${plasstekst(arrangement)}`}
        style={({ pressed }) => [stil.kort, pressed && stil.trykket]}
      >
        <View style={[stil.kant, { backgroundColor: sesong.farge }]} />

        <View style={stil.innhold}>
          <View style={stil.topp}>
            <View style={stil.dato}>
              <Tekst style={stil.datoTall}>{dag(start)}</Tekst>
              <Tekst variant="etikett" farget="myk">
                {ukedag(start).slice(0, 3)}
              </Tekst>
            </View>

            <View style={stil.tittelfelt}>
              <Tekst variant="mellom" halvfet numberOfLines={2}>
                {arrangement.tittel}
              </Tekst>
              <Tekst variant="liten" farget="myk">
                {tidsrom(start, arrangement.slutter ? new Date(arrangement.slutter) : null)} ·{" "}
                {arrangement.sted}
              </Tekst>
            </View>
          </View>

          {arrangement.ingress ? (
            <Tekst variant="liten" farget="myk" numberOfLines={3}>
              {arrangement.ingress}
            </Tekst>
          ) : null}

          <View style={stil.bunn}>
            <Tekst variant="liten" farget={fullt ? "rod" : "myk"}>
              {plasstekst(arrangement)}
            </Tekst>
            {pameldt ? (
              <View style={stil.merke}>
                <Tekst variant="etikett" farget="messing">
                  Du er påmeldt
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
  topp: { flexDirection: "row", gap: rom.l, alignItems: "flex-start" },
  dato: { width: 42, alignItems: "center" },
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
