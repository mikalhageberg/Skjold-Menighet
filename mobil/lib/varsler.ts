import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { farge } from "@/design/tema";

/**
 * Push-varsler: påminnelse dagen før et arrangement man er påmeldt.
 *
 * Vi spør om lov først når noen faktisk melder seg på — ikke ved oppstart.
 * Da vet folk hva de sier ja til, og de som bare bladde i lista slipper
 * et spørsmål de ikke har forutsetning for å svare på.
 */

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function forberedAndroidKanal() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("paaminnelser", {
    name: "Påminnelser",
    description: "Beskjed dagen før et arrangement du er påmeldt.",
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: farge.gran,
  });
}

/**
 * Ber om lov og henter tokenet. Returnerer null hvis brukeren sier nei,
 * eller vi kjører i simulator der push ikke finnes — begge deler er greit,
 * påmeldingen går gjennom uansett.
 */
export async function hentPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null;

  try {
    await forberedAndroidKanal();

    const { status: eksisterende } = await Notifications.getPermissionsAsync();
    let status = eksisterende;
    if (status !== "granted") {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== "granted") return null;

    const prosjektId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    const { data } = await Notifications.getExpoPushTokenAsync(
      prosjektId ? { projectId: prosjektId } : undefined,
    );
    return data;
  } catch (feil) {
    console.warn("Kunne ikke hente push-token", feil);
    return null;
  }
}
