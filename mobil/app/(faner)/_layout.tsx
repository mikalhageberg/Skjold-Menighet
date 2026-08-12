import { Tabs } from "expo-router";
import { StyleSheet, View, type ColorValue } from "react-native";
import { farge, skrift, storrelse } from "@/design/tema";

/**
 * To faner er nok: det som trenger folk, og det du har sagt ja til.
 * Ikonene er enkle former i stedet for et ikonbibliotek — en fylt sirkel
 * (kirkeårets knute) og en hake.
 */
export default function Faner() {
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
          height: 88,
          paddingTop: 10,
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
