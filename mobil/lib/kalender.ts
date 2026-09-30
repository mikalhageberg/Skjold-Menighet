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
  /** «Jeg bidrar med», slik man skrev det da man sa ja. */
  bidrag?: string | null;
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

    // Bidraget står under beskrivelsen, så man ser hva man lovet å ta med
    // uten å måtte åpne appen.
    const notater = [
      arrangement.ingress,
      arrangement.bidrag ? `Du bidrar med: ${arrangement.bidrag}` : null,
    ]
      .filter(Boolean)
      .join("\n\n");

    await Calendar.createEventAsync(kalenderId, {
      title: arrangement.tittel,
      startDate: start,
      endDate: slutt,
      location: arrangement.sted,
      notes: notater || undefined,
      timeZone: "Europe/Oslo",
      alarms: [{ relativeOffset: -60 * 24 }],
    });

    return { ok: true };
  } catch (feil) {
    console.warn("Kunne ikke legge i kalenderen", feil);
    return { ok: false, grunn: "feilet" };
  }
}
