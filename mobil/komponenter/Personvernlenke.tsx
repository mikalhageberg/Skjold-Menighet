import { Linking, Pressable, StyleSheet } from "react-native";
import { Tekst } from "@/design/Grunnelementer";
import { rom, TREFF } from "@/design/tema";
import { API_BASE } from "@/lib/api";

/**
 * Lenke til personvernerklæringen, som ligger på nettsidene.
 *
 * Både App Store og Google Play krever at erklæringen er å finne inne i
 * appen, ikke bare i butikkoppføringen. Den står to steder: i velkomsten,
 * der man første gang gir fra seg noe, og under Mine vakter, der man leter
 * når man vil ha noe slettet.
 */
export function Personvernlenke() {
  return (
    <Pressable
      onPress={() => Linking.openURL(`${API_BASE}/personvern`)}
      accessibilityRole="link"
      accessibilityLabel="Les personvernerklæringen"
      style={stil.lenke}
    >
      <Tekst variant="liten" farget="messing">
        Slik tar vi vare på opplysningene dine
      </Tekst>
    </Pressable>
  );
}

const stil = StyleSheet.create({
  lenke: { alignSelf: "flex-start", paddingVertical: rom.s, minHeight: TREFF },
});
