import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { farge } from "@/design/tema";
import { registrerEnhet } from "@/lib/api";

/**
 * Push-varsler. Appen sender tre slag, og ikke flere enn det:
 *
 *  · det trengs frivillige til noe nytt
 *  · noen har meldt avbud, og det er blitt en plass ledig
 *  · påminnelse dagen før en vakt du har sagt ja til
 *
 * De to første går til alle som har appen — det er hele poenget: den som
 * kan steppe inn er som regel ikke den som alt står på lista. Derfor spør
 * vi om lov allerede i velkomsten, og ikke først ved påmelding.
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
    name: "Frivillige",
    description:
      "Når det trengs folk til noe nytt, når noen melder avbud, og dagen før en vakt du har sagt ja til.",
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: farge.gran,
  });
}

/**
 * Ber om lov og henter tokenet. Returnerer null hvis brukeren sier nei,
 * eller vi kjører i simulator der push ikke finnes — begge deler er greit,
 * resten av appen virker uansett.
 *
 * `spor: false` henter bare tokenet hvis lov alt er gitt, uten å vise
 * spørsmålet. Det er varianten oppstarten bruker.
 */
export async function hentPushToken({ spor = true }: { spor?: boolean } = {}): Promise<
  string | null
> {
  if (!Device.isDevice) return null;

  try {
    await forberedAndroidKanal();

    const { status: eksisterende } = await Notifications.getPermissionsAsync();
    let status = eksisterende;
    if (status !== "granted") {
      if (!spor) return null;
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

/**
 * Melder telefonen inn hos menigheten. Kalles ved oppstart uten å mase
 * (`spor: false`), og med spørsmålet når man sier ja i velkomsten.
 */
export async function meldInnEnhet({ spor = false }: { spor?: boolean } = {}) {
  const token = await hentPushToken({ spor });
  if (!token) return null;
  await registrerEnhet(token);
  return token;
}
