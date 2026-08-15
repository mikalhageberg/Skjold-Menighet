import { Tabs } from "expo-router";
import { StyleSheet, View, type ColorValue } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { farge, skrift, storrelse } from "@/design/tema";

/** Høyden fanelinja trenger til ikon og etikett, uten systemlinja. */
const FANEHOYDE = 72;

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

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: farge.kalk },
        headerShadowVisible: false,
        headerTitleStyle: {
          fontFamily: skrift.display,
          fontSize: storrelse.mellom,
          color: farge.gran,
        },
        headerTitleAlign: "left",
        tabBarActiveTintColor: farge.gran,
        tabBarInactiveTintColor: farge.granSvak,
        tabBarStyle: {
          backgroundColor: farge.kalk,
          borderTopColor: farge.strek,
          height: FANEHOYDE + insets.bottom,
          paddingTop: 10,
          paddingBottom: insets.bottom,
        },
        tabBarLabelStyle: {
          fontFamily: skrift.tekstMedium,
          fontSize: storrelse.etikett + 1,
        },
        sceneStyle: { backgroundColor: farge.kalk },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Vi trenger deg",
          headerTitle: "Skjold menighet",
          tabBarIcon: ({ color }) => <Ring farge={color} />,
        }}
      />
      <Tabs.Screen
        name="mine"
        options={{
          title: "Mine vakter",
          headerTitle: "Mine vakter",
          tabBarIcon: ({ color }) => <Hake farge={color} />,
        }}
      />
    </Tabs>
  );
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
