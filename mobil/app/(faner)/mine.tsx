import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { dag, klokka, maned, nartid, sesongFor, ukedag } from "@skjold/delt";
import { meldAv } from "@/lib/api";
import { glem, hentMine, type MinPamelding } from "@/lib/lager";
import { hentProfil, type Profil } from "@/lib/profil";
import { Tekst } from "@/design/Grunnelementer";
import { farge, radius, rom, TREFF } from "@/design/tema";

/**
 * Vaktene telefonen husker at du har sagt ja til. Ingen innlogging — lista
 * bor på telefonen, og er der for å svare på «hva var det jeg sa ja til?»
 *
 * Det er også herfra man melder avbud. Da går det ut et varsel til de andre
 * med appen om at det trengs en avløser, så ingen trenger å ringe rundt.
 */
export default function Mine() {
  const router = useRouter();
  const [mine, settMine] = useState<MinPamelding[] | null>(null);
  const [profil, settProfil] = useState<Profil | null>(null);
  const [avmelder, settAvmelder] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      hentMine().then(settMine);
      hentProfil().then(settProfil);
    }, []),
  );

  function sporAvmelding(p: MinPamelding) {
    Alert.alert(
      "Melde avbud?",
      `Du tas av lista til «${p.tittel}», og de andre med appen får beskjed om at det trengs en avløser. Du kan ikke angre selv i appen etterpå.`,
      [
        { text: "Avbryt", style: "cancel" },
        { text: "Meld avbud", style: "destructive", onPress: () => utforAvmelding(p) },
      ],
    );
  }

  async function utforAvmelding(p: MinPamelding) {
    settAvmelder(p.pameldingId);
    const svar = await meldAv(p.pameldingId);
    settAvmelder(null);

    if (!svar.ok) {
      Alert.alert("Fikk det ikke til", svar.feil);
      return;
    }

    await glem(p.pameldingId);
    settMine((liste) => liste?.filter((x) => x.pameldingId !== p.pameldingId) ?? liste);
  }

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
          <Tekst variant="mellom">Ingen vakter ennå</Tekst>
          <Tekst farget="myk">
            Når du sier ja til noe, samles det her — med tid, sted og hva du sa du skulle
            bidra med.
          </Tekst>
          <Pressable
            onPress={() => router.push("/")}
            accessibilityRole="button"
            style={stil.lenke}
          >
            <Tekst farget="messing" halvfet>
              Se hva som trenger folk
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
          <View key={p.pameldingId} style={stil.kort}>
            <View style={[stil.kant, { backgroundColor: sesong.farge }]} />
            <View style={stil.kropp}>
              <Pressable
                onPress={() =>
                  router.push(
                    `/arrangement/${p.slug}?fra=${encodeURIComponent("Mine vakter")}`,
                  )
                }
                accessibilityRole="button"
                accessibilityLabel={`${p.tittel}, ${nartid(start)}`}
                style={({ pressed }) => [stil.kortinnhold, pressed && { opacity: 0.6 }]}
              >
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

                {p.bidrag ? (
                  <View style={stil.navn}>
                    <Tekst variant="etikett" farget="myk">
                      Du bidrar med
                    </Tekst>
                    <Tekst variant="liten">{p.bidrag}</Tekst>
                  </View>
                ) : null}
              </Pressable>

              <Pressable
                onPress={() => sporAvmelding(p)}
                disabled={avmelder === p.pameldingId}
                accessibilityRole="button"
                accessibilityLabel={`Meld avbud fra ${p.tittel}`}
                style={stil.avmeld}
                hitSlop={8}
              >
                <Tekst variant="liten" farget="rod">
                  {avmelder === p.pameldingId ? "Melder avbud …" : "Meld avbud"}
                </Tekst>
              </Pressable>
            </View>
          </View>
        );
      })}

      {mine && mine.length > 0 ? (
        <Tekst variant="liten" farget="svak" style={{ marginTop: rom.m }}>
          Lista ligger på denne telefonen. Blir du forhindret, meld avbud over — da spør vi
          de andre for deg.
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
  kropp: { flex: 1, padding: rom.l },
  kortinnhold: { gap: rom.xs },
  navn: {
    marginTop: rom.s,
    paddingTop: rom.s,
    borderTopWidth: 1,
    borderTopColor: farge.strekSvak,
    gap: 2,
  },
  avmeld: {
    marginTop: rom.s,
    alignSelf: "flex-start",
    minHeight: TREFF,
    justifyContent: "center",
  },
});
