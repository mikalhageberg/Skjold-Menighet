import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { dag, klokka, maned, nartid, sesongFor, ukedag } from "@skjold/delt";
import { hentMine, type MinPamelding } from "@/lib/lager";
import { hentProfil, type Profil } from "@/lib/profil";
import { Tekst } from "@/design/Grunnelementer";
import { farge, radius, rom } from "@/design/tema";

/**
 * Det telefonen husker at du har sagt ja til. Ingen innlogging — lista bor
 * på telefonen, og er der for å svare på «hva var det jeg meldte meg på?»
 */
export default function Mine() {
  const router = useRouter();
  const [mine, settMine] = useState<MinPamelding[] | null>(null);
  const [profil, settProfil] = useState<Profil | null>(null);

  useFocusEffect(
    useCallback(() => {
      hentMine().then(settMine);
      hentProfil().then(settProfil);
    }, []),
  );

  // Raden som svarer «hvem er jeg i denne appen», og lar deg rette det.
  const megrad = (
    <Pressable
      onPress={() => router.push("/velkommen?rediger=1")}
      accessibilityRole="button"
      accessibilityLabel={`Endre opplysningene dine. Du er registrert som ${profil?.navn ?? ""}`}
      style={({ pressed }) => [stil.meg, pressed && { backgroundColor: farge.kalkDyp }]}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Tekst variant="etikett" farget="myk">
          Du er
        </Tekst>
        <Tekst halvfet>{profil?.navn ?? "…"}</Tekst>
      </View>
      <Tekst farget="messing" halvfet>
        Endre
      </Tekst>
    </Pressable>
  );

  if (mine && mine.length === 0) {
    return (
      <ScrollView contentContainerStyle={stil.innhold}>
        {megrad}
        <View style={stil.tomt}>
          <Tekst variant="mellom">Ingen påmeldinger ennå</Tekst>
          <Tekst farget="myk">
            Når du melder deg på noe, samles det her — med tid, sted og hvem du meldte på.
          </Tekst>
          <Pressable
            onPress={() => router.push("/")}
            accessibilityRole="button"
            style={stil.lenke}
          >
            <Tekst farget="messing" halvfet>
              Se hva som skjer
            </Tekst>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={stil.innhold}>
      {megrad}
      {mine?.map((p) => {
        const start = new Date(p.starter);
        const sesong = sesongFor(start);
        return (
          <Pressable
              key={p.pameldingId}
              onPress={() => router.push(`/arrangement/${p.slug}`)}
              accessibilityRole="button"
              accessibilityLabel={`${p.tittel}, ${nartid(start)}`}
              style={({ pressed }) => [stil.kort, pressed && { backgroundColor: farge.kalkDyp }]}
            >
              <View style={[stil.kant, { backgroundColor: sesong.farge }]} />
              <View style={stil.kropp}>
                <Tekst variant="etikett" farget="myk">
                  {nartid(start)}
                </Tekst>
                <Tekst variant="mellom" halvfet>
                  {p.tittel}
                </Tekst>
                <Tekst variant="liten" farget="myk">
                  {ukedag(start)} {dag(start)}. {maned(start).split(" ")[0]} kl.{" "}
                  {klokka(start).replace(":", ".")} · {p.sted}
                </Tekst>

                <View style={stil.navn}>
                  <Tekst variant="etikett" farget="myk">
                    {p.deltakere.length === 1 ? "Påmeldt" : `${p.deltakere.length} påmeldte`}
                  </Tekst>
                  <Tekst variant="liten">{p.deltakere.join(", ")}</Tekst>
                </View>
              </View>
            </Pressable>
        );
      })}

      {mine && mine.length > 0 ? (
        <Tekst variant="liten" farget="svak" style={{ marginTop: rom.m }}>
          Lista ligger på denne telefonen. Blir du forhindret, ring menighetskontoret på 52 76
          12 00, så stryker vi deg.
        </Tekst>
      ) : null}
    </ScrollView>
  );
}

const stil = StyleSheet.create({
  innhold: { padding: rom.l, paddingBottom: rom.xxxl, gap: rom.m },
  tomt: { paddingVertical: rom.xxl, gap: rom.s, alignItems: "flex-start" },
  meg: {
    flexDirection: "row",
    alignItems: "center",
    gap: rom.m,
    paddingVertical: rom.m,
    paddingHorizontal: rom.l,
    minHeight: 64,
    backgroundColor: farge.papir,
    borderWidth: 1,
    borderColor: farge.strek,
    borderRadius: radius.kort,
  },
  lenke: { paddingVertical: rom.m, minHeight: 52, justifyContent: "center" },
  kort: {
    flexDirection: "row",
    backgroundColor: farge.papir,
    borderWidth: 1,
    borderColor: farge.strek,
    borderRadius: radius.kort,
    overflow: "hidden",
  },
  kant: { width: 4 },
  kropp: { flex: 1, padding: rom.l, gap: rom.xs },
  navn: {
    marginTop: rom.s,
    paddingTop: rom.s,
    borderTopWidth: 1,
    borderTopColor: farge.strekSvak,
    gap: 2,
  },
});
