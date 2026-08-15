import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Tekst } from "@/design/Grunnelementer";
import { farge, rom, TREFF } from "@/design/tema";

/**
 * Vår egen tilbakeknapp, i stedet for den iOS lager selv.
 *
 * Systemets knapp henter teksten sin fra tittelen på forrige skjerm, og
 * fanene våre har ingen header å hente den fra. Verre: kommer man hit fra
 * et pushvarsel, finnes det ingen skjerm å gå tilbake til — og da sitter
 * man fast. Derfor sjekker vi om det er noe å gå tilbake til, og går til
 * forsiden hvis ikke.
 *
 * Trykkflaten er hele raden og minst 52 punkter høy. En stor del av dem
 * som skal bruke dette er godt voksne, og en pil på 20 punkter er ikke nok.
 */
export function Tilbakeknapp({ fra = "Tilbake" }: { fra?: string }) {
  const router = useRouter();

  function tilbake() {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  return (
    <Pressable
      onPress={tilbake}
      accessibilityRole="button"
      accessibilityLabel={`Tilbake til ${fra}`}
      hitSlop={8}
      style={({ pressed }) => [stil.knapp, pressed && stil.trykket]}
    >
      <View style={stil.pil}>
        <View style={stil.pilspiss} />
      </View>
      <Tekst variant="mellom" farget="messing" halvfet numberOfLines={1}>
        {fra}
      </Tekst>
    </Pressable>
  );
}

const stil = StyleSheet.create({
  knapp: {
    flexDirection: "row",
    alignItems: "center",
    gap: rom.s,
    minHeight: TREFF,
    paddingRight: rom.l,
    paddingLeft: rom.s,
    alignSelf: "flex-start",
    borderRadius: 4,
  },
  trykket: { backgroundColor: farge.kalkDyp },
  // Pila tegnes for hånd. Et ikonbibliotek for én strek ville vært å dra
  // inn et helt lass med SVG for ingenting.
  pil: { width: 18, height: 18, alignItems: "center", justifyContent: "center" },
  pilspiss: {
    width: 11,
    height: 11,
    borderLeftWidth: 2.5,
    borderBottomWidth: 2.5,
    borderColor: farge.messing,
    transform: [{ rotate: "45deg" }],
    marginLeft: 4,
  },
});
