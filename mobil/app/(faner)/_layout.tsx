import { Tabs } from "expo-router";
import { Platform, StyleSheet, Text, View, type ColorValue } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { farge, MAKS_TITTELSKALA, skrift, storrelse } from "@/design/tema";
import { Tekst } from "@/design/Grunnelementer";
import { useTekstskala } from "@/design/tekstskala";

/** Høyden fanelinja trenger til ikon og etikett, uten systemlinja. */
const FANEHOYDE = 72;

/** Linjehøyden til faneetiketten ved normal tekststørrelse. */
const ETIKETTLINJE = 17;

/**
 * To faner er nok: det som trenger folk, og det du har sagt ja til.
 * Ikonene er enkle former i stedet for et ikonbibliotek — en fylt sirkel
 * (kirkeårets knute) og en hake.
 */
export default function Faner() {
  // Android tegner kant-til-kant, så navigasjonslinja nederst ligger oppå
  // appen. Den plassen må legges til høyden, ikke tas fra den: React
  // Navigation regner den inn selv, men bare når «height» ikke er satt —
  // en fast høyde kortslutter hele utregningen (se BottomTabBar).
  const insets = useSafeAreaInsets();

  // Faneetikettene er navigasjon, og vokser som titlene: med, men bare
  // til MAKS_TITTELSKALA. «Vi trenger deg» får ellers ikke plass på en
  // vanlig Android-telefon med største tekst. På iPhone vokser de ikke i
  // det hele tatt — der vises de forstørret når man holder fingeren på
  // fanen, slik Apple gjør det selv. Linja må vokse like mye som
  // etiketten, ellers klippes den i bunnen av den faste høyden.
  const { skala } = useTekstskala();
  const etikettskala = Platform.OS === "ios" ? 1 : Math.min(skala, MAKS_TITTELSKALA);
  const ekstra = Math.ceil(ETIKETTLINJE * (etikettskala - 1));

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: farge.kalk },
        headerShadowVisible: false,
        headerTitleAlign: "left",
        tabBarActiveTintColor: farge.gran,
        tabBarInactiveTintColor: farge.granSvak,
        tabBarStyle: {
          backgroundColor: farge.kalk,
          borderTopColor: farge.strek,
          height: FANEHOYDE + ekstra + insets.bottom,
          paddingTop: 10,
          paddingBottom: insets.bottom,
        },
        // Egen etikett i stedet for React Navigation sin, fordi den ikke tar
        // imot noe tak på tekststørrelsen. Forstørrelsen ved langt trykk på
        // iPhone settes på selve fanen, og virker like fullt.
        tabBarLabel: ({ color, children }) => (
          <Text
            style={[stil.etikett, { color }]}
            numberOfLines={1}
            allowFontScaling={Platform.OS !== "ios"}
            maxFontSizeMultiplier={MAKS_TITTELSKALA}
          >
            {children}
          </Text>
        ),
        sceneStyle: { backgroundColor: farge.kalk },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Vi trenger deg",
          headerTitle: overskrift("Skjold menighet"),
          tabBarIcon: ({ color }) => <Ring farge={color} />,
        }}
      />
      <Tabs.Screen
        name="mine"
        options={{
          title: "Mine vakter",
          headerTitle: overskrift("Mine vakter"),
          tabBarIcon: ({ color }) => <Hake farge={color} />,
        }}
      />
    </Tabs>
  );
}

/**
 * Overskriften øverst på fanen. Tegnes med Tekst, så den får samme skrift og
 * samme tak på tekststørrelsen som de andre titlene — overskriften har fast
 * høyde, og uten taket kuttes den både i bunnen og i enden.
 *
 * Settes per fane fordi overskriften og fanenavnet er forskjellige («Skjold
 * menighet» over, «Vi trenger deg» under), og en tekst per fane ville
 * overstyrt en felles funksjon.
 */
function overskrift(tekst: string) {
  return function Overskrift() {
    return (
      <Tekst variant="mellom" accessibilityRole="header" numberOfLines={1}>
        {tekst}
      </Tekst>
    );
  };
}

function Ring({ farge: f }: { farge: ColorValue }) {
  return <View style={[stil.ring, { borderColor: f }]} />;
}

function Hake({ farge: f }: { farge: ColorValue }) {
  return (
    <View style={stil.hakefelt}>
      <View style={[stil.hake, { borderColor: f }]} />
    </View>
  );
}

const stil = StyleSheet.create({
  etikett: {
    fontFamily: skrift.tekstMedium,
    fontSize: storrelse.etikett + 1,
    lineHeight: ETIKETTLINJE,
    textAlign: "center",
  },
  ring: { width: 20, height: 20, borderRadius: 10, borderWidth: 2.5 },
  hakefelt: { width: 24, height: 24, alignItems: "center", justifyContent: "center" },
  hake: {
    width: 10,
    height: 17,
    borderRightWidth: 2.5,
    borderBottomWidth: 2.5,
    transform: [{ rotate: "45deg" }],
    marginTop: -4,
  },
});
