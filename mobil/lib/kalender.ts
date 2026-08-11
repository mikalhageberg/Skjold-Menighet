import { Platform } from "react-native";
import * as Calendar from "expo-calendar";

/**
 * «Legg i kalenderen» — arrangementet havner i telefonens egen kalender med
 * en påminnelse dagen før, slik at det dukker opp der folk allerede ser.
 */

export type Kalenderresultat =
  | { ok: true }
  | { ok: false; grunn: "nektet" | "ingen-kalender" | "feilet" };

async function finnKalender(): Promise<string | null> {
  if (Platform.OS === "ios") {
    const standard = await Calendar.getDefaultCalendarAsync();
    if (standard?.allowsModifications) return standard.id;
  }

  const alle = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const skrivbar = alle.find(
    (k) => k.allowsModifications && k.accessLevel !== Calendar.CalendarAccessLevel.READ,
  );
  return skrivbar?.id ?? null;
}

export async function leggIKalender(arrangement: {
  tittel: string;
  starter: string;
  slutter: string | null;
  sted: string;
  ingress: string | null;
}): Promise<Kalenderresultat> {
  try {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== "granted") return { ok: false, grunn: "nektet" };

    const kalenderId = await finnKalender();
    if (!kalenderId) return { ok: false, grunn: "ingen-kalender" };

    const start = new Date(arrangement.starter);
    const slutt = arrangement.slutter
      ? new Date(arrangement.slutter)
      : new Date(start.getTime() + 2 * 3600_000);

    await Calendar.createEventAsync(kalenderId, {
      title: arrangement.tittel,
      startDate: start,
      endDate: slutt,
      location: arrangement.sted,
      notes: arrangement.ingress ?? undefined,
      timeZone: "Europe/Oslo",
      alarms: [{ relativeOffset: -60 * 24 }],
    });

    return { ok: true };
  } catch (feil) {
    console.warn("Kunne ikke legge i kalenderen", feil);
    return { ok: false, grunn: "feilet" };
  }
}
