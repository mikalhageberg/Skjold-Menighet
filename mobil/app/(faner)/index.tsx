import { useCallback, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { maned, type ArrangementMedAntall } from "@skjold/delt";
import { hentArrangementer } from "@/lib/api";
import { hentMine } from "@/lib/lager";
import { Arrangementskort } from "@/komponenter/Arrangementskort";
import { Knapp, Notis, Tekst } from "@/design/Grunnelementer";
import { farge, rom } from "@/design/tema";

export default function HvaSkjer() {
  const [arrangementer, settArrangementer] = useState<ArrangementMedAntall[] | null>(null);
  const [mineSlugger, settMineSlugger] = useState<Set<string>>(new Set());
  const [feil, settFeil] = useState<string | null>(null);
  const [oppdaterer, settOppdaterer] = useState(false);

  const last = useCallback(async () => {
    try {
      const [liste, mine] = await Promise.all([hentArrangementer(), hentMine()]);
      settArrangementer(liste);
      settMineSlugger(new Set(mine.map((m) => m.slug)));
      settFeil(null);
    } catch (f) {
      settFeil(f instanceof Error ? f.message : "Noe gikk galt.");
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      last();
    }, [last]),
  );

  const oppdater = useCallback(async () => {
    settOppdaterer(true);
    await last();
    settOppdaterer(false);
  }, [last]);

  if (arrangementer === null && !feil) {
    return (
      <View style={stil.midt}>
        <ActivityIndicator color={farge.granMyk} />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={stil.innhold}
      refreshControl={
        <RefreshControl refreshing={oppdaterer} onRefresh={oppdater} tintColor={farge.granMyk} />
      }
    >
      {feil ? (
        <Notis tone="fare">
          <Tekst halvfet>Fikk ikke tak i programmet</Tekst>
          <Tekst variant="liten" farget="myk">
            {feil}
          </Tekst>
          <View style={{ marginTop: rom.s }}>
            <Knapp tittel="Prøv igjen" variant="stille" onPress={oppdater} />
          </View>
        </Notis>
      ) : null}

      {arrangementer && arrangementer.length === 0 ? (
        <View style={stil.tomt}>
          <Tekst variant="mellom">Ingenting står i kalenderen</Tekst>
          <Tekst farget="myk">
            Når menigheten legger ut kirkekaffe, formiddagstreff og middager, dukker de opp
            her. Ring menighetskontoret på 52 76 12 00 om du lurer på noe.
          </Tekst>
        </View>
      ) : null}

      {arrangementer?.map((a, i) => {
        const forrige = arrangementer[i - 1];
        const nyManed = !forrige || maned(new Date(forrige.starter)) !== maned(new Date(a.starter));
        return (
          <View key={a.id} style={{ gap: rom.m }}>
            {nyManed ? (
              <Tekst variant="etikett" farget="myk" style={i > 0 ? { marginTop: rom.l } : null}>
                {maned(new Date(a.starter))}
              </Tekst>
            ) : null}
            <Arrangementskort arrangement={a} pameldt={mineSlugger.has(a.slug)} />
          </View>
        );
      })}
    </ScrollView>
  );
}

const stil = StyleSheet.create({
  innhold: { padding: rom.l, paddingBottom: rom.xxxl, gap: rom.m },
  midt: { flex: 1, alignItems: "center", justifyContent: "center" },
  tomt: { paddingVertical: rom.xxxl, gap: rom.s },
});
